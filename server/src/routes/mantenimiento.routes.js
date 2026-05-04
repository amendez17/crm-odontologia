const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer para recibir el archivo .sql de restauración
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .sql'));
    }
  }
});

// ─── Tablas que conservamos (NO se borran en reset) ───────────────────────────
const TABLAS_CONSERVAR = new Set([
  'usuarios',
  'configuracion',
  'categorias_tratamiento',
]);

// ─── BACKUP ───────────────────────────────────────────────────────────────────
router.get('/backup', auth, esAdmin, async (req, res) => {
  try {
    const [databases] = await sequelize.query('SELECT DATABASE() AS db');
    const dbName = databases[0]?.db;
    if (!dbName) return res.status(500).json({ error: 'No se pudo determinar la base de datos activa' });

    // Obtener todas las tablas
    const [tablas] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${dbName}' ORDER BY table_name`
    );

    let sql = `-- ============================================================\n`;
    sql += `-- Copia de seguridad OdontoCRM\n`;
    sql += `-- Base de datos: ${dbName}\n`;
    sql += `-- Fecha: ${new Date().toLocaleString('es-PE')}\n`;
    sql += `-- ============================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS=0;\n`;
    sql += `SET NAMES utf8mb4;\n\n`;

    for (const row of tablas) {
      const tableName = row.table_name || row.TABLE_NAME;

      // Estructura de tabla
      const [createResult] = await sequelize.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSQL = createResult[0]['Create Table'] || createResult[0]['create table'];
      sql += `-- ─────────────────────────────────────\n`;
      sql += `-- Tabla: ${tableName}\n`;
      sql += `-- ─────────────────────────────────────\n`;
      sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sql += `${createSQL};\n\n`;

      // Datos
      const [filas] = await sequelize.query(`SELECT * FROM \`${tableName}\``);
      if (filas.length > 0) {
        const columnas = Object.keys(filas[0]).map(c => `\`${c}\``).join(', ');
        const valores = filas.map(fila => {
          const vals = Object.values(fila).map(v => {
            if (v === null) return 'NULL';
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof v === 'number' || typeof v === 'bigint') return v;
            const escaped = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            return `'${escaped}'`;
          }).join(', ');
          return `(${vals})`;
        }).join(',\n  ');
        sql += `INSERT INTO \`${tableName}\` (${columnas}) VALUES\n  ${valores};\n\n`;
      }
    }

    sql += `SET FOREIGN_KEY_CHECKS=1;\n`;

    const fechaStr = new Date().toISOString().slice(0, 10);
    const fileName = `backup_odonto_${fechaStr}.sql`;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', Buffer.byteLength(sql, 'utf8'));
    return res.end(sql, 'utf8');
  } catch (err) {
    console.error('Error en backup:', err);
    return res.status(500).json({ error: 'Error al generar la copia de seguridad', detalle: err.message });
  }
});

