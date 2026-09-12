#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
const { v2: cloudinary } = require('cloudinary');
const { google } = require('googleapis');
const { encryptFile, decryptFile } = require('./lib/backup-crypto');

const REQUIRED = [
  'BACKUP_DATABASE_URL', 'BACKUP_ENCRYPTION_KEY',
  'GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  'RESTORE_TEST_DATABASE_URL'
];

const missing = REQUIRED.filter(name => !process.env[name]);
if (missing.length) {
  console.error(`Faltan variables requeridas: ${missing.join(', ')}`);
  process.exit(2);
}
if (process.env.BACKUP_ENCRYPTION_KEY.length < 32) {
  console.error('BACKUP_ENCRYPTION_KEY debe tener al menos 32 caracteres.');
  process.exit(2);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const sha256File = async filePath => {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
};

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve() : reject(new Error(`${command} terminó con código ${code}: ${stderr.slice(-1500)}`)));
});

const databaseOptions = value => {
  const url = new URL(value);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, ''))
  };
};

const mysqlCliArgs = options => [
  `--host=${options.host}`, `--port=${options.port}`, `--user=${options.user}`,
  '--protocol=TCP', '--default-character-set=utf8mb4', options.database
];

async function getTableCounts(databaseUrl) {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [tables] = await connection.query(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    const counts = {};
    for (const { name } of tables) {
      const safeName = String(name).replace(/`/g, '');
      const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${safeName}\``);
      counts[safeName] = Number(row.total);
    }
    return counts;
  } finally {
    await connection.end();
  }
}

async function dumpDatabase(databaseUrl, targetPath) {
  const options = databaseOptions(databaseUrl);
  const output = fs.openSync(targetPath, 'wx', 0o600);
  try {
    await run('mysqldump', [
      ...mysqlCliArgs(options).slice(0, -1), '--single-transaction', '--quick', '--skip-lock-tables',
      '--routines', '--triggers', '--events', '--hex-blob', '--no-tablespaces', options.database
    ], { env: { ...process.env, MYSQL_PWD: options.password }, stdio: ['ignore', output, 'pipe'] });
  } finally {
    fs.closeSync(output);
  }
}

async function createConsistentDatabaseCopy(databaseUrl, targetPath) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const before = await getTableCounts(databaseUrl);
    if (fs.existsSync(targetPath)) await fs.promises.unlink(targetPath);
    await dumpDatabase(databaseUrl, targetPath);
    const after = await getTableCounts(databaseUrl);
    if (JSON.stringify(before) === JSON.stringify(after)) return after;
    console.log(`La base cambió durante la copia; repitiendo intento ${attempt}/3...`);
  }
  throw new Error('La base cambió durante tres intentos; no se puede certificar una copia consistente ahora.');
}

async function listCloudinaryAssets() {
  const assets = new Map();
  for (const resourceType of ['image', 'raw', 'video']) {
    for (const type of ['authenticated', 'upload', 'private']) {
      let nextCursor;
      do {
        const page = await cloudinary.api.resources({
          resource_type: resourceType,
          type,
          prefix: process.env.CLOUDINARY_BACKUP_PREFIX || 'clinica-almar/pacientes',
          max_results: 500,
          next_cursor: nextCursor
        });
        for (const asset of page.resources || []) {
          assets.set(`${asset.resource_type}:${asset.type}:${asset.public_id}`, asset);
        }
        nextCursor = page.next_cursor;
      } while (nextCursor);
    }
  }
  return [...assets.values()];
}

async function downloadAsset(asset, targetPath) {
  const url = cloudinary.utils.private_download_url(asset.public_id, asset.format || undefined, {
    resource_type: asset.resource_type,
    type: asset.type,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    attachment: false
  });
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Cloudinary respondió ${response.status} para ${asset.public_id}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(targetPath, { flags: 'wx', mode: 0o600 }));
}

