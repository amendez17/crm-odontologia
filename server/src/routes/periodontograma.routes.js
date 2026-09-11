const express = require('express');
const crypto = require('crypto');
const { Periodontograma, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

const SITIOS = new Set(['MV', 'V', 'DV', 'ML', 'L', 'DL']);
const DIENTES = new Set([18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]);

const firmar = data => crypto.createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(JSON.stringify(data)).digest('hex');

const validar = mediciones => {
  if (!Array.isArray(mediciones) || !mediciones.length) return 'Captura al menos una medición periodontal.';
  for (const pieza of mediciones) {
    if (!DIENTES.has(Number(pieza.pieza))) return `Pieza dental inválida: ${pieza.pieza}`;
    if (!Array.isArray(pieza.sitios) || pieza.sitios.length !== 6) return `La pieza ${pieza.pieza} debe contener seis sitios.`;
    if (!Number.isInteger(Number(pieza.movilidad)) || Number(pieza.movilidad) < 0 || Number(pieza.movilidad) > 3) return 'La movilidad debe estar entre 0 y 3.';
    if (!Number.isInteger(Number(pieza.furca)) || Number(pieza.furca) < 0 || Number(pieza.furca) > 3) return 'La furca debe estar entre 0 y 3.';
    for (const sitio of pieza.sitios) {
      if (!SITIOS.has(sitio.sitio)) return `Sitio periodontal inválido en la pieza ${pieza.pieza}.`;
      const profundidad = Number(sitio.profundidad);
      const recesion = Number(sitio.recesion || 0);
      if (!Number.isInteger(profundidad) || profundidad < 0 || profundidad > 15) return 'La profundidad de sondaje debe estar entre 0 y 15 mm.';
      if (!Number.isInteger(recesion) || recesion < -10 || recesion > 15) return 'La recesión debe estar entre -10 y 15 mm.';
    }
  }
  return null;
};

router.get('/:pacienteId', auth, esDoctor, registrarActividad('consultar', 'periodontograma', {
  entidadId: req => req.params.pacienteId
}), async (req, res) => {
  try {
    const evaluaciones = await Periodontograma.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'cedula'] }],
      order: [['fecha_hora', 'DESC']]
    });
    res.json(evaluaciones.map(item => {
      const data = item.toJSON();
      data.integridad_valida = firmar({ paciente_id: Number(data.paciente_id), doctor_id: Number(data.doctor_id), fecha_hora: new Date(data.fecha_hora).toISOString(), mediciones: data.mediciones, observaciones: data.observaciones || '' }) === data.firma_hash;
      return data;
    }));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, esDoctor, registrarActividad('crear', 'periodontograma'), async (req, res) => {
  try {
    const error = validar(req.body.mediciones);
    if (error) return res.status(400).json({ error });
    const fechaHora = new Date(); fechaHora.setMilliseconds(0);
    const contenido = {
      paciente_id: Number(req.body.paciente_id), doctor_id: req.usuario.id, fecha_hora: fechaHora.toISOString(),
      mediciones: req.body.mediciones, observaciones: req.body.observaciones?.trim() || ''
    };
    const evaluacion = await Periodontograma.create({
      ...contenido, fecha_hora: fechaHora,
      doctor_nombre: `${req.usuario.nombre} ${req.usuario.apellido}`.trim(),
      doctor_cedula: req.usuario.cedula || null,
      firma_hash: firmar(contenido)
    });
    res.status(201).json(evaluacion);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

router.put('/:id', auth, esDoctor, (_req, res) => res.status(409).json({ error: 'Las evaluaciones periodontales son inmutables. Registra una nueva evaluación.' }));
router.delete('/:id', auth, esDoctor, (_req, res) => res.status(409).json({ error: 'Las evaluaciones periodontales forman parte del expediente y no pueden eliminarse.' }));

module.exports = router;
