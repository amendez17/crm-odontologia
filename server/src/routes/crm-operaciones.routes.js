const express = require('express');
const { Op } = require('sequelize');
const {
  sequelize, Paciente, Usuario, Cita, Pago, Presupuesto,
  CrmEtapa, CrmOportunidad, CrmTarea, CrmNota, CrmPerfil,
  CrmCampana, CrmCampanaDestinatario, CrmPlantillaCampana
} = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');

const router = express.Router();

const DIAS = 86400000;
const CATALOGO_SEGMENTOS = {
  campeones: { clave: 'campeones', nombre: 'Campeones', color: '#10b981' },
  leales: { clave: 'leales', nombre: 'Leales', color: '#6366f1' },
  activos: { clave: 'activos', nombre: 'Activos', color: '#14b8a6' },
  nuevos: { clave: 'nuevos', nombre: 'Nuevos', color: '#0ea5e9' },
  en_riesgo: { clave: 'en_riesgo', nombre: 'En riesgo', color: '#f59e0b' },
  dormidos: { clave: 'dormidos', nombre: 'Dormidos', color: '#ef4444' },
  prospectos: { clave: 'prospectos', nombre: 'Prospectos', color: '#94a3b8' }
};

function diasDesde(fecha) {
  if (!fecha) return null;
  const valor = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
  return Math.max(0, Math.floor((Date.now() - valor.getTime()) / DIAS));
}

function obtenerSegmento({ visitas, dias_sin_visita: dias, valor_historico: valor }) {
  if (!visitas) return CATALOGO_SEGMENTOS.prospectos;
  if (visitas >= 5 && dias <= 90 && valor >= 5000) return CATALOGO_SEGMENTOS.campeones;
  if (visitas >= 3 && dias <= 120) return CATALOGO_SEGMENTOS.leales;
  if (visitas === 1 && dias <= 60) return CATALOGO_SEGMENTOS.nuevos;
  if (dias <= 180) return CATALOGO_SEGMENTOS.activos;
  if (dias <= 365) return CATALOGO_SEGMENTOS.en_riesgo;
  return CATALOGO_SEGMENTOS.dormidos;
}

function calcularSalud({ visitas, dias_sin_visita: dias, valor_historico: valor, tiene_cita_futura: futura }) {
  const recencia = dias === null ? 0 : dias <= 60 ? 40 : dias <= 120 ? 32 : dias <= 180 ? 24 : dias <= 365 ? 12 : 4;
  const frecuencia = Math.min(visitas * 7, 30);
  const monetario = Math.min(Math.round(Number(valor || 0) / 500), 20);
  return Math.min(recencia + frecuencia + monetario + (futura ? 10 : 0), 100);
}

async function construirPacientes360() {
  const hoy = new Date().toISOString().slice(0, 10);
  const [pacientes, visitas, pagos, futuras, perfiles] = await Promise.all([
    Paciente.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono', 'email', 'fecha_nacimiento', 'createdAt'],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      raw: true
    }),
    Cita.findAll({
      where: { estado: 'completada' },
      attributes: ['paciente_id', [sequelize.fn('COUNT', sequelize.col('id')), 'visitas'], [sequelize.fn('MAX', sequelize.col('fecha')), 'ultima_visita']],
      group: ['paciente_id'], raw: true
    }),
    Pago.findAll({
      attributes: ['paciente_id', [sequelize.fn('SUM', sequelize.col('monto')), 'valor_historico'], [sequelize.fn('COUNT', sequelize.col('id')), 'pagos']],
      group: ['paciente_id'], raw: true
    }),
    Cita.findAll({
      where: { fecha: { [Op.gte]: hoy }, estado: { [Op.in]: ['programada', 'confirmada'] } },
      attributes: ['paciente_id', [sequelize.fn('MIN', sequelize.col('fecha')), 'proxima_cita']],
      group: ['paciente_id'], raw: true
    }),
    CrmPerfil.findAll({ attributes: ['paciente_id', 'origen', 'responsable_id', 'acepta_marketing'], raw: true })
  ]);
  const mapaVisitas = new Map(visitas.map(item => [Number(item.paciente_id), item]));
  const mapaPagos = new Map(pagos.map(item => [Number(item.paciente_id), item]));
  const mapaFuturas = new Map(futuras.map(item => [Number(item.paciente_id), item]));
  const mapaPerfiles = new Map(perfiles.map(item => [Number(item.paciente_id), item]));

  return pacientes.map(paciente => {
    const actividad = mapaVisitas.get(paciente.id) || {};
    const cobros = mapaPagos.get(paciente.id) || {};
    const futura = mapaFuturas.get(paciente.id) || {};
    const perfil = mapaPerfiles.get(paciente.id) || {};
    const resumen = {
      visitas: Number(actividad.visitas || 0),
      ultima_visita: actividad.ultima_visita || null,
      dias_sin_visita: diasDesde(actividad.ultima_visita),
      valor_historico: Number(cobros.valor_historico || 0),
      pagos: Number(cobros.pagos || 0),
      proxima_cita: futura.proxima_cita || null,
      tiene_cita_futura: Boolean(futura.proxima_cita)
    };
    return {
      ...paciente,
      ...resumen,
      origen: perfil.origen || null,
      responsable_id: perfil.responsable_id || null,
      acepta_marketing: Boolean(perfil.acepta_marketing),
      segmento: obtenerSegmento(resumen),
      salud: calcularSalud(resumen)
    };
  });
}