async function backupCloudinary(directory) {
  const assets = await listCloudinaryAssets();
  const entries = [];
  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    const extension = asset.format ? `.${String(asset.format).replace(/[^a-z0-9]/gi, '')}` : '';
    const storedName = `${crypto.createHash('sha256').update(`${asset.resource_type}:${asset.type}:${asset.public_id}`).digest('hex')}${extension}`;
    const target = path.join(directory, storedName);
    await downloadAsset(asset, target);
    const stat = await fs.promises.stat(target);
    entries.push({
      stored_name: storedName,
      public_id: asset.public_id,
      resource_type: asset.resource_type,
      delivery_type: asset.type,
      format: asset.format || null,
      bytes: stat.size,
      sha256: await sha256File(target)
    });
    console.log(`Archivo ${index + 1}/${assets.length} respaldado.`);
  }
  return entries;
}

function createDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth });
}

async function getOrCreateDriveFolder(drive) {
  const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || 'Respaldos CRM Odontología';
  const escapedName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    spaces: 'drive',
    fields: 'files(id,name)',
    pageSize: 10
  });
  if (existing.data.files?.length) return existing.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      appProperties: { application: 'crm-odontologia-backup' }
    },
    fields: 'id'
  });
  if (!created.data.id) throw new Error('Google Drive no devolvió el identificador de la carpeta.');
  return created.data.id;
}

async function putDriveFile(drive, folderId, name, filePath, contentType) {
  const { size } = await fs.promises.stat(filePath);
  const uploaded = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      appProperties: { application: 'crm-odontologia-backup' }
    },
    media: { mimeType: contentType, body: fs.createReadStream(filePath) },
    fields: 'id,name,size,md5Checksum,createdTime'
  });
  if (!uploaded.data.id || Number(uploaded.data.size) !== size) {
    throw new Error('El tamaño almacenado en Google Drive no coincide con el archivo enviado.');
  }
  return uploaded.data;
}

async function getDriveFile(drive, fileId, filePath) {
  const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  await pipeline(response.data, fs.createWriteStream(filePath, { flags: 'wx', mode: 0o600 }));
}

async function verifyArchiveContents(extractedDir) {
  const manifestPath = path.join(extractedDir, 'manifest.json');
  const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
  const databasePath = path.join(extractedDir, 'database.sql');
  if (await sha256File(databasePath) !== manifest.database.sha256) {
    throw new Error('El SQL no coincide con el SHA-256 del manifiesto.');
  }
  if ((await fs.promises.stat(databasePath)).size !== manifest.database.bytes) {
    throw new Error('El tamaño del SQL no coincide con el manifiesto.');
  }

  for (const asset of manifest.cloudinary.assets) {
    if (path.basename(asset.stored_name) !== asset.stored_name) throw new Error('Nombre de archivo inválido en el manifiesto.');
    const assetPath = path.join(extractedDir, 'files', asset.stored_name);
    const stat = await fs.promises.stat(assetPath);
    if (stat.size !== asset.bytes || await sha256File(assetPath) !== asset.sha256) {
      throw new Error(`El archivo ${asset.stored_name} no coincide con el manifiesto.`);
    }
  }
  return manifest;
}

async function verifyRestoration(encryptedPath, workDir, expectedCounts) {
  const downloadedArchive = path.join(workDir, 'downloaded.tar.gz.enc');
  const decryptedArchive = path.join(workDir, 'restored.tar.gz');
  const extractedDir = path.join(workDir, 'restored');
  await fs.promises.mkdir(extractedDir);
  await fs.promises.copyFile(encryptedPath, downloadedArchive);
  await decryptFile(downloadedArchive, decryptedArchive, process.env.BACKUP_ENCRYPTION_KEY);
  await run('tar', ['-xzf', decryptedArchive, '-C', extractedDir]);
  const manifest = await verifyArchiveContents(extractedDir);
  if (JSON.stringify(manifest.database.table_counts) !== JSON.stringify(expectedCounts)) {
    throw new Error('Los conteos del manifiesto no coinciden con la copia recién creada.');
  }

  const testOptions = databaseOptions(process.env.RESTORE_TEST_DATABASE_URL);
  const sqlInput = fs.openSync(path.join(extractedDir, 'database.sql'), 'r');
  try {
    await run('mysql', mysqlCliArgs(testOptions), {
      env: { ...process.env, MYSQL_PWD: testOptions.password },
      stdio: [sqlInput, 'pipe', 'pipe']
    });
  } finally {
    fs.closeSync(sqlInput);
  }
  const restoredCounts = await getTableCounts(process.env.RESTORE_TEST_DATABASE_URL);
  const mismatches = Object.entries(expectedCounts).filter(([table, count]) => restoredCounts[table] !== count);
  if (mismatches.length) {
    throw new Error(`La restauración no coincide en ${mismatches.length} tabla(s): ${mismatches.slice(0, 5).map(([name]) => name).join(', ')}`);
  }
  return {
    ok: true,
    tables_verified: Object.keys(expectedCounts).length,
    files_verified: manifest.cloudinary.assets.length
  };
}

