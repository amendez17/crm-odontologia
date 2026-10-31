const express = require('express');
const { Op, fn, col } = require('sequelize');
const {
  Paciente, Cita, Pago, Presupuesto, Usuario, CrmOportunidad, CrmEtapa, CrmTarea,
  CrmCampana, CrmCampanaDestinatario
} = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

const fechaLocal = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mazatlan'
}).format(date);

const sumarDias = (date, dias) => {
  const copia = new Date(date);
  copia.setDate(copia.getDate() + dias);
  return copia;
};

const diasDesde = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date(`${fechaLocal()}T12:00:00`);
  const anterior = new Date(`${fecha}T12:00:00`);
  return Math.max(0, Math.floor((hoy - anterior) / 86400000));
};

const proximoCumpleanios = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date(`${fechaLocal()}T12:00:00`);
  const nacimiento = new Date(`${fechaNacimiento}T12:00:00`);
  let proximo = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate(), 12);
  if (proximo < hoy) proximo = new Date(hoy.getFullYear() + 1, nacimiento.getMonth(), nacimiento.getDate(), 12);
  return { fecha: fechaLocal(proximo), dias: Math.ceil((proximo - hoy) / 86400000) };
};

router.get('/resumen', auth, async (_req, res) => {
  try {
    const hoy = fechaLocal();
    const hasta = fechaLocal(sumarDias(new Date(), 30));

    const [pacientes, visitas, pagos, futuras, agenda, pipeline] = await Promise.all([
      Paciente.findAll({
        where: { activo: true },
        attributes: ['id', 'nombre', 'apellido', 'telefono', 'fecha_nacimiento', 'createdAt'],
        raw: true
      }),
      Cita.findAll({
        where: { estado: 'completada' },
        attributes: [
          'paciente_id',
          [fn('COUNT', col('id')), 'cantidad'],
          [fn('MAX', col('fecha')), 'ultima_visita']
        ],
        group: ['paciente_id'],
        raw: true
      }),
      Pago.findAll({
        attributes: [
          'paciente_id',
          [fn('COUNT', col('id')), 'cantidad'],
          [fn('SUM', col('monto')), 'total']
        ],
        group: ['paciente_id'],
        raw: true
      }),
      Cita.findAll({
        where: {
          fecha: { [Op.gte]: hoy },
          estado: { [Op.in]: ['programada', 'confirmada', 'en_curso'] }
        },
        attributes: ['paciente_id'],
        raw: true
      }),
      Cita.findAll({
        where: {
          fecha: { [Op.between]: [hoy, hasta] },
          estado: { [Op.in]: ['programada', 'confirmada', 'en_curso'] }
        },
        include: [
          { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'telefono'] },
          { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }
        ],
        order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
        limit: 8
      }),
      Presupuesto.findAll({
        where: { estado: { [Op.in]: ['pendiente', 'aceptado', 'en_curso'] } },
        attributes: ['id', 'estado', 'total'],
        raw: true
      })
    ]);

    const [pipelineCrm, tareasCrm, campanasCrm] = await Promise.all([
      CrmOportunidad.findAll({
        where: { estado: 'ABIERTA' },
        include: [{ model: CrmEtapa, as: 'etapa', attributes: ['probabilidad'] }]
      }),
      CrmTarea.findAll({
        where: { estado: 'PENDIENTE' },
        include: [{ model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'telefono'] }],
        order: [['vence', 'ASC']],
        limit: 6
      }),
      CrmCampana.findAll({
        include: [{ model: CrmCampanaDestinatario, as: 'destinatarios', attributes: ['estado', 'ingreso_atribuido'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    const visitaPorPaciente = new Map(visitas.map(v => [Number(v.paciente_id), {
      cantidad: Number(v.cantidad || 0),
      ultimaVisita: v.ultima_visita,
      dias: diasDesde(v.ultima_visita)
    }]));
    const pagoPorPaciente = new Map(pagos.map(p => [Number(p.paciente_id), {
      cantidad: Number(p.cantidad || 0),
      total: Number(p.total || 0)
    }]));
    const conCitaFutura = new Set(futuras.map(c => Number(c.paciente_id)));

    const pacientesConVisita = visitas.length;
    const pacientesRecurrentes = visitas.filter(v => Number(v.cantidad) >= 2).length;
    const totalIngresos = pagos.reduce((suma, pago) => suma + Number(pago.total || 0), 0);
    const totalPagos = pagos.reduce((suma, pago) => suma + Number(pago.cantidad || 0), 0);
    const clientesConPago = pagos.length;

    const clasificados = pacientes.map(paciente => {
      const visita = visitaPorPaciente.get(Number(paciente.id));
      const pago = pagoPorPaciente.get(Number(paciente.id));
      const riesgo = Boolean(visita && visita.dias >= 120 && !conCitaFutura.has(Number(paciente.id)));
      let segmento = 'activos';
      if (!visita) segmento = 'prospectos';
      else if (riesgo) segmento = 'riesgo';
      else if (visita.cantidad >= 3 && visita.dias <= 180) segmento = 'frecuentes';
      return { ...paciente, visita, pago, segmento };
    });

    const segmentos = ['frecuentes', 'activos', 'riesgo', 'prospectos'].map(nombre => ({
      nombre,
      cantidad: clasificados.filter(p => p.segmento === nombre).length
    }));

    const requierenAtencion = clasificados
      .filter(p => p.segmento === 'riesgo')
      .sort((a, b) => (b.visita?.dias || 0) - (a.visita?.dias || 0))
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono,
        dias_sin_visita: p.visita.dias,
        ultima_visita: p.visita.ultimaVisita,
        valor_historico: p.pago?.total || 0
      }));

    const mejoresClientes = clasificados
      .filter(p => p.pago?.total > 0)
      .sort((a, b) => b.pago.total - a.pago.total)
      .slice(0, 5)
      .map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido, total: p.pago.total, visitas: p.visita?.cantidad || 0 }));

    const cumpleanios = pacientes
      .map(p => ({ ...p, proximo: proximoCumpleanios(p.fecha_nacimiento) }))
      .filter(p => p.proximo && p.proximo.dias <= 14)
      .sort((a, b) => a.proximo.dias - b.proximo.dias)
      .slice(0, 6)
      .map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido, fecha: p.proximo.fecha, dias: p.proximo.dias }));

    const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const ahora = new Date();
    const nuevosPorMes = Array.from({ length: 6 }, (_, indice) => {
      const fechaMes = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - indice), 1);
      const anio = fechaMes.getFullYear();
      const mes = fechaMes.getMonth();
      return {
        clave: `${anio}-${String(mes + 1).padStart(2, '0')}`,
        etiqueta: mesesCortos[mes],
        cantidad: pacientes.filter(paciente => {
          const alta = new Date(paciente.createdAt);
          return alta.getFullYear() === anio && alta.getMonth() === mes;
        }).length
      };
    });

    const campanas = campanasCrm.map(campana => {
      const destinatarios = campana.destinatarios || [];
      return {
        id: campana.id,
        nombre: campana.nombre,
        segmento: campana.segmento,
        estado: campana.estado,
        enviados: destinatarios.filter(d => ['ENVIADO', 'RESPONDIO', 'CITA'].includes(d.estado)).length,
        citas: destinatarios.filter(d => d.estado === 'CITA').length,
        ingresos: destinatarios.reduce((suma, d) => suma + Number(d.ingreso_atribuido || 0), 0)
      };
    });

    res.json({
      metricas: {
        clientes_activos: pacientes.length,
        tasa_recompra: pacientesConVisita ? Math.round((pacientesRecurrentes / pacientesConVisita) * 100) : 0,
        valor_por_cliente: clientesConPago ? totalIngresos / clientesConPago : 0,
        ticket_promedio: totalPagos ? totalIngresos / totalPagos : 0,
        clientes_riesgo: clasificados.filter(p => p.segmento === 'riesgo').length,
        pipeline_valor: pipelineCrm.length
          ? pipelineCrm.reduce((suma, oportunidad) => suma + Number(oportunidad.valor || 0) * Number(oportunidad.etapa?.probabilidad || 0) / 100, 0)
          : pipeline.reduce((suma, oportunidad) => suma + Number(oportunidad.total || 0), 0),
        pipeline_cantidad: pipelineCrm.length || pipeline.length
      },
      segmentos,
      requieren_atencion: requierenAtencion,
      agenda,
      tareas: tareasCrm,
      cumpleanios,
      mejores_clientes: mejoresClientes,
      nuevos_por_mes: nuevosPorMes,
      campanas,
      ventas_atribuidas_mes: campanas.reduce((suma, campana) => suma + campana.ingresos, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
