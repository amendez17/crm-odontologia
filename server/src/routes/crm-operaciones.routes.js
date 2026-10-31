const express = require('express');
const { Op } = require('sequelize');
const {
  sequelize, Paciente, Usuario, CrmEtapa, CrmOportunidad, CrmTarea, CrmNota, CrmPerfil
} = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');

const router = express.Router();

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
