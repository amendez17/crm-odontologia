const express = require('express');
const { Odontograma, Paciente, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const router = express.Router();

// GET /api/odontograma/:pacienteId
router.get('/:pacienteId', auth, async (req, res) => {
  try {
    const registros = await Odontograma.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['fecha', 'DESC'], ['pieza_dental', 'ASC']]
    });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/odontograma
router.post('/', auth, esDoctor, async (req, res) => {
  try {
    const registro = await Odontograma.create({
      ...req.body,
      doctor_id: req.usuario.id
    });
    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/odontograma/:id
router.put('/:id', auth, esDoctor, async (req, res) => {
  try {
    const registro = await Odontograma.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado.' });
    await registro.update(req.body);
    res.json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/odontograma/:id
router.delete('/:id', auth, esDoctor, async (req, res) => {
  try {
    const registro = await Odontograma.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado.' });
    await registro.destroy();
    res.json({ message: 'Registro eliminado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
