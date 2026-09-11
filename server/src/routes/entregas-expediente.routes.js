const express = require('express');
const crypto = require('crypto');
const { EntregaExpediente, Paciente } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');

const router = express.Router();
const CARACTERES = new Set(['paciente', 'madre_padre', 'tutor', 'representante_legal', 'otro']);
const MEDIOS = new Set(['impresa', 'digital', 'ambas']);
const DOCUMENTOS = new Set(['historia_clinica', 'odontograma', 'periodontograma', 'consentimientos', 'recetas', 'estudios_imagenes', 'otros']);

const contenidoFirma = data => JSON.stringify({
  paciente_id: Number(data.paciente_id),
  solicitante_nombre: data.solicitante_nombre,
  solicitante_caracter: data.solicitante_caracter,
  documentos: data.documentos,
  documentos_detalle: data.documentos_detalle || '',
  motivo: data.motivo,
  medio_entrega: data.medio_entrega,
  responsable_id: Number(data.responsable_id),
  responsable_nombre: data.responsable_nombre,
  responsable_rol: data.responsable_rol,
  fecha_entrega: new Date(data.fecha_entrega).toISOString()
});

const firmar = data => crypto.createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(contenidoFirma(data)).digest('hex');

router.get('/paciente/:pacienteId', auth, registrarActividad('consultar', 'entrega_expediente', {
  entidadId: req => req.params.pacienteId,
  contexto: req => ({ paciente_id: Number(req.params.pacienteId) })
}), async (req, res) => {
  try {
    const entregas = await EntregaExpediente.findAll({
      where: { paciente_id: req.params.pacienteId },
      order: [['fecha_entrega', 'DESC'], ['id', 'DESC']]
    });
    res.json(entregas.map(item => {
      const data = item.toJSON();
      return { ...data, documentos: JSON.parse(data.documentos || '[]'), integridad_valida: firmar(data) === data.firma_hash };
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, esDoctor, registrarActividad('entregar_copia', 'entrega_expediente', {
  contexto: (req, respuesta) => ({ paciente_id: Number(respuesta?.paciente_id || req.body.paciente_id) })
}), async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.body.paciente_id, { attributes: ['id'] });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    const solicitanteNombre = req.body.solicitante_nombre?.trim();
    const motivo = req.body.motivo?.trim();
    const documentos = [...new Set(Array.isArray(req.body.documentos) ? req.body.documentos : [])];
    if (!solicitanteNombre || solicitanteNombre.length < 3) return res.status(400).json({ error: 'Escribe el nombre completo de quien solicitó el expediente.' });
    if (!CARACTERES.has(req.body.solicitante_caracter)) return res.status(400).json({ error: 'Selecciona el carácter del solicitante.' });
    if (!documentos.length || documentos.some(item => !DOCUMENTOS.has(item))) return res.status(400).json({ error: 'Selecciona los documentos entregados.' });
    if (documentos.includes('otros') && !req.body.documentos_detalle?.trim()) return res.status(400).json({ error: 'Describe los otros documentos entregados.' });
    if (!motivo || motivo.length < 5) return res.status(400).json({ error: 'Escribe el motivo de la solicitud.' });
    if (!MEDIOS.has(req.body.medio_entrega)) return res.status(400).json({ error: 'Selecciona el medio de entrega.' });

    const fechaEntrega = new Date(); fechaEntrega.setMilliseconds(0);
    const data = {
      paciente_id: Number(req.body.paciente_id),
      solicitante_nombre: solicitanteNombre,
      solicitante_caracter: req.body.solicitante_caracter,
      documentos: JSON.stringify(documentos),
      documentos_detalle: req.body.documentos_detalle?.trim() || null,
      motivo,
      medio_entrega: req.body.medio_entrega,
      responsable_id: req.usuario.id,
      responsable_nombre: `${req.usuario.nombre} ${req.usuario.apellido}`.trim(),
      responsable_rol: req.usuario.rol,
      fecha_entrega: fechaEntrega
    };
    data.firma_hash = firmar(data);
    const entrega = await EntregaExpediente.create(data);
    const respuesta = entrega.toJSON();
    res.status(201).json({ ...respuesta, documentos, integridad_valida: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, esDoctor, registrarActividad('intento_eliminar', 'entrega_expediente'), (_req, res) => {
  res.status(409).json({ error: 'Los registros de entrega forman parte de la trazabilidad y no pueden eliminarse.' });
});

module.exports = router;
