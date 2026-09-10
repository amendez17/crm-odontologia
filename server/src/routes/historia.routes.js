const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { HistoriaClinica, ArchivoHistoria, Usuario, Cita } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const router = express.Router();

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
    use_filename: true,
    unique_filename: true
  }, (error, result) => error ? reject(error) : resolve(result));
  stream.end(file.buffer);
});

// GET /api/historia/:pacienteId
router.get('/:pacienteId', auth, async (req, res) => {
  try {
    const historias = await HistoriaClinica.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] },
        { model: Cita, as: 'cita' },
        { model: ArchivoHistoria, as: 'archivos', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }] }
      ],
      order: [['fecha', 'DESC']]
    });
    res.json(historias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/historia/:historiaId/archivos
router.post('/:historiaId/archivos', auth, esDoctor, upload.array('archivos', 10), async (req, res) => {
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
      resource_type: resultado.resource_type
    })));
    res.status(201).json(archivos);
  } catch (error) {
    await Promise.allSettled(subidos.map(({ resultado }) =>
      cloudinary.uploader.destroy(resultado.public_id, { resource_type: resultado.resource_type })
    ));
    res.status(400).json({ error: error.message || 'No fue posible subir los archivos.' });
  }
});

// DELETE /api/historia/archivos/:archivoId
router.delete('/archivos/:archivoId', auth, esDoctor, async (req, res) => {
  try {
    const archivo = await ArchivoHistoria.findByPk(req.params.archivoId);
    if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado.' });
    await cloudinary.uploader.destroy(archivo.public_id, { resource_type: archivo.resource_type });
    await archivo.destroy();
    res.json({ mensaje: 'Archivo eliminado correctamente.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'No fue posible eliminar el archivo.' });
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError || error?.message?.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Cada archivo debe pesar máximo 10 MB.' : error.message });
  }
  next(error);
});

// POST /api/historia
router.post('/', auth, esDoctor, async (req, res) => {
  try {
    const historia = await HistoriaClinica.create({
      ...req.body,
      doctor_id: req.usuario.id
    });
    res.status(201).json(historia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/historia/:id
router.put('/:id', auth, esDoctor, async (req, res) => {
  try {
    const historia = await HistoriaClinica.findByPk(req.params.id);
    if (!historia) return res.status(404).json({ error: 'Registro no encontrado.' });
    await historia.update(req.body);
    res.json(historia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
