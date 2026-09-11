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
router.post(
  '/',
  auth,
  registrarActividad('crear', 'pago'),
  async (req, res) => {

    try {

      const {
        presupuesto_id,
        monto
      } = req.body;

      let presupuesto = null;

      // SOLO SI EL PAGO TIENE PRESUPUESTO
      if (presupuesto_id) {

        // BUSCAR PRESUPUESTO
        presupuesto = await Presupuesto.findByPk(
          presupuesto_id,
          {
            include: [
              {
                model: Pago,
                as: 'pagos'
              }
            ]
          }
        );

        if (!presupuesto) {
          return res.status(404).json({
            error: 'Presupuesto no encontrado.'
          });
        }

        // TOTAL PAGADO
        const totalPagado = presupuesto.pagos.reduce(
          (sum, p) => sum + parseFloat(p.monto),
          0
        );

        // SALDO RESTANTE
        const saldoRestante =
          parseFloat(presupuesto.total) -
          totalPagado;

        // YA LIQUIDADO
        if (saldoRestante <= 0) {
          return res.status(400).json({
            error: 'El presupuesto ya está liquidado.'
          });
        }

        // SOBREPAGO
        if (parseFloat(monto) > saldoRestante) {
          return res.status(400).json({
            error: `El pago excede el saldo restante de $${saldoRestante.toLocaleString()}`
          });
        }
      }

      // CREAR PAGO
      const pago = await Pago.create({
        ...req.body,
        requiere_factura: req.body.requiere_factura === true,
        factura_emitida: false,
        fecha_factura: null
      });

     // SI HAY PRESUPUESTO → ACTUALIZAR ESTADO
if (presupuesto) {

  const totalPagadoActualizado =
    presupuesto.pagos.reduce(
      (sum, p) => sum + parseFloat(p.monto),
      0
    ) + parseFloat(monto);

  const totalPresupuesto =
    parseFloat(presupuesto.total);

  let nuevoEstado = 'pendiente';

  // SIN PAGOS
  if (totalPagadoActualizado <= 0) {

    nuevoEstado = 'pendiente';

  }

  // PAGO PARCIAL
  else if (
    totalPagadoActualizado < totalPresupuesto
  ) {

    nuevoEstado = 'en_curso';

  }

  // LIQUIDADO
  else {

    nuevoEstado = 'finalizado';

  }

  await presupuesto.update({
    estado: nuevoEstado
  });
}
      // PAGO COMPLETO
      const pagoCompleto = await Pago.findByPk(
        pago.id,
        {
          include: [
            {
              model: Paciente,
              as: 'paciente',
              attributes: [
                'id',
                'nombre',
                'apellido'
              ]
            },
            {
              model: Presupuesto,
              as: 'presupuesto'
            }
          ]
        }
      );

      // SOCKET
      req.io.emit(
        'pago-creado',
        pagoCompleto
      );

      // ACTUALIZAR PRESUPUESTO EN TIEMPO REAL
      if (presupuesto) {

        const presupuestoActualizado =
          await Presupuesto.findByPk(
            presupuesto.id,
            {
              include: [
                {
                  model: Paciente,
                  as: 'paciente'
                },
                {
                  model: Pago,
                  as: 'pagos'
                }
              ]
            }
          );

        req.app.get('io').emit(
          'presupuesto_actualizado',
          presupuestoActualizado
        );
      }

      res.status(201).json(
        pagoCompleto
      );

    } catch (error) {

      res.status(400).json({
        error: error.message
      });

    }
  }
);
// DELETE /api/pagos/:id
router.delete(
  '/:id',
  auth,
  registrarActividad('eliminar', 'pago'),
  async (req, res) => {

    try {

      const pago = await Pago.findByPk(req.params.id);

      if (!pago) {
        return res.status(404).json({
          error: 'Pago no encontrado.'
        });
      }

      const presupuestoId = pago.presupuesto_id;

      await pago.destroy();

      // SOCKET PAGO ELIMINADO
      req.app.get('io').emit(
        'pago-eliminado',
        pago.id
      );

      // RECALCULAR PRESUPUESTO
      if (presupuestoId) {

        const presupuesto =
          await Presupuesto.findByPk(
            presupuestoId,
            {
              include: [
                {
                  model: Pago,
                  as: 'pagos'
                }
              ]
            }
          );

        if (presupuesto) {

          const totalPagado =
            presupuesto.pagos.reduce(
              (sum, p) =>
                sum + parseFloat(p.monto),
              0
            );

          const totalPresupuesto =
            parseFloat(presupuesto.total);

          let nuevoEstado = 'pendiente';

          // SIN PAGOS
          if (totalPagado <= 0) {

            nuevoEstado = 'pendiente';

          }

          // PAGO PARCIAL
          else if (
            totalPagado < totalPresupuesto
          ) {

            nuevoEstado = 'en_curso';

          }

          // LIQUIDADO
          else {

            nuevoEstado = 'finalizado';

          }

          await presupuesto.update({
            estado: nuevoEstado
          });

          // SOCKET PRESUPUESTO ACTUALIZADO
          const presupuestoActualizado =
            await Presupuesto.findByPk(
              presupuesto.id,
              {
                include: [
                  {
                    model: Paciente,
                    as: 'paciente'
                  },
                  {
                    model: Pago,
                    as: 'pagos'
                  }
                ]
              }
            );

          req.app.get('io').emit(
            'presupuesto_actualizado',
            presupuestoActualizado
          );
        }
      }

      res.json({
        message: 'Pago eliminado.'
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }
  }
);


module.exports = router;
