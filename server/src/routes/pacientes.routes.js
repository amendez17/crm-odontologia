const express = require('express');
const { Paciente, Cita, Presupuesto, Pago, Odontograma, HistoriaClinica, Usuario } = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/pacientes
router.get('/', auth, async (req, res) => {
  try {
    const { buscar, page = 1, limit = 20 } = req.query;
    const where = { activo: true };

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { dni: { [Op.like]: `%${buscar}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Paciente.findAndCountAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      pacientes: rows,
      total: count,
      pagina: parseInt(page),
      totalPaginas: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pacientes/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id, {
      include: [
        { model: Cita, as: 'citas', include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }], limit: 10, order: [['fecha', 'DESC']] },
        { model: Presupuesto, as: 'presupuestos', include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }] },
        { model: Pago, as: 'pagos', order: [['fecha', 'DESC']] }
      ]
    });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pacientes
router.post('/', auth, registrarActividad('crear', 'paciente'), async (req, res) => {
  try {
    const paciente = await Paciente.create(req.body);
    res.status(201).json(paciente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/pacientes/:id
router.put('/:id', auth, registrarActividad('actualizar', 'paciente'), async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    await paciente.update(req.body);
    res.json(paciente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/pacientes/:id (soft delete)
router.delete('/:id', auth, registrarActividad('eliminar', 'paciente'), async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    await paciente.update({ activo: false });
    res.json({ message: 'Paciente desactivado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