// ─── RESTAURAR ────────────────────────────────────────────────────────────────
router.post('/restaurar', auth, esAdmin, upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo .sql' });

  const sqlContent = req.file.buffer.toString('utf8');

  // ── Parser robusto de sentencias SQL ──────────────────────────────────────
  // Respeta comillas simples, dobles y backticks para no partir dentro de strings
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let i = 0;

  while (i < sqlContent.length) {
    const ch = sqlContent[i];
    const next = sqlContent[i + 1];

    // Saltar comentarios de línea (fuera de strings)
    if (!inSingleQuote && !inDoubleQuote && !inBacktick && ch === '-' && next === '-') {
      while (i < sqlContent.length && sqlContent[i] !== '\n') i++;
      i++;
      continue;
    }
    // Saltar comentarios de bloque /* ... */
    if (!inSingleQuote && !inDoubleQuote && !inBacktick && ch === '/' && next === '*') {
      i += 2;
      while (i < sqlContent.length && !(sqlContent[i] === '*' && sqlContent[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Toggle comillas (con escape \\)
    if (ch === "'" && !inDoubleQuote && !inBacktick) {
      if (inSingleQuote && next === "'") { current += "''"; i += 2; continue; }
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    // Separador de sentencias
    if (ch === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const stmt = current.trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }
  // última sentencia sin ;
  if (current.trim().length > 0) statements.push(current.trim());

  // ── Ejecutar sentencias ───────────────────────────────────────────────────
  // MySQL: DDL (DROP/CREATE/ALTER) causa commit implícito, así que NO usamos transacción.
  // En su lugar: deshabilitamos FK, ejecutamos todo, re-habilitamos FK.
  const errores = [];
  let ejecutadas = 0;

  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('SET NAMES utf8mb4');

    for (const stmt of statements) {
      const upper = stmt.toUpperCase().trimStart();
      // Omitir SET statements de charset/FK que ya manejamos
      if (upper.startsWith('SET FOREIGN_KEY_CHECKS') || upper.startsWith('SET NAMES')) continue;
      // Omitir líneas vacías
      if (stmt.length < 3) continue;

      try {
        await sequelize.query(stmt + ';');
        ejecutadas++;
      } catch (err) {
        // Guardar error pero continuar con las demás sentencias
        errores.push({ sentencia: stmt.substring(0, 80) + '...', error: err.message });
        console.error('SQL error en restauración:', err.message, '\n  stmt:', stmt.substring(0, 120));
      }
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    if (errores.length > 0 && ejecutadas === 0) {
      return res.status(500).json({
        error: 'No se pudo restaurar ninguna sentencia',
        errores: errores.slice(0, 5)
      });
    }

    res.json({
      ok: true,
      mensaje: `Base de datos restaurada: ${ejecutadas} sentencias ejecutadas${errores.length > 0 ? `, ${errores.length} omitidas` : ''}`,
      ejecutadas,
      errores: errores.slice(0, 10)
    });
  } catch (err) {
    try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
    console.error('Error crítico en restauración:', err);
    res.status(500).json({ error: 'Error al restaurar la base de datos', detalle: err.message });
  }
});

// ─── RESET (Nueva empresa) ────────────────────────────────────────────────────
router.post('/reset', auth, esAdmin, async (req, res) => {
  const { confirmacion } = req.body;
  if (confirmacion !== 'RESET SISTEMA') {
    return res.status(400).json({ error: 'Confirmación incorrecta. Escribe exactamente: RESET SISTEMA' });
  }

  try {
    // 1) Obtener base de datos activa
    const [[{ db }]] = await sequelize.query('SELECT DATABASE() AS db');

    // 2) Obtener todas las tablas reales de la BD
    const [todasTablas] = await sequelize.query(
      `SELECT table_name AS tabla FROM information_schema.tables
       WHERE table_schema = '${db}' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );

    // 3) Filtrar las que SÍ se van a borrar
    const tablasBorrar = todasTablas
      .map(r => r.tabla || r.TABLE_NAME)
      .filter(t => !TABLAS_CONSERVAR.has(t));

    // 4) Deshabilitar FK, borrar con DELETE (más tolerante que TRUNCATE con FK), rehabilitar
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tabla of tablasBorrar) {
      await sequelize.query(`DELETE FROM \`${tabla}\``);
      // Reset auto_increment
      try {
        await sequelize.query(`ALTER TABLE \`${tabla}\` AUTO_INCREMENT = 1`);
      } catch (_) { /* tabla sin PK autoincrement, ignorar */ }
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    res.json({
      ok: true,
      mensaje: 'Sistema reseteado correctamente. Listo para nueva empresa.',
      tablasBorradas: tablasBorrar
    });
  } catch (err) {
    console.error('Error en reset:', err);
    // Asegurarnos de re-habilitar FK
    try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
    res.status(500).json({ error: 'Error al resetear el sistema', detalle: err.message });
  }
});

// ─── ESTADÍSTICAS de la BD ────────────────────────────────────────────────────
router.get('/estadisticas', auth, esAdmin, async (req, res) => {
  try {
    const [databases] = await sequelize.query('SELECT DATABASE() AS db');
    const dbName = databases[0]?.db;

    const [stats] = await sequelize.query(`
      SELECT
        table_name AS tabla,
        table_rows AS filas,
        ROUND((data_length + index_length) / 1024, 2) AS tamano_kb
      FROM information_schema.tables
      WHERE table_schema = '${dbName}'
      ORDER BY table_rows DESC
    `);

    const [sizeResult] = await sequelize.query(`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_mb
      FROM information_schema.tables
      WHERE table_schema = '${dbName}'
    `);

    res.json({
      tablas: stats,
      total_mb: sizeResult[0]?.total_mb || 0,
      base_datos: dbName,
      fecha: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas', detalle: err.message });
  }
});

module.exports = router;
