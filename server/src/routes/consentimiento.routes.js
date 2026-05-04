const express = require('express');
const { Consentimiento, Paciente, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const router = express.Router();

const PLANTILLAS = {
  'Extracción dental': `CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTAL

Yo, el/la paciente abajo firmante, declaro que he sido informado/a por mi odontólogo/a tratante sobre:

1. DIAGNÓSTICO: Se me ha explicado la necesidad de realizar la extracción de la(s) pieza(s) dental(es) indicada(s).

2. PROCEDIMIENTO: Consiste en la remoción quirúrgica de la pieza dental, bajo anestesia local. El procedimiento puede incluir incisión de encía, osteotomía y sutura.

3. RIESGOS Y COMPLICACIONES POSIBLES:
- Dolor, inflamación y sangrado post-operatorio
- Infección de la herida quirúrgica
- Hematoma o equimosis facial
- Comunicación buco-sinusal (en piezas superiores)
- Lesión temporal o permanente de nervios (parestesia)
- Fractura de tabla ósea o de la pieza dental
- Alveolitis seca

4. ALTERNATIVAS: Se me han explicado las alternativas al tratamiento propuesto.

5. POST-OPERATORIO: Me comprometo a seguir las indicaciones post-operatorias proporcionadas.

He podido formular todas las preguntas que he considerado oportunas y todas ellas han sido respondidas satisfactoriamente.`,

  'Endodoncia': `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ENDODÓNTICO

Yo, el/la paciente abajo firmante, declaro que he sido informado/a sobre:

1. DIAGNÓSTICO: Se requiere tratamiento de conducto radicular en la(s) pieza(s) indicada(s) debido a patología pulpar irreversible.

2. PROCEDIMIENTO: Consiste en la remoción del tejido pulpar (nervio), limpieza, conformación y obturación de los conductos radiculares.

3. RIESGOS Y COMPLICACIONES:
- Dolor post-operatorio
- Fractura del instrumento dentro del conducto
- Perforación radicular
- Necesidad de retratamiento
- Posible fractura de la pieza tratada
- Necesidad de cirugía apical complementaria

4. Se me ha informado que la pieza endodonciada requerirá una restauración definitiva (corona) para protegerla.`,

  'Ortodoncia': `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ORTODÓNTICO

Yo, el/la paciente abajo firmante, declaro que he sido informado/a sobre:

1. DIAGNÓSTICO: Se me ha explicado mi maloclusión y la necesidad del tratamiento ortodóntico.

2. TRATAMIENTO: Incluye la colocación de aparatología fija o removible para la corrección de la posición dental y/o esquelética.

3. DURACIÓN ESTIMADA: El tratamiento puede extenderse entre 12 a 36 meses, dependiendo de la complejidad del caso.

4. RIESGOS Y COMPLICACIONES:
- Dolor y molestias durante el tratamiento
- Descalcificación del esmalte e incremento de caries
- Reabsorción radicular
- Problemas periodontales
- Recidiva post-tratamiento
- Necesidad de uso de contención permanente

5. RESPONSABILIDADES DEL PACIENTE:
- Asistir a las citas programadas
- Mantener una higiene oral rigurosa
- Usar los elásticos y aparatos según indicación
- Evitar alimentos que puedan dañar la aparatología`,

  'Implante dental': `CONSENTIMIENTO INFORMADO PARA COLOCACIÓN DE IMPLANTE DENTAL

Yo, el/la paciente abajo firmante, declaro que he sido informado/a sobre:

1. PROCEDIMIENTO: Colocación quirúrgica de implante(s) dental(es) de titanio en el hueso maxilar o mandibular.

2. RIESGOS Y COMPLICACIONES:
- Dolor, inflamación y sangrado post-quirúrgico
- Infección del sitio quirúrgico
- Lesión de nervios (parestesia temporal o permanente)
- Perforación del seno maxilar
- Fracaso en la osteointegración
- Necesidad de injerto óseo adicional
- Periimplantitis

3. Se me ha informado que el proceso completo (cirugía + prótesis) puede tomar entre 3 a 9 meses.

4. Me comprometo a mantener una higiene oral adecuada y asistir a los controles periódicos.`,

  'Blanqueamiento dental': `CONSENTIMIENTO INFORMADO PARA BLANQUEAMIENTO DENTAL

Yo, el/la paciente abajo firmante, declaro que he sido informado/a sobre:

1. PROCEDIMIENTO: Aplicación de agentes blanqueadores para aclarar el color de los dientes.

2. RIESGOS Y EFECTOS SECUNDARIOS:
- Sensibilidad dental temporal
- Irritación de encías
- Resultado puede variar según cada paciente
- El blanqueamiento no es permanente
- No afecta restauraciones existentes (empastes, coronas)

3. CONTRAINDICACIONES informadas: embarazo, lactancia, menores de edad, alergia a peróxidos.`,

  'Procedimiento general': `CONSENTIMIENTO INFORMADO GENERAL

Yo, el/la paciente abajo firmante, declaro que:

1. He sido informado/a sobre mi diagnóstico y el tratamiento propuesto.
2. Se me han explicado los riesgos, beneficios y alternativas del procedimiento.
3. He tenido la oportunidad de hacer preguntas y todas han sido respondidas.
4. Autorizo al profesional a realizar el tratamiento descrito.
5. Entiendo que pueden surgir situaciones imprevistas durante el procedimiento que requieran modificaciones al plan original.`
};

// GET /api/consentimiento/plantillas
router.get('/plantillas', auth, (req, res) => {
  res.json(Object.keys(PLANTILLAS).map(tipo => ({ tipo, contenido: PLANTILLAS[tipo] })));
});

// GET /api/consentimiento/paciente/:pacienteId
router.get('/paciente/:pacienteId', auth, async (req, res) => {
  try {
    const consentimientos = await Consentimiento.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(consentimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/consentimiento
router.post('/', auth, esDoctor, async (req, res) => {
  try {
    const { paciente_id, tipo, contenido } = req.body;
    const consentimiento = await Consentimiento.create({
      paciente_id,
      doctor_id: req.usuario.id,
      tipo,
      contenido: contenido || PLANTILLAS[tipo] || PLANTILLAS['Procedimiento general']
    });
    res.status(201).json(consentimiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/consentimiento/:id/firmar
router.put('/:id/firmar', auth, async (req, res) => {
  try {
    const consentimiento = await Consentimiento.findByPk(req.params.id);
    if (!consentimiento) return res.status(404).json({ error: 'Consentimiento no encontrado.' });
    await consentimiento.update({
      firmado: true,
      fecha_firma: new Date(),
      ip_firma: req.ip
    });
    res.json(consentimiento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
