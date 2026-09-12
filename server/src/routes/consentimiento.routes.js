const express = require('express');
const crypto = require('crypto');
const { Consentimiento, Paciente, Usuario, Configuracion } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

const hash = value => crypto.createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(JSON.stringify(value)).digest('hex');

const PLANTILLAS = {
  
  'Resina': `CONSENTIMIENTO INFORMADO PARA RESTAURACIÓN DENTAL CON RESINA

PROCEDIMIENTO: Restauración dental con resina compuesta fotopolimerizable para reparar dientes afectados por caries, fracturas, desgaste o defectos estéticos.

Yo, el/la paciente abajo firmante, declaro que he leído y comprendido este documento y que he sido informado(a) sobre lo siguiente:

1. El tratamiento consiste en eliminar el tejido dental afectado, cuando sea necesario, y restaurar el diente mediante la colocación de resina compuesta del color más similar posible al de mis dientes naturales.
2. Comprendo que el objetivo del tratamiento es devolver la función, forma y estética del diente; sin embargo, no se puede garantizar una coincidencia de color completamente exacta debido a las características propias de cada diente y del material restaurador.
3. Se me informó que durante o después del procedimiento puedo presentar:

* Sensibilidad temporal al frío, calor o presión.
* Molestias leves al masticar durante los primeros días.
* Irritación temporal de los tejidos blandos.

4. Entiendo que las restauraciones de resina tienen una vida útil limitada y pueden requerir reparación o reemplazo con el paso del tiempo debido al desgaste, fracturas, filtraciones, cambios de color, caries recurrente o hábitos como apretar o rechinar los dientes (bruxismo).
5. Comprendo que el éxito del tratamiento depende también de mis hábitos de higiene oral, alimentación, revisiones periódicas y del cuidado adecuado de la restauración.
6. Se me informó que, si durante el procedimiento se detecta una lesión más profunda de lo esperado o existe afectación del nervio dental, podría ser necesario realizar tratamientos adicionales, como protección pulpar, endodoncia, colocación de una corona u otros procedimientos, los cuales tendrán un costo independiente.
7. Entiendo que las restauraciones de resina pueden pigmentarse con el tiempo por el consumo frecuente de café, té, vino tinto, tabaco u otros alimentos o bebidas con colorantes.
8. Se me informó sobre las alternativas de tratamiento, incluyendo no realizar el procedimiento, así como otras opciones restauradoras cuando sean aplicables, con sus ventajas y limitaciones.
9. He tenido la oportunidad de realizar todas las preguntas que consideré necesarias y estas fueron respondidas de forma clara y satisfactoria.
10. Autorizo de manera libre y voluntaria al odontólogo y a su equipo a realizar la restauración con resina, así como los procedimientos complementarios que sean necesarios para llevarla a cabo de forma segura.`,
  'Limpieza Dental (Profilaxis)': `CONSENTIMIENTO INFORMADO PARA LIMPIEZA DENTAL (PROFILAXIS)

PROCEDIMIENTO: Limpieza dental profesional (profilaxis), que consiste en la eliminación de placa bacteriana, sarro y manchas superficiales mediante instrumentos manuales y/o ultrasónicos, seguida de pulido dental y, cuando sea necesario, aplicación de flúor.

Yo, el/la paciente abajo firmante, declaro que he leído y comprendido este documento y que he sido informado(a) sobre lo siguiente:

1. La limpieza dental tiene como objetivo mejorar la salud bucal al remover placa, cálculo dental y pigmentaciones superficiales, contribuyendo a la prevención de caries y enfermedades de las encías.
2. Entiendo que este procedimiento es preventivo y no sustituye otros tratamientos que pudieran ser necesarios, como restauraciones, tratamiento periodontal, endodoncia o cirugía.
3. Se me informó que durante o después del procedimiento puedo presentar:

* Sensibilidad dental temporal.
* Molestias leves en las encías.
* Sangrado gingival, especialmente si existe inflamación previa.
* Ligera molestia al masticar o al consumir alimentos muy fríos o calientes durante un corto periodo.

4. Comprendo que, si existe enfermedad periodontal o acumulación importante de sarro, una sola sesión de limpieza puede no ser suficiente y podría requerir tratamiento periodontal adicional.
5. Entiendo que la limpieza dental no modifica el color natural de los dientes, aunque puede eliminar manchas superficiales y mejorar su apariencia.
6. Se me informó sobre la importancia de mantener una adecuada higiene oral, incluyendo cepillado, uso de hilo dental y revisiones periódicas para conservar los resultados del tratamiento.
7. He tenido la oportunidad de realizar preguntas y todas mis dudas fueron respondidas de manera satisfactoria.
8. Autorizo de manera libre y voluntaria al odontólogo y a su equipo a realizar el procedimiento descrito.

AUTORIZACIÓN PARA FOTOGRAFIAS Y VIDEOS 

Autorizo la toma de fotografías y/o videos para:
-Documentación clínica.
-Seguimiento
-Uso educativo o en redes sociales

( ) Rostro completo
( ) Solo Sonrisa
( ) No autorizo`,
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

  'Carillas Dentales': `CONSENTIMIENTO INFORMADO PARA CARILLAS DENTALES

Yo, el/la paciente abajo firmante, declaro que he sido informado/a de manera clara y comprensible sobre el 
procedimiento de colocación de carillas dentales, el cual consiste en mejorar la apariencia estética 
de los dientes mediante la colocaciónde láminas delgadas de resina o porcelana adheridas a la superficie dental.

Objetivos del Tratamiento

El tratamiento tiene como finalidad:

* Mejorar color, forma y tamaño de los dientes.
* Corregir pequeñas fracturas o desgastes.
* Mejorar la estética de la sonrisa.

Información Importante

Entiendo y acepto que:

* Las carillas pueden requerir desgaste parcial del esmalte dental.
* La duración de las carillas depende de los cuidados, hábitos y revisiones periódicas.
* Los resultados estéticos pueden variar según las características naturales de mis dientes.
* Las carillas pueden fracturarse, despegarse o pigmentarse con el tiempo.
* En algunos casos puede presentarse sensibilidad dental temporal.
* Hábitos como morder objetos, bruxismo o abrir cosas con los dientes pueden afectar el tratamiento.
* El tratamiento puede requerir ajustes, mantenimiento o reemplazo futuro.

Riesgos y Complicaciones

He sido informado(a) de posibles riesgos y complicaciones, entre ellos:

* Sensibilidad dental.
* Molestia gingival temporal.
* Fractura o desprendimiento de la carilla.
* Cambios en la mordida o necesidad de ajustes.
* Diferencias leves de color o forma respecto a expectativas personales.

Cuidados Posteriores

Me comprometo a:

* Mantener adecuada higiene oral.
* Asistir a revisiones periódicas.
* Evitar hábitos que puedan dañar las carillas.
* Seguir las indicaciones del odontólogo tratante.

Alternativas de Tratamiento

Se me explicaron otras alternativas de tratamiento, incluyendo:

* Blanqueamiento dental.
* Resinas estéticas.
* Ortodoncia.
* No realizar tratamiento.

Consentimiento

Declaro que:

* He tenido oportunidad de realizar preguntas y todas fueron respondidas satisfactoriamente.
* Comprendo la información proporcionada sobre beneficios, riesgos y limitaciones del tratamiento.
* Autorizo de manera voluntaria la realización del procedimiento de colocación de carillas dentales.
AUTORIZACIÓN PARA FOTOGRAFIAS Y VIDEOS 

Autorizo la toma de fotografías y/o videos para:
-Documentación clínica.
-Seguimiento
-Uso educativo o en redes sociales

( ) Rostro completo
( ) Solo Sonrisa
( ) No autorizo`,

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

4. Se me ha informado que la pieza endodonciada requerirá una restauración definitiva (corona) para protegerla. 
Autorizo la toma de fotografías y/o videos para:
-Documentación clínica.
-Seguimiento
-Uso educativo o en redes sociales

( ) Rostro completo
( ) Solo Sonrisa
( ) No autorizo`,

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

PROCEDIMIENTO: Aplicación de agentes blanqueadores para aclarar el color de los dientes.

Yo, el/la paciente abajo firmante, declaro que he leido y comprendidoeste documento y he sido informado/a sobre:
PROCEDIMIENTO: Aplicación de agentes blanqueadores para aclarar el color de los dientes.

1. Que he acudido a la Clinica Dental Almar, donde he sido atendido

2. Que se me ha explicado de manera clara en qué consiste el tratamiento de blanqueamiento dental,
el cual tiene como finalidad mejorar el color de mis dientes, pero no garantiza untono exacto o específico.

3. Que entiendo que el resutado del blanqueamiento puede variar dependiendo de:
- Color inicial de mis dientes.
- Tipo de manchas.
- Habitos (café, vino, tabaco, etc.)
- Restauraciones Previas.

4. Que pueden requerirse sesiones adicionales.

5. Que se me informo que el agente blanqueador puede entrar en contaco con tejidos blandos
(encias, labios o mucosa), provocando un aclaraiento temporal de estas zonas, el cual es 
reversible y no causa daño permanente, desapareciendo en un corto periodo de tiempo.

6. RIESGOS Y EFECTOS SECUNDARIOS:
- Sensibilidad dental temporal
- Irritación de encías
- Resultado puede variar según cada paciente
- El blanqueamiento no es permanente
- No afecta restauraciones existentes (empastes, coronas)

7. CONTRAINDICACIONES informadas: embarazo, lactancia, menores de edad, alergia a peróxidos.

AUTORIZACIÓN PARA FOTOGRAFIAS Y VIDEOS 

Autorizo la toma de fotografías y/o videos para:
-Documentación clínica.
-Seguimiento
-Uso educativo o en redes sociales

( ) Rostro completo
( ) Solo Sonrisa
( ) No autorizo`,


  'Procedimiento general': `CONSENTIMIENTO INFORMADO GENERAL

Yo, el/la paciente abajo firmante, declaro que:

1. He sido informado/a sobre mi diagnóstico y el tratamiento propuesto.
2. Se me han explicado los riesgos, beneficios y alternativas del procedimiento.
3. He tenido la oportunidad de hacer preguntas y todas han sido respondidas.
4. Autorizo al profesional a realizar el tratamiento descrito.
5. Entiendo que pueden surgir situaciones imprevistas durante el procedimiento que requieran modificaciones al plan original.`
};

