const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { HistoriaClinica, ArchivoHistoria, Usuario, Cita } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

const contenidoFirma = data => JSON.stringify({
  paciente_id: Number(data.paciente_id),
  doctor_id: Number(data.doctor_id),
  fecha_hora: new Date(data.fecha_hora).toISOString(),
  diagnostico: data.diagnostico || '',
  tratamiento_realizado: data.tratamiento_realizado || '',
  piezas_tratadas: data.piezas_tratadas || '',
  receta: data.receta || '',
  proxima_visita: data.proxima_visita || '',
  notas: data.notas || '',
  es_adenda: Boolean(data.es_adenda),
  historia_origen_id: data.historia_origen_id ? Number(data.historia_origen_id) : null,
  motivo_adenda: data.motivo_adenda || '',
  registro_previo_hash: data.registro_previo_hash || ''
});

const firmarRegistro = data => crypto
  .createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(contenidoFirma(data))
  .digest('hex');

const crearRegistroInmutable = async ({ body, usuario, origen = null }) => {
  const fechaHora = new Date();
  fechaHora.setMilliseconds(0);
  const previo = await HistoriaClinica.findOne({
    where: { paciente_id: origen?.paciente_id || body.paciente_id },
    order: [['id', 'DESC']]
  });
  const data = {
    diagnostico: body.diagnostico || null,
    tratamiento_realizado: body.tratamiento_realizado || null,
    piezas_tratadas: body.piezas_tratadas || null,
    receta: body.receta || null,
    proxima_visita: body.proxima_visita || null,
    notas: body.notas || null,
    paciente_id: origen?.paciente_id || Number(body.paciente_id),
    cita_id: origen?.cita_id || body.cita_id || null,
    doctor_id: usuario.id,
    doctor_nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
    doctor_cedula: usuario.cedula || null,
    fecha: fechaHora.toISOString().slice(0, 10),
    fecha_hora: fechaHora,
    es_adenda: Boolean(origen),
    historia_origen_id: origen?.id || null,
    motivo_adenda: origen ? body.motivo_adenda : null,
    registro_previo_hash: previo?.firma_hash || null
  };
  data.firma_hash = firmarRegistro(data);
  return HistoriaClinica.create(data);
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP y archivos PDF.'));
    }
    cb(null, true);
  }
});

const subirCloudinary = (file, pacienteId) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({
    folder: `clinica-almar/pacientes/${pacienteId}/historia-clinica`,
    resource_type: 'auto',
    type: 'authenticated',
    use_filename: true,
    unique_filename: true
  }, (error, result) => error ? reject(error) : resolve(result));
  stream.end(file.buffer);
});

const urlTemporal = (archivo) => cloudinary.utils.private_download_url(
  archivo.public_id,
  archivo.formato || undefined,
  {
    resource_type: archivo.resource_type,
    type: archivo.delivery_type || 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + (10 * 60),
    attachment: false
  }
);

// GET /api/historia/:pacienteId
router.get('/:pacienteId', auth, esDoctor, registrarActividad('consultar', 'expediente_clinico', {
  entidadId: req => req.params.pacienteId,
  contexto: req => ({ paciente_id: Number(req.params.pacienteId) })
}), async (req, res) => {
  try {
    const historias = await HistoriaClinica.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'cedula'] },
        { model: Cita, as: 'cita' },
        { model: ArchivoHistoria, as: 'archivos', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }] }
      ],
      order: [['fecha', 'DESC']]
    });
    const respuesta = historias.map(historia => {
      const data = historia.toJSON();
      data.integridad_valida = data.firma_hash ? firmarRegistro(data) === data.firma_hash : null;
      data.archivos = (data.archivos || []).map(archivo => ({
        ...archivo,
        url: urlTemporal(archivo),
        public_id: undefined
      }));
      return data;
    });
    res.json(respuesta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/historia/:historiaId/archivos
router.post('/:historiaId/archivos', auth, esDoctor, registrarActividad('anexar_archivo', 'historia_clinica', {
  entidadId: req => req.params.historiaId,
  contexto: (_req, respuesta) => ({ total_archivos: respuesta?.total || 0 })
}), upload.array('archivos', 10), async (req, res) => {
  const subidos = [];
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ error: 'El almacenamiento de archivos no está configurado.' });
    }
    const historia = await HistoriaClinica.findByPk(req.params.historiaId);
    if (!historia) return res.status(404).json({ error: 'Registro de historia clínica no encontrado.' });
    if (!req.files?.length) return res.status(400).json({ error: 'Selecciona al menos un archivo.' });

    for (const file of req.files) {
      const resultado = await subirCloudinary(file, historia.paciente_id);
      subidos.push({ resultado, file });
    }

    const archivos = await ArchivoHistoria.bulkCreate(subidos.map(({ resultado, file }) => ({
      historia_id: historia.id,
      usuario_id: req.usuario.id,
      nombre_original: file.originalname,
      tipo: file.mimetype === 'application/pdf' ? 'pdf' : 'imagen',
      mime_type: file.mimetype,
      tamano: file.size,
      url: resultado.secure_url,
      public_id: resultado.public_id,
      resource_type: resultado.resource_type,
      formato: resultado.format || (file.mimetype === 'application/pdf' ? 'pdf' : null),
      delivery_type: resultado.type || 'authenticated'
    })));
    res.status(201).json({ mensaje: 'Archivos guardados correctamente.', total: archivos.length });
  } catch (error) {
    await Promise.allSettled(subidos.map(({ resultado }) =>
      cloudinary.uploader.destroy(resultado.public_id, { resource_type: resultado.resource_type, type: resultado.type || 'authenticated' })
    ));
    res.status(400).json({ error: error.message || 'No fue posible subir los archivos.' });
  }
});

// DELETE /api/historia/archivos/:archivoId
router.delete('/archivos/:archivoId', auth, esDoctor, registrarActividad('intento_eliminar', 'archivo_historia'), async (_req, res) => {
  res.status(409).json({ error: 'Los anexos del expediente no pueden eliminarse. Registra una adenda si necesitas aclarar o sustituir un documento.' });
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError || error?.message?.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Cada archivo debe pesar máximo 10 MB.' : error.message });
  }
  next(error);
});

// POST /api/historia
router.post('/', auth, esDoctor, registrarActividad('crear', 'historia_clinica', {
  contexto: (req, respuesta) => ({ paciente_id: Number(respuesta?.paciente_id || req.body.paciente_id) })
}), async (req, res) => {
  try {
    const historia = await crearRegistroInmutable({ body: req.body, usuario: req.usuario });
    res.status(201).json(historia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/historia/:id/adendas - las correcciones se agregan, nunca sobrescriben
router.post('/:id/adendas', auth, esDoctor, registrarActividad('crear_adenda', 'historia_clinica', {
  contexto: (req, respuesta) => ({ historia_origen_id: Number(req.params.id), paciente_id: Number(respuesta?.paciente_id) || null })
}), async (req, res) => {
  try {
    const origen = await HistoriaClinica.findByPk(req.params.id);
    if (!origen) return res.status(404).json({ error: 'Registro original no encontrado.' });
    if (!req.body.motivo_adenda?.trim()) return res.status(400).json({ error: 'El motivo de la adenda es obligatorio.' });
    const historia = await crearRegistroInmutable({ body: req.body, usuario: req.usuario, origen });
    res.status(201).json(historia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/historia/:id
router.put('/:id', auth, esDoctor, async (req, res) => {
  res.status(409).json({ error: 'Las notas clínicas son inmutables. Registra una adenda para corregir o ampliar información.' });
});

module.exports = router;
