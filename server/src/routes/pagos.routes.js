const express = require('express');
const { Pago, Paciente, Presupuesto } = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/pagos
router.get('/', auth, async (req, res) => {
  try {
    const { paciente_id, presupuesto_id, desde, hasta } = req.query;
    const where = {};
    if (paciente_id) where.paciente_id = paciente_id;
    if (presupuesto_id) where.presupuesto_id = presupuesto_id;
    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    }

    const pagos = await Pago.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
        { model: Presupuesto, as: 'presupuesto' }
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pagos
router.post('/', auth, registrarActividad('crear', 'pago'), async (req, res) => {
  try {
    const pago = await Pago.create(req.body);
    const pagoCompleto = await Pago.findByPk(pago.id, {
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido'] },
        { model: Presupuesto, as: 'presupuesto' }
      ]
    });
    res.status(201).json(pagoCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/pagos/:id
router.delete('/:id', auth, registrarActividad('eliminar', 'pago'), async (req, res) => {
  try {
    const pago = await Pago.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });
    await pago.destroy();
    res.json({ message: 'Pago eliminado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
