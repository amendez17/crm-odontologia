const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { Op } = require('sequelize');
const { Factura, Pago, Paciente, Usuario, sequelize } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const esFacturacion = (req, res, next) => {
  if (!['administrador', 'recepcionista'].includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso reservado para administración y recepción.' });
  }
  next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const permitidos = ['application/pdf', 'application/xml', 'text/xml'];
    if (!permitidos.includes(file.mimetype)) return cb(new Error('Solo se permiten archivos XML y PDF.'));
    cb(null, true);
  }
});

const subirComprobante = (file, pacienteId) => new Promise((resolve, reject) => {
  const extension = file.mimetype === 'application/pdf' ? 'pdf' : 'xml';
  const nombreBase = file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || extension;
  const stream = cloudinary.uploader.upload_stream({
    folder: `clinica-almar/pacientes/${pacienteId}/facturas`,
    resource_type: 'raw',
    type: 'authenticated',
    public_id: `${nombreBase}-${Date.now()}.${extension}`,
    overwrite: false
  }, (error, result) => error ? reject(error) : resolve(result));
  stream.end(file.buffer);
});

const urlTemporal = (factura, tipo) => {
  const publicId = factura[`${tipo}_public_id`];
  if (!publicId) return null;
  return cloudinary.utils.private_download_url(publicId, factura[`${tipo}_formato`] || undefined, {
    resource_type: factura[`${tipo}_resource_type`] || 'raw',
    type: factura[`${tipo}_delivery_type`] || 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + (10 * 60),
    attachment: false
  });
};

const serializar = registro => {
  const factura = registro.toJSON ? registro.toJSON() : registro;
  return {
    ...factura,
    xml_url: urlTemporal(factura, 'xml'),
    pdf_url: urlTemporal(factura, 'pdf'),
    xml_public_id: undefined,
    pdf_public_id: undefined
  };
};

