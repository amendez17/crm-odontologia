const express = require('express');
const { Cita, Paciente, Pago, Presupuesto, Tratamiento, DetallePresupuesto, Usuario } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const router = express.Router();

// GET /api/reportes/ingresos - Ingresos por período
router.get('/ingresos', auth, async (req, res) => {
  try {
    const { desde, hasta, agrupacion = 'dia' } = req.query;
    const where = {};

    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    } else {
      // Último mes por defecto
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      where.fecha = { [Op.gte]: inicio };
    }

    let groupExpr;
    if (agrupacion === 'mes') {
      groupExpr = [fn('DATE_FORMAT', col('fecha'), '%Y-%m')];
    } else if (agrupacion === 'semana') {
      groupExpr = [fn('DATE_FORMAT', col('fecha'), '%x-W%v')];
    } else {
      groupExpr = [col('fecha')];
    }

    const ingresos = await Pago.findAll({
      where,
      attributes: [
        [groupExpr[0], 'periodo'],
        [fn('SUM', col('monto')), 'total'],
        [fn('COUNT', col('id')), 'cantidad']
      ],
      group: ['periodo'],
      order: [[literal('periodo'), 'ASC']],
      raw: true
    });

    const totalGeneral = ingresos.reduce((s, i) => s + parseFloat(i.total), 0);

    // Ingresos por método de pago
    const porMetodo = await Pago.findAll({
      where,
      attributes: [
        'metodo_pago',
        [fn('SUM', col('monto')), 'total'],
        [fn('COUNT', col('id')), 'cantidad']
      ],
      group: ['metodo_pago'],
      raw: true
    });

    res.json({ ingresos, totalGeneral, porMetodo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reportes/citas - Estadísticas de citas
router.get('/citas', auth, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};

    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    } else {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      where.fecha = { [Op.gte]: inicio };
    }

    const porEstado = await Cita.findAll({
      where,
      attributes: [
        'estado',
        [fn('COUNT', col('Cita.id')), 'cantidad']
      ],
      group: ['estado'],
      raw: true
    });

    const porDoctor = await Cita.findAll({
      where,
      attributes: [
        'doctor_id',
        [fn('COUNT', col('Cita.id')), 'cantidad']
      ],
      include: [{ model: Usuario, as: 'doctor', attributes: ['nombre', 'apellido'] }],
      group: ['doctor_id', 'doctor.id', 'doctor.nombre', 'doctor.apellido'],
      raw: true
    });

    const totalCitas = porEstado.reduce((s, e) => s + parseInt(e.cantidad), 0);
    const completadas = porEstado.find(e => e.estado === 'completada');
    const noAsistio = porEstado.find(e => e.estado === 'no_asistio');
    const tasaAsistencia = totalCitas > 0
      ? ((parseInt(completadas?.cantidad || 0) / totalCitas) * 100).toFixed(1)
      : 0;

    res.json({
      totalCitas,
      tasaAsistencia,
      noAsistieron: parseInt(noAsistio?.cantidad || 0),
      porEstado,
      porDoctor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reportes/tratamientos-populares
router.get('/tratamientos-populares', auth, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};
    if (desde && hasta) {
      where.createdAt = { [Op.between]: [desde, hasta] };
    }

    const populares = await DetallePresupuesto.findAll({
      where,
      attributes: [
        'tratamiento_id',
        [fn('COUNT', col('DetallePresupuesto.id')), 'cantidad'],
        [fn('SUM', col('DetallePresupuesto.precio')), 'ingresos']
      ],
      include: [{ model: Tratamiento, as: 'tratamiento', attributes: ['nombre', 'precio'] }],
      group: ['tratamiento_id', 'tratamiento.id', 'tratamiento.nombre', 'tratamiento.precio'],
      order: [[literal('cantidad'), 'DESC']],
      limit: 15,
      raw: true
    });

    res.json(populares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reportes/pacientes-deuda - Pacientes con deuda pendiente
router.get('/pacientes-deuda', auth, async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { activo: true },
      include: [
        {
          model: Presupuesto, as: 'presupuestos',
          where: { estado: { [Op.in]: ['aceptado', 'en_curso'] } },
          required: true,
          attributes: ['id', 'total']
        },
        {
          model: Pago, as: 'pagos',
          attributes: ['monto'],
          required: false
        }
      ]
    });

    const deudores = pacientes.map(p => {
      const totalPresupuestos = p.presupuestos.reduce((s, pr) => s + parseFloat(pr.total), 0);
      const totalPagado = p.pagos.reduce((s, pa) => s + parseFloat(pa.monto), 0);
      const deuda = totalPresupuestos - totalPagado;
      return {
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        dni: p.dni,
        telefono: p.telefono,
        totalPresupuestos,
        totalPagado,
        deuda
      };
    }).filter(p => p.deuda > 0).sort((a, b) => b.deuda - a.deuda);

    res.json(deudores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reportes/balance/:pacienteId - Balance individual de un paciente
router.get('/balance/:pacienteId', auth, async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.pacienteId, {
      attributes: ['id', 'nombre', 'apellido', 'dni']
    });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });

    const presupuestos = await Presupuesto.findAll({
      where: { paciente_id: req.params.pacienteId, estado: { [Op.ne]: 'rechazado' } },
      include: [
        { model: DetallePresupuesto, as: 'detalles', include: [{ model: Tratamiento, as: 'tratamiento', attributes: ['nombre'] }] },
        { model: Pago, as: 'pagos' }
      ]
    });

    const totalPresupuestado = presupuestos.reduce((s, p) => s + parseFloat(p.total), 0);
    const totalPagado = presupuestos.reduce((s, p) => {
      return s + p.pagos.reduce((sp, pago) => sp + parseFloat(pago.monto), 0);
    }, 0);

    // Pagos sin presupuesto asociado
    const pagosLibres = await Pago.findAll({
      where: { paciente_id: req.params.pacienteId, presupuesto_id: null }
    });
    const totalPagosLibres = pagosLibres.reduce((s, p) => s + parseFloat(p.monto), 0);

    res.json({
      paciente,
      totalPresupuestado,
      totalPagado: totalPagado + totalPagosLibres,
      saldo: totalPresupuestado - totalPagado - totalPagosLibres,
      presupuestos: presupuestos.map(p => ({
        id: p.id,
        total: p.total,
        estado: p.estado,
        pagado: p.pagos.reduce((s, pa) => s + parseFloat(pa.monto), 0),
        detalles: p.detalles
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