const cargarConfiguracion = async () => {
  const filas = await Configuracion.findAll();
  return Object.fromEntries(filas.map(fila => [fila.clave, fila.valor || '']));
};

const construirAvisoPrivacidad = config => `AVISO DE PRIVACIDAD Y AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES SENSIBLES

Responsable: ${config.privacidad_responsable || config.clinica_nombre || '[PENDIENTE DE CONFIGURAR]'}.
Domicilio: ${config.clinica_direccion || '[PENDIENTE DE CONFIGURAR]'}.

Los datos personales y datos personales sensibles relativos a la salud serán utilizados para identificación, integración y conservación del expediente clínico, diagnóstico, tratamiento odontológico, seguimiento, gestión de citas, facturación, contacto y cumplimiento de obligaciones sanitarias y legales.

El titular puede ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición (ARCO), así como revocar su consentimiento, mediante solicitud presentada en ${config.privacidad_domicilio_arco || '[PENDIENTE DE CONFIGURAR]'} o al correo ${config.privacidad_email_arco || '[PENDIENTE DE CONFIGURAR]'}. La solicitud deberá permitir acreditar la identidad del titular y describir el derecho que desea ejercer.

Transferencias: ${config.privacidad_transferencias || 'No se realizarán transferencias distintas de las legalmente permitidas o necesarias para la atención médica.'}

Los cambios a este aviso se comunicarán en el domicilio del responsable y por los medios de contacto registrados. Versión: ${config.privacidad_version || '[PENDIENTE DE CONFIGURAR]'}.

Declaro que recibí y comprendí este aviso y autorizo expresamente el tratamiento de mis datos personales sensibles para las finalidades señaladas.`;

