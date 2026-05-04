const express = require('express');
const { Presupuesto, DetallePresupuesto, Paciente, Usuario, Tratamiento, Pago } = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const sequelize = require('../config/database');
const router = express.Router();

// GET /api/presupuestos
router.get('/', auth, async (req, res) => {
  try {
    const { paciente_id, estado } = req.query;
    const where = {};
    if (paciente_id) where.paciente_id = paciente_id;
    if (estado) where.estado = estado;

    const presupuestos = await Presupuesto.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] },
        { model: DetallePresupuesto, as: 'detalles', include: [{ model: Tratamiento, as: 'tratamiento' }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(presupuestos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/presupuestos/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findByPk(req.params.id, {
      include: [
        { model: Paciente, as: 'paciente' },
        { model: Usuario, as: 'doctor', attributes: { exclude: ['password'] } },
        { model: DetallePresupuesto, as: 'detalles', include: [{ model: Tratamiento, as: 'tratamiento' }] },
        { model: Pago, as: 'pagos' }
      ]
    });
    if (!presupuesto) return res.status(404).json({ error: 'Presupuesto no encontrado.' });
    res.json(presupuesto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/presupuestos
router.post('/', auth, registrarActividad('crear', 'presupuesto'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { detalles, ...presupuestoData } = req.body;

    const presupuesto = await Presupuesto.create(presupuestoData, { transaction: t });

    if (detalles && detalles.length > 0) {
      const detallesConId = detalles.map(d => ({ ...d, presupuesto_id: presupuesto.id }));
      await DetallePresupuesto.bulkCreate(detallesConId, { transaction: t });

      const total = detalles.reduce((sum, d) => sum + parseFloat(d.precio), 0);
      await presupuesto.update({ total }, { transaction: t });
    }

    await t.commit();

    const resultado = await Presupuesto.findByPk(presupuesto.id, {
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido'] },
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] },
        { model: DetallePresupuesto, as: 'detalles', include: [{ model: Tratamiento, as: 'tratamiento' }] }
      ]
    });

    res.status(201).json(resultado);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/presupuestos/:id
router.put('/:id', auth, registrarActividad('actualizar', 'presupuesto'), async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findByPk(req.params.id);
    if (!presupuesto) return res.status(404).json({ error: 'Presupuesto no encontrado.' });
    await presupuesto.update(req.body);
    res.json(presupuesto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/presupuestos/:id
router.delete('/:id', auth, registrarActividad('eliminar', 'presupuesto'), async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findByPk(req.params.id);
    if (!presupuesto) return res.status(404).json({ error: 'Presupuesto no encontrado.' });
    await DetallePresupuesto.destroy({ where: { presupuesto_id: presupuesto.id } });
    await presupuesto.destroy();
    res.json({ message: 'Presupuesto eliminado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
