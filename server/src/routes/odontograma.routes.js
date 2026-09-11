const express = require('express');
const crypto = require('crypto');
const { Odontograma, Paciente, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

const DIENTES_VALIDOS = new Set([18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]);
const CARAS_VALIDAS = new Set(['vestibular', 'lingual', 'mesial', 'distal', 'oclusal', 'completa']);
const ESTADOS_COMPLETOS = new Set(['sano', 'corona', 'extraccion', 'endodoncia', 'implante', 'protesis', 'ausente']);
const ESTADOS_POR_CARA = new Set(['sano', 'caries', 'obturacion', 'fractura']);
const TIPOS_REGISTRO = new Set(['hallazgo', 'plan', 'realizado']);
const TRATAMIENTOS_COMPLETOS = new Set(['corona', 'extraccion', 'endodoncia', 'implante', 'protesis']);
const TRATAMIENTOS_POR_CARA = new Set(['obturacion']);

const validarRegistro = ({ pieza_dental, cara = 'completa', estado = 'sano', tipo_registro = 'hallazgo' }) => {
  if (!DIENTES_VALIDOS.has(Number(pieza_dental))) return 'La pieza dental no es válida.';
  if (!CARAS_VALIDAS.has(cara)) return 'La cara dental no es válida.';
  if (!TIPOS_REGISTRO.has(tipo_registro)) return 'El tipo de registro odontológico no es válido.';
  const esTratamiento = tipo_registro === 'plan' || tipo_registro === 'realizado';
  const estadosPermitidos = esTratamiento
    ? (cara === 'completa' ? TRATAMIENTOS_COMPLETOS : TRATAMIENTOS_POR_CARA)
    : (cara === 'completa' ? ESTADOS_COMPLETOS : ESTADOS_POR_CARA);
  if (!estadosPermitidos.has(estado)) return `El estado ${estado} no corresponde al modo ${cara === 'completa' ? 'diente completo' : 'por cara'}.`;
  return null;
};

const contenidoFirma = data => JSON.stringify({
  paciente_id: Number(data.paciente_id), pieza_dental: Number(data.pieza_dental),
  cara: data.cara || 'completa', estado: data.estado || 'sano', observacion: data.observacion || '',
  doctor_id: Number(data.doctor_id), fecha_hora: new Date(data.fecha_hora).toISOString(),
  registro_previo_hash: data.registro_previo_hash || '',
  ...(Number(data.firma_version || 1) >= 2 ? { tipo_registro: data.tipo_registro || 'hallazgo', firma_version: 2 } : {})
});
const firmarRegistro = data => crypto.createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(contenidoFirma(data)).digest('hex');

const crearVersion = async ({ paciente_id, pieza_dental, cara, estado, tipo_registro = 'hallazgo', observacion, usuario }) => {
  const fechaHora = new Date(); fechaHora.setMilliseconds(0);
  const previo = await Odontograma.findOne({ where: { paciente_id }, order: [['id', 'DESC']] });
  const data = {
    paciente_id: Number(paciente_id), pieza_dental: Number(pieza_dental), cara: cara || 'completa', estado: estado || 'sano', tipo_registro,
    observacion: observacion?.trim() || null, doctor_id: usuario.id, fecha_hora: fechaHora,
    doctor_nombre: `${usuario.nombre} ${usuario.apellido}`.trim(), doctor_cedula: usuario.cedula || null,
    registro_previo_hash: previo?.firma_hash || null, firma_version: 2, fecha: fechaHora
  };
  data.firma_hash = firmarRegistro(data);
  return Odontograma.create(data);
};

// GET /api/odontograma/:pacienteId
router.get('/:pacienteId', auth, esDoctor, registrarActividad('consultar', 'odontograma', {
  entidadId: req => req.params.pacienteId,
  contexto: req => ({ paciente_id: Number(req.params.pacienteId) })
}), async (req, res) => {
  try {
    const registros = await Odontograma.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
    const hashes = new Set(registros.map(item => item.firma_hash).filter(Boolean));
    res.json(registros.map(item => {
      const data = item.toJSON();
      data.integridad_valida = data.firma_hash
        ? firmarRegistro(data) === data.firma_hash && (!data.registro_previo_hash || hashes.has(data.registro_previo_hash))
        : null;
      return data;
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/odontograma
router.post('/', auth, esDoctor, registrarActividad('crear', 'odontograma'), async (req, res) => {
  try {
    const errorValidacion = validarRegistro(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });
    const registro = await crearVersion({ ...req.body, usuario: req.usuario });
    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/odontograma/:id
// Los cambios clínicos no sobrescriben el registro original: generan una nueva
// versión para conservar la trazabilidad del expediente odontológico.
router.put('/:id', auth, esDoctor, registrarActividad('actualizar', 'odontograma'), async (req, res) => {
  try {
    const registro = await Odontograma.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado.' });
    const datosNuevos = {
      pieza_dental: registro.pieza_dental,
      cara: req.body.cara || registro.cara,
      estado: req.body.estado || registro.estado,
      tipo_registro: req.body.tipo_registro || registro.tipo_registro || 'hallazgo'
    };
    const errorValidacion = validarRegistro(datosNuevos);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });
    const nuevaVersion = await crearVersion({
      paciente_id: registro.paciente_id,
      pieza_dental: registro.pieza_dental,
      cara: datosNuevos.cara,
      estado: datosNuevos.estado,
      tipo_registro: datosNuevos.tipo_registro,
      observacion: req.body.observacion ?? registro.observacion,
      usuario: req.usuario
    });
    res.json(nuevaVersion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/odontograma/:id
router.delete('/:id', auth, esDoctor, registrarActividad('intento_eliminar', 'odontograma'), async (_req, res) => {
  res.status(409).json({ error: 'Los registros del odontograma forman parte del expediente y no pueden eliminarse.' });
});

module.exports = router;
