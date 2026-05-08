const express = require('express');
const { Paciente, Pago, Cita, Usuario, Presupuesto, DetallePresupuesto, Tratamiento } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

function toCSV(headers, rows) {
  const escape = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(',')];
  rows.forEach(row => {
    lines.push(row.map(escape).join(','));
  });
  return '\ufeff' + lines.join('\r\n');
}

// GET /api/exportar/pacientes
router.get('/pacientes', auth, async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { activo: true },
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    const headers = ['Apellido', 'Nombre', 'DNI', 'Teléfono', 'Email', 'Dirección', 'Obra Social', 'N° Afiliado', 'Fecha Nacimiento', 'Género'];
    const rows = pacientes.map(p => [
      p.apellido, p.nombre, p.dni, p.telefono, p.email,
      p.direccion, p.obra_social, p.numero_afiliado, p.fecha_nacimiento, p.genero
    ]);

    const csv = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=pacientes.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exportar/pagos
router.get('/pagos', auth, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};
    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    }

    const pagos = await Pago.findAll({
      where,
      include: [{ model: Paciente, as: 'paciente', attributes: ['nombre', 'apellido', 'dni'] }],
      order: [['fecha', 'DESC']]
    });

    const headers = ['Fecha', 'Paciente', 'DNI', 'Monto', 'Método de Pago', 'N° Recibo', 'Notas'];
    const rows = pagos.map(p => [
      p.fecha,
      `${p.paciente?.apellido} ${p.paciente?.nombre}`,
      p.paciente?.dni,
      p.monto,
      p.metodo_pago?.replace('_', ' '),
      p.numero_recibo,
      p.notas
    ]);

    const csv = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=pagos.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//GET /api/exportar/deudas
router.get('/deudas', auth, async (req, res) => {
  try {

    const pacientes = await Paciente.findAll({
      where: { activo: true },

      include: [
        {
          model: Presupuesto,
          as: 'presupuestos',
          required: false
        },

        {
          model: Pago,
          as: 'pagos',
          required: false
        }
      ]
    });

    const deudores = pacientes.map(p => {

      const totalPresupuestos = p.presupuestos.reduce(
        (s, pr) => s + parseFloat(pr.total || 0),
        0
      );

      const totalPagado = p.pagos.reduce(
        (s, pa) => s + parseFloat(pa.monto || 0),
        0
      );

      const deuda = totalPresupuestos - totalPagado;

      return {
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono,
        deuda
      };

    }).filter(p => p.deuda > 0);

    let csv =
      'Nombre,Apellido,Telefono,Deuda\n';

    deudores.forEach(d => {

      csv +=
        `${d.nombre},${d.apellido},${d.telefono},${d.deuda}\n`;
    });

    res.header(
      'Content-Type',
      'text/csv'
    );

    res.attachment(
      'reporte-deudas.csv'
    );

    return res.send(csv);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

//GET /api/expertar/tratamientos
router.get('/tratamientos', auth, async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    const whereCita = {};

    if (desde && hasta) {

      whereCita.fecha = {
        [Op.between]: [desde, hasta]
      };
    }

    const tratamientos =
      await DetallePresupuesto.findAll({

        attributes: [
          [fn('COUNT', col('DetallePresupuesto.id')), 'cantidad'],
          [fn('SUM', col('DetallePresupuesto.precio')), 'ingresos']
        ],

        include: [

          {
            model: Tratamiento,
            as: 'tratamiento',
            attributes: ['nombre']
          },

          {
            model: Presupuesto,
            as: 'presupuesto',
            required: true,
            attributes: [],

            include: [
              {
                model: Cita,
                as: 'cita',
                required: true,
                attributes: [],
                where: whereCita
              }
            ]
          }
        ],

        group: [
          'tratamiento.id',
          'tratamiento.nombre'
        ],

        raw: true
      });

    let csv =
      'Tratamiento,Cantidad,Ingresos\n';

    tratamientos.forEach(t => {

      csv +=
        `${t['tratamiento.nombre']},${t.cantidad},${t.ingresos}\n`;
    });

    res.header(
      'Content-Type',
      'text/csv'
    );

    res.attachment(
      'reporte-tratamientos.csv'
    );

    return res.send(csv);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});
//GET /api/exportar/doctores
router.get('/doctores', auth, async (req, res) => {
  try {

    const doctores =
      await Usuario.findAll({

        where: {
          rol: 'doctor'
        },

        include: [
          {
            model: Cita,
            as: 'citas',
            required: false
          }
        ]
      });

    let csv =
      'Doctor,Citas\n';

    doctores.forEach(d => {

      csv +=
        `${d.nombre} ${d.apellido},${d.citas.length}\n`;
    });

    res.header(
      'Content-Type',
      'text/csv'
    );

    res.attachment(
      'reporte-doctores.csv'
    );

    return res.send(csv);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});
// GET /api/exportar/citas
router.get('/citas', auth, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};
    if (desde && hasta) {
      where.fecha = { [Op.between]: [desde, hasta] };
    }

    const citas = await Cita.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['nombre', 'apellido', 'dni'] },
        { model: Usuario, as: 'doctor', attributes: ['nombre', 'apellido'] }
      ],
      order: [['fecha', 'DESC'], ['hora_inicio', 'ASC']]
    });

    const headers = ['Fecha', 'Hora Inicio', 'Hora Fin', 'Paciente', 'DNI', 'Doctor', 'Motivo', 'Estado'];
    const rows = citas.map(c => [
      c.fecha, c.hora_inicio, c.hora_fin,
      `${c.paciente?.apellido} ${c.paciente?.nombre}`,
      c.paciente?.dni,
      `Dr. ${c.doctor?.nombre} ${c.doctor?.apellido}`,
      c.motivo, c.estado?.replace('_', ' ')
    ]);

    const csv = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=citas.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exportar/presupuestos
router.get('/presupuestos', auth, async (req, res) => {
  try {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const presupuestos = await Presupuesto.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['nombre', 'apellido', 'dni'] },
        { model: Usuario, as: 'doctor', attributes: ['nombre', 'apellido'] },
        { model: DetallePresupuesto, as: 'detalles', include: [{ model: Tratamiento, as: 'tratamiento', attributes: ['nombre'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const headers = ['#', 'Fecha', 'Paciente', 'DNI', 'Doctor', 'Tratamientos', 'Total', 'Descuento', 'Estado'];
    const rows = presupuestos.map(p => [
      p.id,
      p.createdAt?.toISOString().split('T')[0],
      `${p.paciente?.apellido} ${p.paciente?.nombre}`,
      p.paciente?.dni,
      `Dr. ${p.doctor?.nombre} ${p.doctor?.apellido}`,
      (p.detalles || []).map(d => d.tratamiento?.nombre).filter(Boolean).join('; '),
      p.total,
      p.descuento,
      p.estado?.replace('_', ' ')
    ]);

    const csv = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=presupuestos.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
