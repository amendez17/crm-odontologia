const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream/promises');

const MAGIC = Buffer.from('ODONTOB1');
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;

const deriveKey = (secret, salt) => crypto.scryptSync(secret, salt, 32);

async function encryptFile(inputPath, outputPath, secret) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secret, salt), iv);
  const output = fs.createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
  output.write(Buffer.concat([MAGIC, salt, iv]));
  await pipeline(fs.createReadStream(inputPath), cipher, output);
  await fs.promises.appendFile(outputPath, cipher.getAuthTag());
}

async function decryptFile(inputPath, outputPath, secret) {
  const handle = await fs.promises.open(inputPath, 'r');
  try {
    const stat = await handle.stat();
    const headerSize = MAGIC.length + SALT_BYTES + IV_BYTES;
    if (stat.size <= headerSize + TAG_BYTES) throw new Error('El respaldo cifrado está incompleto.');

    const header = Buffer.alloc(headerSize);
    await handle.read(header, 0, header.length, 0);
    if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Formato de respaldo no reconocido.');

    const tag = Buffer.alloc(TAG_BYTES);
    await handle.read(tag, 0, TAG_BYTES, stat.size - TAG_BYTES);
    const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_BYTES);
    const iv = header.subarray(MAGIC.length + SALT_BYTES);
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(secret, salt), iv);
    decipher.setAuthTag(tag);

    await pipeline(
      fs.createReadStream(inputPath, { start: headerSize, end: stat.size - TAG_BYTES - 1 }),
      decipher,
      fs.createWriteStream(outputPath, { flags: 'wx', mode: 0o600 })
    );
  } finally {
    await handle.close();
  }
}

module.exports = { encryptFile, decryptFile };
