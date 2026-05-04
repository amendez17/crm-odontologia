const express = require('express');
const { Cita, Paciente, Usuario } = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/citas
router.get('/', auth, async (req, res) => {
  try {
    const { fecha, doctor_id, estado, desde, hasta } = req.query;
    const where = {};

    if (fecha) where.fecha = fecha;
    if (doctor_id) where.doctor_id = doctor_id;
    if (estado) where.estado = estado;
    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    }

    const citas = await Cita.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono'] },
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'especialidad'] }
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/citas/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id, {
      include: [
        { model: Paciente, as: 'paciente' },
        { model: Usuario, as: 'doctor', attributes: { exclude: ['password'] } }
      ]
    });
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada.' });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/citas
router.post('/', auth, registrarActividad('crear', 'cita'), async (req, res) => {
  try {
    const cita = await Cita.create(req.body);
    const citaCompleta = await Cita.findByPk(cita.id, {
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono'] },
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'especialidad'] }
      ]
    });
    res.status(201).json(citaCompleta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/citas/:id
router.put('/:id', auth, registrarActividad('actualizar', 'cita'), async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada.' });
    await cita.update(req.body);
    const citaActualizada = await Cita.findByPk(cita.id, {
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono'] },
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'especialidad'] }
      ]
    });
    res.json(citaActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/citas/:id
router.delete('/:id', auth, registrarActividad('eliminar', 'cita'), async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada.' });
    await cita.destroy();
    res.json({ message: 'Cita eliminada.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