async function main() {
  const startedAt = new Date();
  const timestamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'odonto-backup-'));
  const contentDir = path.join(workDir, 'content');
  const filesDir = path.join(contentDir, 'files');
  const archivePath = path.join(workDir, 'backup.tar.gz');
  const encryptedPath = `${archivePath}.enc`;
  const backupName = `backup-${timestamp}.tar.gz.enc`;
  const reportName = `backup-${timestamp}.verification.json`;
  const drive = createDriveClient();

  try {
    await fs.promises.mkdir(filesDir, { recursive: true });
    console.log('Generando copia consistente de MySQL...');
    const databasePath = path.join(contentDir, 'database.sql');
    const expectedCounts = await createConsistentDatabaseCopy(process.env.BACKUP_DATABASE_URL, databasePath);

    console.log('Descargando archivos clínicos autenticados...');
    const assets = await backupCloudinary(filesDir);
    const manifest = {
      format_version: 1,
      created_at: startedAt.toISOString(),
      database: {
        file: 'database.sql',
        sha256: await sha256File(databasePath),
        bytes: (await fs.promises.stat(databasePath)).size,
        table_counts: expectedCounts
      },
      cloudinary: { prefix: process.env.CLOUDINARY_BACKUP_PREFIX || 'clinica-almar/pacientes', assets }
    };
    await fs.promises.writeFile(path.join(contentDir, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
    await run('tar', ['-czf', archivePath, '-C', contentDir, '.']);
    await encryptFile(archivePath, encryptedPath, process.env.BACKUP_ENCRYPTION_KEY);
    const encryptedSha256 = await sha256File(encryptedPath);

    console.log('Cargando respaldo cifrado en Google Drive privado...');
    const folderId = await getOrCreateDriveFolder(drive);
    const uploadedBackup = await putDriveFile(drive, folderId, backupName, encryptedPath, 'application/octet-stream');
    const downloadedPath = path.join(workDir, 'from-storage.tar.gz.enc');
    await getDriveFile(drive, uploadedBackup.id, downloadedPath);
    if (await sha256File(downloadedPath) !== encryptedSha256) throw new Error('El SHA-256 descargado no coincide con el respaldo enviado.');

    console.log('Restaurando el respaldo descargado en la base temporal...');
    const restoration = await verifyRestoration(downloadedPath, workDir, expectedCounts);
    const report = {
      backup_file_id: uploadedBackup.id,
      backup_file_name: backupName,
      drive_folder_id: folderId,
      created_at: startedAt.toISOString(),
      completed_at: new Date().toISOString(),
      encrypted_sha256: encryptedSha256,
      encrypted_bytes: (await fs.promises.stat(encryptedPath)).size,
      database_tables: Object.keys(expectedCounts).length,
      clinical_files: assets.length,
      restoration
    };
    const reportPath = path.join(workDir, 'verification.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    await putDriveFile(drive, folderId, reportName, reportPath, 'application/json');
    console.log(`Respaldo verificado correctamente en Google Drive: ${backupName}`);
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`Respaldo no verificado: ${error.message}`);
  process.exit(1);
});