router.get('/pendientes', auth, esFacturacion, async (_req, res) => {
  try {
    const pagos = await Pago.findAll({
      where: { requiere_factura: true, factura_emitida: false },
      include: [{ model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni', 'email'] }],
      order: [['fecha', 'ASC'], ['id', 'ASC']]
    });
    res.json(pagos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/', auth, esFacturacion, registrarActividad('consultar', 'factura'), async (req, res) => {
  try {
    const { estado, desde, hasta, buscar } = req.query;
    const where = {};
    if (['timbrada', 'cancelada'].includes(estado)) where.estado = estado;
    if (desde || hasta) {
      where.fecha_timbrado = {};
      if (desde) where.fecha_timbrado[Op.gte] = new Date(`${desde}T00:00:00`);
      if (hasta) where.fecha_timbrado[Op.lte] = new Date(`${hasta}T23:59:59`);
    }
    if (buscar?.trim()) {
      const termino = `%${buscar.trim()}%`;
      where[Op.or] = [
        { uuid_fiscal: { [Op.like]: termino } },
        { rfc_receptor: { [Op.like]: termino } },
        { razon_social: { [Op.like]: termino } },
        { folio: { [Op.like]: termino } }
      ];
    }
    const facturas = await Factura.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido'] },
        { model: Pago, as: 'pago', attributes: ['id', 'fecha', 'monto', 'numero_recibo'] },
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre', 'apellido'] }
      ],
      order: [['fecha_timbrado', 'DESC'], ['id', 'DESC']],
      limit: 500
    });
    res.json(facturas.map(serializar));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/pago/:pagoId', auth, esFacturacion, upload.fields([
  { name: 'xml', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), registrarActividad('registrar_timbrado', 'factura', {
  entidadId: (_req, respuesta) => respuesta?.id,
  contexto: req => ({ pago_id: Number(req.params.pagoId) })
}), async (req, res) => {
  const subidos = [];
  let transaction;
  try {
    const xmlFile = req.files?.xml?.[0];
    const pdfFile = req.files?.pdf?.[0];
    if ((xmlFile || pdfFile) && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
      return res.status(503).json({ error: 'El almacenamiento privado de comprobantes no está configurado.' });
    }
    const pago = await Pago.findByPk(req.params.pagoId);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });
    if (!pago.requiere_factura) return res.status(409).json({ error: 'El pago no está marcado como solicitud de factura.' });
    const activa = await Factura.findOne({ where: { pago_id: pago.id, estado: 'timbrada' } });
    if (activa) return res.status(409).json({ error: 'Este pago ya tiene una factura timbrada activa.' });

    const uuid = String(req.body.uuid_fiscal || '').trim().toUpperCase();
    const rfc = String(req.body.rfc_receptor || '').replace(/[^A-Za-z0-9&Ñ]/g, '').toUpperCase();
    const razonSocial = String(req.body.razon_social || '').trim();
    const total = Number(req.body.total);
    const fechaTimbrado = new Date(req.body.fecha_timbrado);
    if (!/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(uuid)) {
      return res.status(400).json({ error: 'El UUID fiscal no tiene un formato válido.' });
    }
    if (!/^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/.test(rfc)) return res.status(400).json({ error: 'El RFC receptor no tiene un formato válido.' });
    if (razonSocial.length < 2 || razonSocial.length > 255) return res.status(400).json({ error: 'Captura una razón social válida.' });
    if (!Number.isFinite(total) || total <= 0 || Math.abs(total - Number(pago.monto)) > 0.01) {
      return res.status(400).json({ error: 'El total de la factura debe coincidir con el monto del pago.' });
    }
    if (Number.isNaN(fechaTimbrado.getTime())) return res.status(400).json({ error: 'La fecha de timbrado no es válida.' });
    const duplicada = await Factura.findOne({ where: { uuid_fiscal: uuid } });
    if (duplicada) return res.status(409).json({ error: 'Ese UUID fiscal ya está registrado.' });

    if (xmlFile) subidos.push({ tipo: 'xml', file: xmlFile, resultado: await subirComprobante(xmlFile, pago.paciente_id) });
    if (pdfFile) subidos.push({ tipo: 'pdf', file: pdfFile, resultado: await subirComprobante(pdfFile, pago.paciente_id) });

    const datosArchivos = {};
    for (const { tipo, file, resultado } of subidos) {
      datosArchivos[`${tipo}_nombre`] = file.originalname;
      datosArchivos[`${tipo}_public_id`] = resultado.public_id;
      datosArchivos[`${tipo}_resource_type`] = resultado.resource_type || 'raw';
      datosArchivos[`${tipo}_formato`] = resultado.format || null;
      datosArchivos[`${tipo}_delivery_type`] = resultado.type || 'authenticated';
    }

    transaction = await sequelize.transaction();
    const factura = await Factura.create({
      pago_id: pago.id,
      paciente_id: pago.paciente_id,
      creado_por_id: req.usuario.id,
      uuid_fiscal: uuid,
      serie: String(req.body.serie || '').trim().slice(0, 25) || null,
      folio: String(req.body.folio || '').trim().slice(0, 50) || null,
      rfc_receptor: rfc,
      razon_social: razonSocial,
      fecha_timbrado: fechaTimbrado,
      total,
      notas: String(req.body.notas || '').trim().slice(0, 5000) || null,
      ...datosArchivos
    }, { transaction });
    await pago.update({ factura_emitida: true, fecha_factura: fechaTimbrado }, { transaction });
    await transaction.commit(); transaction = null;
    res.status(201).json(serializar(factura));
  } catch (error) {
    if (transaction) await transaction.rollback();
    await Promise.allSettled(subidos.map(({ resultado }) => cloudinary.uploader.destroy(resultado.public_id, {
      resource_type: resultado.resource_type || 'raw', type: resultado.type || 'authenticated'
    })));
    res.status(400).json({ error: error.message || 'No fue posible registrar la factura.' });
  }
});

router.put('/:id/cancelar', auth, esAdmin, registrarActividad('cancelar', 'factura'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const motivo = String(req.body.motivo || '').trim();
    if (motivo.length < 5 || motivo.length > 1000) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Captura el motivo de cancelación (5 a 1000 caracteres).' });
    }
    const factura = await Factura.findByPk(req.params.id, { transaction });
    if (!factura) { await transaction.rollback(); return res.status(404).json({ error: 'Factura no encontrada.' }); }
    if (factura.estado === 'cancelada') { await transaction.rollback(); return res.status(409).json({ error: 'La factura ya está cancelada.' }); }
    await factura.update({ estado: 'cancelada', motivo_cancelacion: motivo, fecha_cancelacion: new Date() }, { transaction });
    const otrasActivas = await Factura.count({ where: { pago_id: factura.pago_id, estado: 'timbrada', id: { [Op.ne]: factura.id } }, transaction });
    if (!otrasActivas) await Pago.update({ factura_emitida: false, fecha_factura: null }, { where: { id: factura.pago_id }, transaction });
    await transaction.commit();
    res.json({ mensaje: 'Factura cancelada sin eliminar el historial.', id: factura.id });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ error: error.message });
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError || error?.message?.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Cada archivo debe pesar máximo 10 MB.' : error.message });
  }
  next(error);
});

module.exports = router;