// GET /api/consentimiento/plantillas
router.get('/plantillas', auth, async (_req, res) => {
  try {
    const config = await cargarConfiguracion();
    const plantillas = Object.keys(PLANTILLAS).map(tipo => ({ tipo, contenido: PLANTILLAS[tipo] }));
    plantillas.unshift({ tipo: 'Aviso de privacidad y datos sensibles', contenido: construirAvisoPrivacidad(config) });
    res.json(plantillas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/consentimiento/paciente/:pacienteId
router.get('/paciente/:pacienteId', auth, registrarActividad('consultar', 'consentimiento', {
  entidadId: req => req.params.pacienteId,
  contexto: req => ({ paciente_id: Number(req.params.pacienteId) })
}), async (req, res) => {
  try {
    const consentimientos = await Consentimiento.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'cedula'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(consentimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/consentimiento
router.post('/', auth, registrarActividad('crear', 'consentimiento', {
  contexto: (req, respuesta) => ({ paciente_id: Number(req.body.paciente_id), doctor_id: Number(respuesta?.doctor_id || req.body.doctor_id) })
}), async (req, res) => {
  try {
    const { paciente_id, doctor_id, tipo, contenido } = req.body;
    const doctorResponsableId = req.usuario.rol === 'doctor' ? req.usuario.id : Number(doctor_id);
    const doctor = await Usuario.findOne({ where: { id: doctorResponsableId, rol: 'doctor', activo: true } });
    if (!doctor) return res.status(400).json({ error: 'Selecciona un doctor activo responsable del consentimiento.' });
    if (!tipo?.trim()) return res.status(400).json({ error: 'El tipo de consentimiento es obligatorio.' });
    if (tipo.trim() === 'Aviso de privacidad y datos sensibles') {
      const config = await cargarConfiguracion();
      const faltantes = [
        ['privacidad_responsable', 'responsable del tratamiento'],
        ['clinica_direccion', 'domicilio del responsable'],
        ['privacidad_email_arco', 'correo para derechos ARCO'],
        ['privacidad_domicilio_arco', 'domicilio para derechos ARCO'],
        ['privacidad_version', 'versión del aviso']
      ].filter(([clave]) => !config[clave]).map(([, etiqueta]) => etiqueta);
      if (faltantes.length) return res.status(409).json({ error: `Completa en Configuración: ${faltantes.join(', ')}.` });
    }
    const texto = contenido || PLANTILLAS[tipo] || PLANTILLAS['Procedimiento general'];
    if (!texto?.trim()) return res.status(400).json({ error: 'El contenido del consentimiento es obligatorio.' });
    const consentimiento = await Consentimiento.create({
      paciente_id,
      doctor_id: doctor.id,
      creado_por_id: req.usuario.id,
      doctor_nombre: `${doctor.nombre} ${doctor.apellido}`.trim(),
      doctor_cedula: doctor.cedula || null,
      tipo: tipo.trim(),
      contenido: texto,
      documento_hash: hash({ paciente_id: Number(paciente_id), doctor_id: doctor.id, tipo: tipo.trim(), contenido: texto })
    });
    res.status(201).json(consentimiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/consentimiento/:id/firmar
router.put('/:id/firmar', auth, esDoctor, registrarActividad('firmar', 'consentimiento'), async (req, res) => {
  try {
    const consentimiento = await Consentimiento.findByPk(req.params.id);
    if (!consentimiento) return res.status(404).json({ error: 'Consentimiento no encontrado.' });
    if (consentimiento.firmado) return res.status(409).json({ error: 'El consentimiento ya fue firmado y es inmutable.' });
    const { firmante_nombre, firmante_caracter, aceptacion_explicita } = req.body;
    const caracteresValidos = ['paciente', 'madre_padre', 'tutor', 'representante_legal'];
    if (!firmante_nombre?.trim()) return res.status(400).json({ error: 'El nombre completo del firmante es obligatorio.' });
    if (!caracteresValidos.includes(firmante_caracter)) return res.status(400).json({ error: 'Indica el carácter con el que firma.' });
    if (aceptacion_explicita !== true) return res.status(400).json({ error: 'Se requiere la aceptación expresa del consentimiento.' });
    const fechaFirma = new Date();
    const documentoHash = consentimiento.documento_hash || hash({
      paciente_id: Number(consentimiento.paciente_id), doctor_id: Number(consentimiento.doctor_id),
      tipo: consentimiento.tipo, contenido: consentimiento.contenido
    });
    const firmaHash = hash({ documento_hash: documentoHash, firmante_nombre: firmante_nombre.trim(), firmante_caracter, fecha_firma: fechaFirma.toISOString() });
    await consentimiento.update({
      firmado: true,
      fecha_firma: fechaFirma,
      ip_firma: req.ip,
      firmado_por_id: req.usuario.id,
      firmante_nombre: firmante_nombre.trim(),
      firmante_caracter,
      aceptacion_explicita: true,
      documento_hash: documentoHash,
      firma_hash: firmaHash
    });
    res.json(consentimiento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
