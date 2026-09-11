const express = require('express');
const { Odontograma, Paciente, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

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
    const nuevaVersion = await Odontograma.create({
      paciente_id: registro.paciente_id,
      pieza_dental: registro.pieza_dental,
      cara: req.body.cara || registro.cara,
      estado: req.body.estado || registro.estado,
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
