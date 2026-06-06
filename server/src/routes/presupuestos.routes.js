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
        { model: DetallePresupuesto, as: 'detalles', include: [{ model: Tratamiento, as: 'tratamiento' }]},
        { model: Pago, as: 'pagos'} ],
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
   const { detalles, cita_id, ...presupuestoData } = req.body;

const presupuesto = await Presupuesto.create({
  ...presupuestoData,
  cita_id
}, { transaction: t });

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
    // SOCKET.IO
req.app.get('io').emit(
  'presupuesto_creado',
  resultado
);

    res.status(201).json(resultado);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});


// PUT /api/presupuestos/:id
router.put(
  '/:id',
  auth,
  registrarActividad('actualizar', 'presupuesto'),
  async (req, res) => {

    const t = await sequelize.transaction();

    try {

      const presupuesto = await Presupuesto.findByPk(
        req.params.id,
        {
          include: [
            {
              model: DetallePresupuesto,
              as: 'detalles'
            }
          ],
          transaction: t
        }
      );

      if (!presupuesto) {

        await t.rollback();

        return res.status(404).json({
          error: 'Presupuesto no encontrado.'
        });
      }

      const {
        paciente_id,
        doctor_id,
        cita_id,
        estado,
        descuento = 0,
        notas,
        detalles
      } = req.body;

      // ACTUALIZAR DATOS PRINCIPALES
      await presupuesto.update({
        paciente_id,
        doctor_id,
        cita_id: cita_id || null,
        estado,
        descuento,
        notas
      }, {
        transaction: t
      });

      // ACTUALIZAR DETALLES
      if (detalles && detalles.length > 0) {

        // BORRAR DETALLES ANTERIORES
        await DetallePresupuesto.destroy({
          where: {
            presupuesto_id: presupuesto.id
          },
          transaction: t
        });

        // CREAR NUEVOS
        const nuevosDetalles = detalles.map(det => ({
          presupuesto_id: presupuesto.id,
          tratamiento_id: det.tratamiento_id,
          pieza_dental: det.pieza_dental || null,
          precio: det.precio
        }));

        await DetallePresupuesto.bulkCreate(
          nuevosDetalles,
          { transaction: t }
        );

        // RECALCULAR TOTAL
       const total = detalles.reduce(
  (sum, d) => sum + parseFloat(d.precio),
  0
);

await presupuesto.update({
  total
});
      }

      await t.commit();

      // RETORNAR PRESUPUESTO ACTUALIZADO
      const actualizado = await Presupuesto.findByPk(
        presupuesto.id,
        {
          include: [
            {
              model: Paciente,
              as: 'paciente'
            },
            {
              model: Usuario,
              as: 'doctor',
              attributes: {
                exclude: ['password']
              }
            },
            {
              model: DetallePresupuesto,
              as: 'detalles',
              include: [
                {
                  model: Tratamiento,
                  as: 'tratamiento'
                }
              ]
            },
            {
              model: Pago,
              as: 'pagos'
            }
          ]
        }
      );
// SOCKET.IO
req.app.get('io').emit(
  'presupuesto_actualizado',
  actualizado
);
      res.json(actualizado);

    } catch (error) {

      await t.rollback();

      res.status(400).json({
        error: error.message
      });
    }
  }
);

// DELETE /api/presupuestos/:id
router.delete(
  '/:id',
  auth,
  registrarActividad('eliminar', 'presupuesto'),
  async (req, res) => {

    try {

      const presupuesto = await Presupuesto.findByPk(
        req.params.id
      );

      if (!presupuesto) {

        return res.status(404).json({
          error: 'Presupuesto no encontrado.'
        });

      }

      const presupuestoId = presupuesto.id;

      // ELIMINAR DETALLES
      await DetallePresupuesto.destroy({
        where: {
          presupuesto_id: presupuesto.id
        }
      });

      // ELIMINAR PRESUPUESTO
      await presupuesto.destroy();

      // SOCKET.IO
      req.app.get('io').emit(
        'presupuesto_eliminado',
        {
          id: presupuestoId
        }
      );

      res.json({
        message: 'Presupuesto eliminado.'
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }
  }
);

module.exports = router;
