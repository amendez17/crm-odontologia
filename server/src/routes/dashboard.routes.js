const express = require('express');
const { Cita, Paciente, Pago, Presupuesto, Usuario } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const router = express.Router();

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const [
      totalPacientes,
      citasHoy,
      citasPendientes,
      ingresosMes,
      proximasCitas,
      pacientesRecientes,
      presupuestosPendientes
    ] = await Promise.all([
      Paciente.count({ where: { activo: true } }),

      Cita.count({ where: { fecha: hoy } }),

      Cita.count({
        where: { fecha: hoy, estado: { [Op.in]: ['programada', 'confirmada'] } }
      }),

      Pago.sum('monto', {
        where: {
          fecha: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              .toISOString().split('T')[0]
          }
        }
      }),

      Cita.findAll({
        where: {
          fecha: { [Op.gte]: hoy },
          estado: { [Op.in]: ['programada', 'confirmada'] }
        },
        include: [
          { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido'] },
          { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }
        ],
        order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
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
          { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    // Estadísticas por doctor
    const doctores = await Usuario.findAll({
      where: { rol: 'doctor', activo: true },
      attributes: ['id', 'nombre', 'apellido', 'especialidad']
    });

    const mesActual = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const doctorStats = await Promise.all(doctores.map(async (doc) => {
      const [citasMes, citasCompletadas, ingresos] = await Promise.all([
        Cita.count({ where: { doctor_id: doc.id, fecha: { [Op.gte]: mesActual } } }),
        Cita.count({ where: { doctor_id: doc.id, fecha: { [Op.gte]: mesActual }, estado: 'completada' } }),
        Pago.sum('monto', {
          include: [{ model: Presupuesto, as: 'presupuesto', attributes: [], where: { doctor_id: doc.id }, required: true }],
          where: { fecha: { [Op.gte]: mesActual } }
        })
      ]);
      return {
        id: doc.id,
        nombre: `Dr. ${doc.nombre} ${doc.apellido}`,
        especialidad: doc.especialidad || 'General',
        citasMes,
        citasCompletadas,
        ingresos: ingresos || 0
      };
    }));

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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
