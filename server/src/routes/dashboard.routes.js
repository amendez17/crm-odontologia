const express = require('express');
const { Cita, Paciente, Pago, Presupuesto, Usuario } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const router = express.Router();

function getFechaLocal(date = new Date()) {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {

    const hoy = getFechaLocal();

    const [
      totalPacientes,
      citasHoy,
      citasPendientes,
      ingresosMes,
      proximasCitas,
      pacientesRecientes,
      presupuestosPendientes
    ] = await Promise.all([

      Paciente.count({
        where: { activo: true }
      }),

      Cita.count({
        where: { fecha: hoy }
      }),

      Cita.count({
        where: {
          fecha: hoy,
          estado: {
            [Op.in]: ['programada', 'confirmada']
          }
        }
      }),

      Pago.sum('monto', {
        where: {
          fecha: {
            [Op.gte]: getFechaLocal(
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              )
            )
          }
        }
      }),

      Cita.findAll({
        where: {
          fecha: {
            [Op.gte]: hoy
          },
          estado: {
            [Op.in]: ['programada', 'confirmada']
          }
        },

        include: [
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['id', 'nombre', 'apellido']
          },

          {
            model: Usuario,
            as: 'doctor',
            attributes: ['id', 'nombre', 'apellido']
          }
        ],

        order: [
          ['fecha', 'ASC'],
          ['hora_inicio', 'ASC']
        ],

        limit: 10
      }),

      Paciente.findAll({
        where: { activo: true },
        order: [['createdAt', 'DESC']],
        limit: 5
      }),

      Presupuesto.findAll({
        where: { estado: 'pendiente' },

        include: [
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['id', 'nombre', 'apellido']
          }
        ],

        order: [['createdAt', 'DESC']],
        limit: 5
      })

    ]);

    // Estadísticas por doctor

    const doctores = await Usuario.findAll({
      where: {
        rol: 'doctor',
        activo: true
      },

      attributes: [
        'id',
        'nombre',
        'apellido',
        'especialidad'
      ]
    });

    const { desde, hasta } = req.query;

    const hoyDate = new Date();

    const inicioMes = getFechaLocal(
      new Date(
        hoyDate.getFullYear(),
        hoyDate.getMonth(),
        1
      )
    );

    const filtroFechas =
      desde && hasta
        ? { [Op.between]: [desde, hasta] }
        : { [Op.gte]: inicioMes };

    const doctorStats = await Promise.all(
      doctores.map(async (doc) => {

        const [
          citasMes,
          citasCompletadas,
          pagos
        ] = await Promise.all([

          Cita.count({
            where: {
              doctor_id: doc.id,
              fecha: filtroFechas
            }
          }),

          Cita.count({
            where: {
              doctor_id: doc.id,
              fecha: filtroFechas,
              estado: 'completada'
            }
          }),

          Pago.findAll({

            include: [
              {
                model: Presupuesto,
                as: 'presupuesto',
                required: true,

                attributes: ['doctor_id'],

                where: {
                  doctor_id: doc.id
                }
              }
            ],

            where: {
              fecha: filtroFechas
            },

            attributes: ['monto']
          })
        ]);

        const ingresos = pagos.reduce(
          (s, p) => s + parseFloat(p.monto || 0),
          0
        );

        return {
          id: doc.id,
          nombre: `Dr. ${doc.nombre} ${doc.apellido}`,
          especialidad: doc.especialidad || 'General',
          citasMes,
          citasCompletadas,
          ingresos
        };
      })
    );

    res.json({
      estadisticas: {
        totalPacientes,
        citasHoy,
        citasPendientes,
        ingresosMes: ingresosMes || 0
      },

      proximasCitas,
      pacientesRecientes,
      presupuestosPendientes,
      doctorStats
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