const PLANTILLAS_BASE = [
  { nombre: 'Reactivación', mensaje: 'Hola {nombre}, en Clínica Dental Almar queremos ayudarte a retomar el cuidado de tu salud dental. ¿Te gustaría agendar una valoración?' },
  { nombre: 'Limpieza preventiva', mensaje: 'Hola {nombre}, te recordamos que es buen momento para programar tu limpieza dental preventiva en Clínica Dental Almar. ¿Deseas que te ayudemos a agendar?' },
  { nombre: 'Seguimiento de presupuesto', mensaje: 'Hola {nombre}, damos seguimiento a tu propuesta de tratamiento en Clínica Dental Almar. Si tienes dudas, con gusto podemos ayudarte.' },
  { nombre: 'Cumpleaños', mensaje: '¡Hola {nombre}! Clínica Dental Almar te desea un feliz cumpleaños. Esperamos que disfrutes mucho tu día.' }
];

async function asegurarPlantillas() {
  for (const plantilla of PLANTILLAS_BASE) {
    await CrmPlantillaCampana.findOrCreate({ where: { nombre: plantilla.nombre }, defaults: plantilla });
  }
  return CrmPlantillaCampana.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
}

function resumenCampana(campana) {
  const datos = campana.toJSON ? campana.toJSON() : campana;
  const destinatarios = datos.destinatarios || [];
  return {
    ...datos,
    metricas: {
      destinatarios: destinatarios.length,
      enviados: destinatarios.filter(d => ['ENVIADO', 'RESPONDIO', 'CITA'].includes(d.estado)).length,
      respuestas: destinatarios.filter(d => ['RESPONDIO', 'CITA'].includes(d.estado)).length,
      citas: destinatarios.filter(d => d.estado === 'CITA').length,
      ingresos: destinatarios.reduce((suma, d) => suma + Number(d.ingreso_atribuido || 0), 0)
    }
  };
}

const ETAPAS = [
  { clave: 'interesado', nombre: 'Interesado', color: '#64748b', probabilidad: 10, tipo: 'ABIERTA', orden: 1 },
  { clave: 'contactado', nombre: 'Contactado', color: '#0ea5e9', probabilidad: 25, tipo: 'ABIERTA', orden: 2 },
  { clave: 'presupuesto', nombre: 'Presupuesto', color: '#8b5cf6', probabilidad: 50, tipo: 'ABIERTA', orden: 3 },
  { clave: 'seguimiento', nombre: 'Seguimiento', color: '#f59e0b', probabilidad: 70, tipo: 'ABIERTA', orden: 4 },
  { clave: 'ganado', nombre: 'Aceptado', color: '#10b981', probabilidad: 100, tipo: 'GANADA', orden: 5 },
  { clave: 'perdido', nombre: 'No concretado', color: '#ef4444', probabilidad: 0, tipo: 'PERDIDA', orden: 6 }
];

async function asegurarEtapas() {
  for (const etapa of ETAPAS) {
    await CrmEtapa.findOrCreate({ where: { clave: etapa.clave }, defaults: etapa });
  }
  return CrmEtapa.findAll({ where: { activo: true }, order: [['orden', 'ASC']] });
}

