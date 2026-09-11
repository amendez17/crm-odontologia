const express = require('express');
const { Odontograma, Paciente, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

const DIENTES_VALIDOS = new Set([18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]);
const CARAS_VALIDAS = new Set(['vestibular', 'lingual', 'mesial', 'distal', 'oclusal', 'completa']);
const ESTADOS_COMPLETOS = new Set(['sano', 'corona', 'extraccion', 'endodoncia', 'implante', 'protesis', 'ausente']);
const ESTADOS_POR_CARA = new Set(['sano', 'caries', 'obturacion', 'fractura']);

const validarRegistro = ({ pieza_dental, cara = 'completa', estado = 'sano' }) => {
  if (!DIENTES_VALIDOS.has(Number(pieza_dental))) return 'La pieza dental no es válida.';
  if (!CARAS_VALIDAS.has(cara)) return 'La cara dental no es válida.';
  const estadosPermitidos = cara === 'completa' ? ESTADOS_COMPLETOS : ESTADOS_POR_CARA;
  if (!estadosPermitidos.has(estado)) return `El estado ${estado} no corresponde al modo ${cara === 'completa' ? 'diente completo' : 'por cara'}.`;
  return null;
};

// GET /api/odontograma/:pacienteId
router.get('/:pacienteId', auth, esDoctor, registrarActividad('consultar', 'odontograma', {
  entidadId: req => req.params.pacienteId,
  contexto: req => ({ paciente_id: Number(req.params.pacienteId) })
}), async (req, res) => {
  try {
    const registros = await Odontograma.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/odontograma
router.post('/', auth, esDoctor, registrarActividad('crear', 'odontograma'), async (req, res) => {
  try {
    const errorValidacion = validarRegistro(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });
    const registro = await Odontograma.create({
      paciente_id: req.body.paciente_id,
      pieza_dental: req.body.pieza_dental,
      cara: req.body.cara || 'completa',
      estado: req.body.estado || 'sano',
      observacion: req.body.observacion || null,
      doctor_id: req.usuario.id
    });
    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/odontograma/:id
// Los cambios clínicos no sobrescriben el registro original: generan una nueva
// versión para conservar la trazabilidad del expediente odontológico.
router.put('/:id', auth, esDoctor, registrarActividad('actualizar', 'odontograma'), async (req, res) => {
  try {
    const registro = await Odontograma.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado.' });
    const datosNuevos = {
      pieza_dental: registro.pieza_dental,
      cara: req.body.cara || registro.cara,
      estado: req.body.estado || registro.estado
    };
    const errorValidacion = validarRegistro(datosNuevos);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });
    const nuevaVersion = await Odontograma.create({
      paciente_id: registro.paciente_id,
      pieza_dental: registro.pieza_dental,
      cara: datosNuevos.cara,
      estado: datosNuevos.estado,
      observacion: req.body.observacion ?? registro.observacion,
      doctor_id: req.usuario.id,
      fecha: new Date()
    });
    res.json(nuevaVersion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/odontograma/:id
router.delete('/:id', auth, esDoctor, registrarActividad('intento_eliminar', 'odontograma'), async (_req, res) => {
  res.status(409).json({ error: 'Los registros del odontograma forman parte del expediente y no pueden eliminarse.' });
});

module.exports = router;
