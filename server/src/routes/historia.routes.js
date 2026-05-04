const express = require('express');
const { HistoriaClinica, Paciente, Usuario, Cita } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const router = express.Router();

// GET /api/historia/:pacienteId
router.get('/:pacienteId', auth, async (req, res) => {
  try {
    const historias = await HistoriaClinica.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] },
        { model: Cita, as: 'cita' }
      ],
      order: [['fecha', 'DESC']]
    });
    res.json(historias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