const incluirOportunidad = [
  { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'telefono', 'dni'] },
  { model: CrmEtapa, as: 'etapa' },
  { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido'] }
];

router.get('/plantillas-campana', auth, async (_req, res) => {
  try {
    res.json(await asegurarPlantillas());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/campanas', auth, async (_req, res) => {
  try {
    const campanas = await CrmCampana.findAll({
      include: [
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre', 'apellido'] },
        { model: CrmCampanaDestinatario, as: 'destinatarios', attributes: ['id', 'estado', 'ingreso_atribuido'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(campanas.map(resumenCampana));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/campanas/:id', auth, async (req, res) => {
  try {
    const campana = await CrmCampana.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre', 'apellido'] },
        {
          model: CrmCampanaDestinatario,
          as: 'destinatarios',
          include: [{ model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'telefono'] }]
        }
      ],
      order: [[{ model: CrmCampanaDestinatario, as: 'destinatarios' }, 'id', 'ASC']]
    });
    if (!campana) return res.status(404).json({ error: 'Campaña no encontrada.' });
    res.json(resumenCampana(campana));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/campanas/previsualizar', auth, async (req, res) => {
  try {
    const segmento = String(req.body.segmento || 'todos');
    const pacientes = (await construirPacientes360()).filter(paciente =>
      paciente.telefono && paciente.acepta_marketing && (segmento === 'todos' || paciente.segmento.clave === segmento)
    );
    res.json({
      cantidad: pacientes.length,
      pacientes: pacientes.slice(0, 10).map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido, telefono: p.telefono, segmento: p.segmento }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/campanas', auth, registrarActividad('crear', 'crm_campana'), async (req, res) => {
  const transaccion = await sequelize.transaction();
  try {
    const nombre = String(req.body.nombre || '').trim();
    const mensaje = String(req.body.mensaje || '').trim();
    const segmento = String(req.body.segmento || '').trim();
    if (!nombre || !mensaje || !segmento) {
      await transaccion.rollback();
      return res.status(400).json({ error: 'Nombre, segmento y mensaje son obligatorios.' });
    }
    const segmentosValidos = ['todos', ...Object.keys(CATALOGO_SEGMENTOS)];
    if (!segmentosValidos.includes(segmento)) {
      await transaccion.rollback();
      return res.status(400).json({ error: 'Segmento no válido.' });
    }
    const elegibles = (await construirPacientes360()).filter(paciente =>
      paciente.telefono && paciente.acepta_marketing && (segmento === 'todos' || paciente.segmento.clave === segmento)
    );
    if (!elegibles.length) {
      await transaccion.rollback();
      return res.status(400).json({ error: 'No hay pacientes con teléfono y autorización de marketing en este segmento.' });
    }
    const campana = await CrmCampana.create({
      creado_por_id: req.usuario.id,
      plantilla_id: req.body.plantilla_id || null,
      nombre: nombre.slice(0, 160),
      segmento,
      mensaje: mensaje.slice(0, 5000),
      estado: 'BORRADOR'
    }, { transaction: transaccion });
    await CrmCampanaDestinatario.bulkCreate(elegibles.map(paciente => ({ campana_id: campana.id, paciente_id: paciente.id })), { transaction: transaccion });
    await transaccion.commit();
    res.status(201).json({ id: campana.id, destinatarios: elegibles.length });
  } catch (error) {
    await transaccion.rollback();
    res.status(400).json({ error: error.message });
  }
});

router.put('/campanas/:id/lanzar', auth, registrarActividad('lanzar', 'crm_campana'), async (req, res) => {
  try {
    const campana = await CrmCampana.findByPk(req.params.id);
    if (!campana) return res.status(404).json({ error: 'Campaña no encontrada.' });
    if (campana.estado !== 'BORRADOR') return res.status(400).json({ error: 'Sólo se puede lanzar una campaña en borrador.' });
    await campana.update({ estado: 'ACTIVA', lanzada_en: new Date() });
    res.json(campana);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/campanas/:id/finalizar', auth, registrarActividad('finalizar', 'crm_campana'), async (req, res) => {
  try {
    const campana = await CrmCampana.findByPk(req.params.id);
    if (!campana) return res.status(404).json({ error: 'Campaña no encontrada.' });
    if (campana.estado !== 'ACTIVA') return res.status(400).json({ error: 'La campaña no está activa.' });
    await campana.update({ estado: 'FINALIZADA', finalizada_en: new Date() });
    res.json(campana);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/campanas/destinatarios/:id/estado', auth, registrarActividad('actualizar', 'crm_destinatario'), async (req, res) => {
  try {
    const destinatario = await CrmCampanaDestinatario.findByPk(req.params.id, { include: [{ model: CrmCampana, as: 'campana' }] });
    if (!destinatario) return res.status(404).json({ error: 'Destinatario no encontrado.' });
    if (destinatario.campana?.estado !== 'ACTIVA') return res.status(400).json({ error: 'La campaña debe estar activa.' });
    const estado = String(req.body.estado || '');
    if (!['ENVIADO', 'RESPONDIO', 'CITA', 'NO_CONTACTAR', 'ERROR'].includes(estado)) return res.status(400).json({ error: 'Estado no válido.' });
    const ahora = new Date();
    await destinatario.update({
      estado,
      enviado_en: ['ENVIADO', 'RESPONDIO', 'CITA'].includes(estado) ? destinatario.enviado_en || ahora : destinatario.enviado_en,
      respondido_en: ['RESPONDIO', 'CITA'].includes(estado) ? destinatario.respondido_en || ahora : destinatario.respondido_en,
      ingreso_atribuido: estado === 'CITA' ? Math.max(Number(req.body.ingreso_atribuido || destinatario.ingreso_atribuido || 0), 0) : destinatario.ingreso_atribuido,
      notas: req.body.notas === undefined ? destinatario.notas : String(req.body.notas || '').slice(0, 500)
    });
    res.json(destinatario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/campanas/:id', auth, registrarActividad('eliminar', 'crm_campana'), async (req, res) => {
  try {
    const campana = await CrmCampana.findByPk(req.params.id);
    if (!campana) return res.status(404).json({ error: 'Campaña no encontrada.' });
    if (campana.estado !== 'BORRADOR') return res.status(400).json({ error: 'Sólo se puede eliminar una campaña en borrador.' });
    await campana.destroy();
    res.json({ message: 'Campaña eliminada.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/pacientes-360', auth, async (req, res) => {
  try {
    const buscar = String(req.query.buscar || '').trim().toLowerCase();
    const segmento = String(req.query.segmento || '').trim();
    const orden = String(req.query.orden || 'salud_asc');
    let pacientes = await construirPacientes360();
    if (buscar) pacientes = pacientes.filter(paciente =>
      `${paciente.nombre} ${paciente.apellido} ${paciente.dni || ''} ${paciente.telefono || ''}`.toLowerCase().includes(buscar)
    );
    if (segmento) pacientes = pacientes.filter(paciente => paciente.segmento.clave === segmento);
    const ordenadores = {
      salud_asc: (a, b) => a.salud - b.salud,
      salud_desc: (a, b) => b.salud - a.salud,
      valor_desc: (a, b) => b.valor_historico - a.valor_historico,
      visitas_desc: (a, b) => b.visitas - a.visitas,
      nombre: (a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es')
    };
    pacientes.sort(ordenadores[orden] || ordenadores.salud_asc);
    const total = pacientes.length;
    const pagina = Math.max(Number(req.query.pagina || 1), 1);
    const limite = Math.min(Math.max(Number(req.query.limite || 30), 1), 100);
    res.json({
      pacientes: pacientes.slice((pagina - 1) * limite, pagina * limite),
      total,
      pagina,
      paginas: Math.max(Math.ceil(total / limite), 1)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/segmentos-rfm', auth, async (_req, res) => {
  try {
    const pacientes = await construirPacientes360();
    const grupos = new Map();
    pacientes.forEach(paciente => {
      const clave = paciente.segmento.clave;
      if (!grupos.has(clave)) grupos.set(clave, { ...paciente.segmento, cantidad: 0, valor: 0, pacientes: [] });
      const grupo = grupos.get(clave);
      grupo.cantidad += 1;
      grupo.valor += paciente.valor_historico;
      grupo.pacientes.push(paciente);
    });
    const orden = ['campeones', 'leales', 'activos', 'nuevos', 'en_riesgo', 'dormidos', 'prospectos'];
    const segmentos = orden.map(clave => grupos.get(clave) || { ...CATALOGO_SEGMENTOS[clave], cantidad: 0, valor: 0, pacientes: [] });
    const valorTotal = pacientes.reduce((suma, paciente) => suma + paciente.valor_historico, 0);
    res.json({
      segmentos,
      metricas: {
        pacientes: pacientes.length,
        valor_total: valorTotal,
        riesgo: pacientes.filter(p => ['en_riesgo', 'dormidos'].includes(p.segmento.clave)).length,
        recuperables: pacientes.filter(p => ['en_riesgo', 'dormidos'].includes(p.segmento.clave) && p.telefono).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pacientes/:id/360', auth, async (req, res) => {
  try {
    const pacienteId = Number(req.params.id);
    const paciente = (await construirPacientes360()).find(item => item.id === pacienteId);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    const [perfil, responsable, citas, pagos, presupuestos, notas, tareas, oportunidades] = await Promise.all([
      CrmPerfil.findOne({ where: { paciente_id: pacienteId } }),
      CrmPerfil.findOne({
        where: { paciente_id: pacienteId },
        include: [{ model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido'] }]
      }),
      Cita.findAll({
        where: { paciente_id: pacienteId },
        include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }],
        order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']], limit: 20
      }),
      Pago.findAll({ where: { paciente_id: pacienteId }, order: [['fecha', 'DESC']], limit: 20 }),
      Presupuesto.findAll({ where: { paciente_id: pacienteId }, order: [['createdAt', 'DESC']], limit: 20 }),
      CrmNota.findAll({
        where: { paciente_id: pacienteId },
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }],
        order: [['createdAt', 'DESC']], limit: 50
      }),
      CrmTarea.findAll({
        where: { paciente_id: pacienteId },
        include: [{ model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellido'] }],
        order: [['createdAt', 'DESC']], limit: 50
      }),
      CrmOportunidad.findAll({ where: { paciente_id: pacienteId }, include: incluirOportunidad, order: [['createdAt', 'DESC']] })
    ]);
    res.json({
      paciente,
      perfil: perfil ? { ...perfil.toJSON(), responsable: responsable?.responsable || null } : null,
      actividad: { citas, pagos, presupuestos, notas, tareas, oportunidades }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pacientes/:id/notas', auth, registrarActividad('crear', 'crm_nota'), async (req, res) => {
  try {
    const texto = String(req.body.texto || '').trim();
    if (!texto) return res.status(400).json({ error: 'Escribe una nota.' });
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    const nota = await CrmNota.create({
      paciente_id: paciente.id,
      usuario_id: req.usuario.id,
      tipo: ['NOTA', 'LLAMADA', 'WHATSAPP', 'VISITA'].includes(req.body.tipo) ? req.body.tipo : 'NOTA',
      texto: texto.slice(0, 5000)
    });
    res.status(201).json(nota);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/notas/:id', auth, registrarActividad('eliminar', 'crm_nota'), async (req, res) => {
  try {
    const nota = await CrmNota.findByPk(req.params.id);
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada.' });
    if (nota.tipo === 'SISTEMA') return res.status(400).json({ error: 'Los registros automáticos no se pueden eliminar.' });
    await nota.destroy();
    res.json({ message: 'Nota eliminada.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/catalogos', auth, async (req, res) => {
  try {
    const buscar = String(req.query.buscar || '').trim();
    const where = { activo: true };
    if (buscar) where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { apellido: { [Op.like]: `%${buscar}%` } },
      { dni: { [Op.like]: `%${buscar}%` } }
    ];
    const [pacientes, responsables, etapas] = await Promise.all([
      Paciente.findAll({ where, attributes: ['id', 'nombre', 'apellido', 'telefono', 'dni'], order: [['apellido', 'ASC']], limit: 100 }),
      Usuario.findAll({ where: { activo: true, rol: { [Op.in]: ['administrador', 'doctor', 'recepcionista'] } }, attributes: ['id', 'nombre', 'apellido', 'rol'], order: [['nombre', 'ASC']] }),
      asegurarEtapas()
    ]);
    res.json({ pacientes, responsables, etapas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pipeline', auth, async (_req, res) => {
  try {
    const etapas = await asegurarEtapas();
    const oportunidades = await CrmOportunidad.findAll({ include: incluirOportunidad, order: [['etapa_id', 'ASC'], ['orden', 'ASC'], ['id', 'ASC']] });
    const abiertas = oportunidades.filter(o => o.estado === 'ABIERTA');
    const cerradas = oportunidades.filter(o => o.estado !== 'ABIERTA');
    const ganadas = oportunidades.filter(o => o.estado === 'GANADA');
    const valor = abiertas.reduce((s, o) => s + Number(o.valor || 0), 0);
    const ponderado = abiertas.reduce((s, o) => s + Number(o.valor || 0) * Number(o.etapa?.probabilidad || 0) / 100, 0);
    const ciclos = ganadas.filter(o => o.cerrado_en).map(o => Math.max(0, Math.round((new Date(o.cerrado_en) - new Date(o.createdAt)) / 86400000)));
    res.json({
      etapas,
      oportunidades,
      metricas: {
        abiertas: abiertas.length,
        valor,
        ponderado,
        tasa_exito: cerradas.length ? Math.round(ganadas.length / cerradas.length * 100) : 0,
        ciclo_dias: ciclos.length ? Math.round(ciclos.reduce((s, n) => s + n, 0) / ciclos.length) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/oportunidades', auth, registrarActividad('crear', 'crm_oportunidad'), async (req, res) => {
  try {
    const { paciente_id, etapa_id, responsable_id, titulo, tratamiento_interes, valor, origen, cierre_estimado, notas } = req.body;
    if (!paciente_id || !etapa_id || !String(titulo || '').trim()) return res.status(400).json({ error: 'Paciente, etapa y título son obligatorios.' });
    const etapa = await CrmEtapa.findByPk(etapa_id);
    if (!etapa) return res.status(400).json({ error: 'Etapa no válida.' });
    const orden = (await CrmOportunidad.max('orden', { where: { etapa_id } }) || 0) + 1;
    const oportunidad = await CrmOportunidad.create({
      paciente_id, etapa_id, responsable_id: responsable_id || null, creado_por_id: req.usuario.id,
      titulo: String(titulo).trim().slice(0, 160), tratamiento_interes: tratamiento_interes || null,
      valor: Number(valor || 0), origen: origen || null, cierre_estimado: cierre_estimado || null,
      notas: notas || null, orden, estado: etapa.tipo, cerrado_en: etapa.tipo === 'ABIERTA' ? null : new Date()
    });
    await CrmNota.create({ paciente_id, usuario_id: req.usuario.id, tipo: 'SISTEMA', texto: `Oportunidad creada: ${oportunidad.titulo}` });
    res.status(201).json(await CrmOportunidad.findByPk(oportunidad.id, { include: incluirOportunidad }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/oportunidades/:id', auth, registrarActividad('actualizar', 'crm_oportunidad'), async (req, res) => {
  try {
    const oportunidad = await CrmOportunidad.findByPk(req.params.id);
    if (!oportunidad) return res.status(404).json({ error: 'Oportunidad no encontrada.' });
    const permitidos = ['paciente_id', 'responsable_id', 'titulo', 'tratamiento_interes', 'valor', 'origen', 'cierre_estimado', 'notas'];
    const cambios = Object.fromEntries(Object.entries(req.body).filter(([campo]) => permitidos.includes(campo)));
    await oportunidad.update(cambios);
    res.json(await CrmOportunidad.findByPk(oportunidad.id, { include: incluirOportunidad }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/oportunidades/:id/mover', auth, registrarActividad('mover', 'crm_oportunidad'), async (req, res) => {
  const transaccion = await sequelize.transaction();
  try {
    const oportunidad = await CrmOportunidad.findByPk(req.params.id, { transaction: transaccion });
    const etapa = await CrmEtapa.findByPk(req.body.etapa_id, { transaction: transaccion });
    if (!oportunidad || !etapa) {
      await transaccion.rollback();
      return res.status(404).json({ error: 'Oportunidad o etapa no encontrada.' });
    }
    if (etapa.tipo === 'PERDIDA' && !String(req.body.motivo_perdida || '').trim()) {
      await transaccion.rollback();
      return res.status(400).json({ error: 'Indica el motivo por el que no se concretó.' });
    }
    const orden = (await CrmOportunidad.max('orden', { where: { etapa_id: etapa.id }, transaction: transaccion }) || 0) + 1;
    await oportunidad.update({
      etapa_id: etapa.id,
      estado: etapa.tipo,
      orden,
      motivo_perdida: etapa.tipo === 'PERDIDA' ? String(req.body.motivo_perdida).trim().slice(0, 255) : null,
      cerrado_en: etapa.tipo === 'ABIERTA' ? null : new Date()
    }, { transaction: transaccion });
    await CrmNota.create({ paciente_id: oportunidad.paciente_id, usuario_id: req.usuario.id, tipo: 'SISTEMA', texto: `Oportunidad “${oportunidad.titulo}” movida a ${etapa.nombre}.` }, { transaction: transaccion });
    await transaccion.commit();
    res.json(await CrmOportunidad.findByPk(oportunidad.id, { include: incluirOportunidad }));
  } catch (error) {
    await transaccion.rollback();
    res.status(400).json({ error: error.message });
  }
});

router.delete('/oportunidades/:id', auth, registrarActividad('eliminar', 'crm_oportunidad'), async (req, res) => {
  try {
    const oportunidad = await CrmOportunidad.findByPk(req.params.id);
    if (!oportunidad) return res.status(404).json({ error: 'Oportunidad no encontrada.' });
    await oportunidad.destroy();
    res.json({ message: 'Oportunidad eliminada.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tareas', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.mias === '1') where.asignado_id = req.usuario.id;
    const tareas = await CrmTarea.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'telefono'] },
        { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellido'] },
        { model: CrmOportunidad, as: 'oportunidad', attributes: ['id', 'titulo'] }
      ],
      order: [[sequelize.literal('vence IS NULL'), 'ASC'], ['vence', 'ASC'], ['id', 'DESC']]
    });
    const ahora = new Date();
    const hoy = ahora.toISOString().slice(0, 10);
    res.json({
      tareas,
      metricas: {
        pendientes: tareas.filter(t => t.estado === 'PENDIENTE').length,
        vencidas: tareas.filter(t => t.estado === 'PENDIENTE' && t.vence && new Date(t.vence) < ahora).length,
        hoy: tareas.filter(t => t.estado === 'PENDIENTE' && t.vence && String(t.vence).slice(0, 10) === hoy).length,
        completadas: tareas.filter(t => t.estado === 'HECHA').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tareas', auth, registrarActividad('crear', 'crm_tarea'), async (req, res) => {
  try {
    if (!String(req.body.titulo || '').trim()) return res.status(400).json({ error: 'El título es obligatorio.' });
    const tarea = await CrmTarea.create({
      paciente_id: req.body.paciente_id || null,
      oportunidad_id: req.body.oportunidad_id || null,
      asignado_id: req.body.asignado_id || req.usuario.id,
      creado_por_id: req.usuario.id,
      titulo: String(req.body.titulo).trim().slice(0, 160),
      tipo: req.body.tipo || 'SEGUIMIENTO',
      prioridad: req.body.prioridad || 'MEDIA',
      vence: req.body.vence || null,
      notas: req.body.notas || null
    });
    res.status(201).json(tarea);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/tareas/:id/toggle', auth, registrarActividad('completar', 'crm_tarea'), async (req, res) => {
  try {
    const tarea = await CrmTarea.findByPk(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada.' });
    const hecha = tarea.estado !== 'HECHA';
    await tarea.update({ estado: hecha ? 'HECHA' : 'PENDIENTE', completada_en: hecha ? new Date() : null });
    res.json(tarea);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/tareas/:id', auth, registrarActividad('eliminar', 'crm_tarea'), async (req, res) => {
  try {
    const tarea = await CrmTarea.findByPk(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada.' });
    await tarea.destroy();
    res.json({ message: 'Tarea eliminada.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/pacientes/:id/perfil', auth, registrarActividad('actualizar', 'crm_perfil'), async (req, res) => {
  try {
    const [perfil] = await CrmPerfil.findOrCreate({ where: { paciente_id: req.params.id }, defaults: { paciente_id: req.params.id } });
    await perfil.update({
      responsable_id: req.body.responsable_id || null,
      origen: req.body.origen || null,
      acepta_marketing: Boolean(req.body.acepta_marketing),
      observaciones: req.body.observaciones || null
    });
    res.json(perfil);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
