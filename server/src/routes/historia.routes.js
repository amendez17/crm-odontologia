const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { Op } = require('sequelize');
const { almacenamientoConfigurado, subirPrivado, urlPrivadaTemporal, eliminarPrivado } = require('../services/storage');
const { sequelize, HistoriaClinica, ArchivoHistoria, ArchivoInterpretacion, Usuario, Cita, Paciente } = require('../models');
const { auth, esAdmin, esDoctor } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const router = express.Router();

const contenidoFirma = data => JSON.stringify({
  paciente_id: Number(data.paciente_id),
  doctor_id: Number(data.doctor_id),
  fecha_hora: new Date(data.fecha_hora).toISOString(),
  tipo_nota: data.tipo_nota || 'subsecuente',
  antecedentes_heredofamiliares: data.antecedentes_heredofamiliares || '',
  antecedentes_patologicos: data.antecedentes_patologicos || '',
  antecedentes_no_patologicos: data.antecedentes_no_patologicos || '',
  antecedentes_odontologicos: data.antecedentes_odontologicos || '',
  habitos_orales: data.habitos_orales || '',
  interrogatorio_sistemas: data.interrogatorio_sistemas || '',
  motivo_consulta: data.motivo_consulta || '',
  interrogatorio: data.interrogatorio || '',
  exploracion_extraoral: data.exploracion_extraoral || '',
  exploracion_intraoral: data.exploracion_intraoral || '',
  presion_arterial: data.presion_arterial || '',
  frecuencia_cardiaca: data.frecuencia_cardiaca ? Number(data.frecuencia_cardiaca) : null,
  frecuencia_respiratoria: data.frecuencia_respiratoria ? Number(data.frecuencia_respiratoria) : null,
  temperatura: data.temperatura ? Number(data.temperatura) : null,
  peso: data.peso ? Number(data.peso) : null,
  talla: data.talla ? Number(data.talla) : null,
  diagnostico: data.diagnostico || '',
  tratamiento_realizado: data.tratamiento_realizado || '',
  piezas_tratadas: data.piezas_tratadas || '',
  receta: data.receta || '',
  proxima_visita: data.proxima_visita || '',
  notas: data.notas || '',
  pronostico: data.pronostico || '',
  indicaciones: data.indicaciones || '',
  es_adenda: Boolean(data.es_adenda),
  historia_origen_id: data.historia_origen_id ? Number(data.historia_origen_id) : null,
  motivo_adenda: data.motivo_adenda || '',
  registro_previo_hash: data.registro_previo_hash || ''
});

const firmarRegistro = data => crypto
  .createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(contenidoFirma(data))
  .digest('hex');

const firmarInterpretacion = data => crypto
  .createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(JSON.stringify({ archivo_id: Number(data.id), historia_id: Number(data.historia_id), public_id: data.public_id,
    interpretacion: data.interpretacion || '', interpretado_por_id: Number(data.interpretado_por_id),
    fecha_interpretacion: new Date(data.fecha_interpretacion).toISOString() }))
  .digest('hex');

const firmarInterpretacionMultiple = data => crypto
  .createHmac('sha256', process.env.EXPEDIENTE_SIGNING_SECRET || process.env.JWT_SECRET)
  .update(JSON.stringify({
    archivo_id: Number(data.archivo_id), texto: data.texto || '', usuario_id: Number(data.usuario_id),
    usuario_nombre: data.usuario_nombre || '', usuario_cedula: data.usuario_cedula || '',
    fecha: new Date(data.fecha).toISOString()
  }))
  .digest('hex');

const validarNotaClinica = body => {
  if (!['inicial', 'subsecuente'].includes(body.tipo_nota)) return 'Selecciona si es primera consulta o consulta subsecuente.';
  if (!body.motivo_consulta?.trim()) return 'El motivo de consulta es obligatorio.';
  if (body.tipo_nota === 'inicial' && !body.interrogatorio?.trim()) return 'El padecimiento actual es obligatorio en la primera consulta.';
  if (body.tipo_nota === 'inicial' && !body.exploracion_intraoral?.trim()) return 'La exploración intraoral es obligatoria en la primera consulta.';
  if (!body.diagnostico?.trim()) return 'El diagnóstico o problema clínico es obligatorio.';
  if (!body.receta?.trim()) return 'El plan de tratamiento es obligatorio.';
  const limites = [
    ['frecuencia_cardiaca', 20, 250, 'frecuencia cardiaca'],
    ['frecuencia_respiratoria', 5, 80, 'frecuencia respiratoria'],
    ['temperatura', 30, 45, 'temperatura'],
    ['peso', 1, 500, 'peso'],
    ['talla', 30, 250, 'talla']
  ];
  for (const [campo, minimo, maximo, etiqueta] of limites) {
    if (body[campo] !== '' && body[campo] != null) {
      const valor = Number(body[campo]);
      if (!Number.isFinite(valor) || valor < minimo || valor > maximo) return `El valor de ${etiqueta} no es válido.`;
    }
  }
  if (body.presion_arterial && !/^\d{2,3}\/\d{2,3}$/.test(body.presion_arterial.trim())) return 'Usa el formato 120/80 para la presión arterial.';
  return null;
};

const crearRegistroInmutable = async ({ body, usuario, origen = null }) => {
  const fechaHora = new Date();
  fechaHora.setMilliseconds(0);
  const previo = await HistoriaClinica.findOne({
    where: { paciente_id: origen?.paciente_id || body.paciente_id },
    order: [['id', 'DESC']]
  });
  const data = {
    tipo_nota: origen ? 'adenda' : (body.tipo_nota === 'inicial' ? 'inicial' : 'subsecuente'),
    antecedentes_heredofamiliares: body.antecedentes_heredofamiliares || null,
    antecedentes_patologicos: body.antecedentes_patologicos || null,
    antecedentes_no_patologicos: body.antecedentes_no_patologicos || null,
    antecedentes_odontologicos: body.antecedentes_odontologicos || null,
    habitos_orales: body.habitos_orales || null,
    interrogatorio_sistemas: body.interrogatorio_sistemas || null,
    motivo_consulta: body.motivo_consulta || null,
    interrogatorio: body.interrogatorio || null,
    exploracion_extraoral: body.exploracion_extraoral || null,
    exploracion_intraoral: body.exploracion_intraoral || null,
    presion_arterial: body.presion_arterial || null,
    frecuencia_cardiaca: body.frecuencia_cardiaca ? Number(body.frecuencia_cardiaca) : null,
    frecuencia_respiratoria: body.frecuencia_respiratoria ? Number(body.frecuencia_respiratoria) : null,
    temperatura: body.temperatura ? Number(body.temperatura) : null,
    peso: body.peso ? Number(body.peso) : null,
    talla: body.talla ? Number(body.talla) : null,
    diagnostico: body.diagnostico || null,
    tratamiento_realizado: body.tratamiento_realizado || null,
    piezas_tratadas: body.piezas_tratadas || null,
    receta: body.receta || null,
    proxima_visita: body.proxima_visita || null,
    notas: body.notas || null,
    pronostico: body.pronostico || null,
    indicaciones: body.indicaciones || null,
    paciente_id: origen?.paciente_id || Number(body.paciente_id),
    cita_id: origen?.cita_id || body.cita_id || null,
    doctor_id: usuario.id,
    doctor_nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
    doctor_cedula: usuario.cedula || null,
    fecha: fechaHora.toISOString().slice(0, 10),
    fecha_hora: fechaHora,
    es_adenda: Boolean(origen),
    historia_origen_id: origen?.id || null,
    motivo_adenda: origen ? body.motivo_adenda : null,
    registro_previo_hash: previo?.firma_hash || null
  };
  data.firma_hash = firmarRegistro(data);
  return HistoriaClinica.create(data);
};

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP y archivos PDF.'));
    }
    cb(null, true);
  }
});

// GET /api/historia/:pacienteId
router.get('/:pacienteId', auth, registrarActividad('consultar', 'expediente_clinico', {
  entidadId: req => req.params.pacienteId,
  contexto: req => ({ paciente_id: Number(req.params.pacienteId) })
}), async (req, res) => {
  try {
    const historias = await HistoriaClinica.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [
        { model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido', 'cedula'] },
        { model: Cita, as: 'cita' },
        { model: ArchivoHistoria, as: 'archivos', include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
          { model: ArchivoInterpretacion, as: 'interpretaciones' }
        ] }
      ],
      order: [['fecha', 'DESC']]
    });
    const respuesta = await Promise.all(historias.map(async historia => {
      const data = historia.toJSON();
      data.integridad_valida = data.firma_hash ? firmarRegistro(data) === data.firma_hash : null;
      data.archivos = await Promise.all((data.archivos || []).map(async archivo => {
        const interpretaciones = (archivo.interpretaciones || []).map(item => ({
          ...item,
          integridad_valida: firmarInterpretacionMultiple(item) === item.firma_hash
        }));
        if (archivo.interpretacion) interpretaciones.unshift({
          id: `legado-${archivo.id}`,
          texto: archivo.interpretacion,
          usuario_nombre: archivo.interpretado_por_nombre,
          usuario_cedula: archivo.interpretado_por_cedula,
          fecha: archivo.fecha_interpretacion,
          integridad_valida: archivo.interpretacion_hash ? firmarInterpretacion(archivo) === archivo.interpretacion_hash : null,
          legado: true
        });
        return { ...archivo, interpretaciones, url: await urlPrivadaTemporal(archivo), public_id: undefined };
      }));
      return data;
    }));
    res.json(respuesta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/historia/:pacienteId/exportar
// Deja constancia independiente de cada impresión o exportación del expediente.
router.post('/:pacienteId/exportar', auth, registrarActividad('exportar', 'expediente_clinico', {
  entidadId: req => req.params.pacienteId,
  contexto: (req, respuesta) => ({
    paciente_id: Number(req.params.pacienteId),
    formato: req.body?.formato === 'impresion_pdf' ? 'impresion_pdf' : 'impresion',
    secciones: Array.isArray(req.body?.secciones) ? req.body.secciones.slice(0, 10) : [],
    totales: req.body?.totales && typeof req.body.totales === 'object' ? req.body.totales : {},
    folio_exportacion: respuesta?.folio || null
  })
}), async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.pacienteId, { attributes: ['id'] });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    const fechaServidor = new Date();
    const fechaFolio = fechaServidor.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const folio = `EXP-${fechaFolio}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    res.json({ registrado: true, folio, fecha_servidor: fechaServidor.toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/historia/:historiaId/archivos
router.post('/:historiaId/archivos', auth, esDoctor, registrarActividad('anexar_archivo', 'historia_clinica', {
  entidadId: req => req.params.historiaId,
  contexto: (_req, respuesta) => ({ total_archivos: respuesta?.total || 0 })
}), upload.array('archivos', 10), async (req, res) => {
  const subidos = [];
  let transaction;
  try {
    if (!almacenamientoConfigurado()) {
      return res.status(503).json({ error: 'El almacenamiento de archivos no está configurado.' });
    }
    const historia = await HistoriaClinica.findByPk(req.params.historiaId);
    if (!historia) return res.status(404).json({ error: 'Registro de historia clínica no encontrado.' });
    if (!req.files?.length) return res.status(400).json({ error: 'Selecciona al menos un archivo.' });
    let interpretaciones;
    try { interpretaciones = JSON.parse(req.body.interpretaciones || '[]'); } catch { return res.status(400).json({ error: 'Las interpretaciones enviadas no son válidas.' }); }
    if (!Array.isArray(interpretaciones)) return res.status(400).json({ error: 'Las interpretaciones enviadas no son válidas.' });
    if (!interpretaciones.length) interpretaciones = Array(req.files.length).fill('');
    if (interpretaciones.length !== req.files.length) return res.status(400).json({ error: 'La cantidad de interpretaciones no coincide con los archivos.' });
    interpretaciones = interpretaciones.map(texto => typeof texto === 'string' ? texto.trim() : '');
    if (interpretaciones.some(texto => texto && (texto.length < 5 || texto.length > 5000))) {
      return res.status(400).json({ error: 'Las interpretaciones escritas deben contener entre 5 y 5000 caracteres.' });
    }
    let nombresOriginales;
    try { nombresOriginales = JSON.parse(req.body.nombres_originales || '[]'); } catch { nombresOriginales = []; }
    if (!Array.isArray(nombresOriginales) || nombresOriginales.length !== req.files.length) {
      nombresOriginales = req.files.map(file => file.originalname);
    }
    nombresOriginales = nombresOriginales.map((nombre, indice) => String(nombre || req.files[indice].originalname).slice(0, 255));

    for (const file of req.files) {
      const resultado = await subirPrivado(file, {
        carpeta: `clinica-almar/pacientes/${historia.paciente_id}/historia-clinica`,
        resourceType: 'auto'
      });
      subidos.push({ resultado, file });
    }

    transaction = await sequelize.transaction();
    const fechaInterpretacion = new Date(); fechaInterpretacion.setMilliseconds(0);
    const archivos = [];
    for (let indice = 0; indice < subidos.length; indice += 1) {
      const { resultado, file } = subidos[indice];
      const archivo = await ArchivoHistoria.create({
        historia_id: historia.id,
        usuario_id: req.usuario.id,
        nombre_original: nombresOriginales[indice],
        tipo: file.mimetype === 'application/pdf' ? 'pdf' : 'imagen',
        mime_type: file.mimetype,
        tamano: file.size,
        url: resultado.secure_url,
        public_id: resultado.public_id,
        resource_type: resultado.resource_type,
        formato: resultado.format || (file.mimetype === 'application/pdf' ? 'pdf' : null),
        delivery_type: resultado.type || 'authenticated'
      }, { transaction });
      if (interpretaciones[indice]) {
        const datosInterpretacion = {
          archivo_id: archivo.id,
          texto: interpretaciones[indice],
          usuario_id: req.usuario.id,
          usuario_nombre: `${req.usuario.nombre} ${req.usuario.apellido}`.trim(),
          usuario_cedula: req.usuario.cedula || null,
          fecha: fechaInterpretacion
        };
        datosInterpretacion.firma_hash = firmarInterpretacionMultiple(datosInterpretacion);
        await ArchivoInterpretacion.create(datosInterpretacion, { transaction });
      }
      archivos.push(archivo);
    }
    await transaction.commit(); transaction = null;
    res.status(201).json({ mensaje: 'Archivos guardados correctamente.', total: archivos.length });
  } catch (error) {
    if (transaction) await transaction.rollback();
    await Promise.allSettled(subidos.map(({ resultado }) => eliminarPrivado({
      public_id: resultado.public_id,
      resource_type: resultado.resource_type,
      delivery_type: resultado.type || 'authenticated'
    })));
    res.status(400).json({ error: error.message || 'No fue posible subir los archivos.' });
  }
});

// POST /api/historia/archivos/:archivoId/interpretacion
router.post('/archivos/:archivoId/interpretacion', auth, esDoctor, registrarActividad('interpretar_archivo', 'archivo_historia', {
  entidadId: req => req.params.archivoId
}), async (req, res) => {
  try {
    const texto = req.body.interpretacion?.trim();
    if (!texto || texto.length < 5) return res.status(400).json({ error: 'Escribe una interpretación clínica válida.' });
    if (texto.length > 5000) return res.status(400).json({ error: 'La interpretación no puede superar 5000 caracteres.' });
    const archivo = await ArchivoHistoria.findByPk(req.params.archivoId);
    if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado.' });
    const fecha = new Date(); fecha.setMilliseconds(0);
    const datos = {
      archivo_id: archivo.id, texto, usuario_id: req.usuario.id,
      usuario_nombre: `${req.usuario.nombre} ${req.usuario.apellido}`.trim(),
      usuario_cedula: req.usuario.cedula || null, fecha
    };
    datos.firma_hash = firmarInterpretacionMultiple(datos);
    const interpretacion = await ArchivoInterpretacion.create(datos);
    res.status(201).json({ mensaje: 'Interpretación clínica guardada.', id: interpretacion.id });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// DELETE /api/historia/archivos/:archivoId
router.delete('/archivos/:archivoId', auth, esDoctor, registrarActividad('intento_eliminar', 'archivo_historia'), async (_req, res) => {
  res.status(409).json({ error: 'Los anexos del expediente no pueden eliminarse. Registra una adenda si necesitas aclarar o sustituir un documento.' });
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError || error?.message?.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Cada archivo debe pesar máximo 10 MB.' : error.message });
  }
  next(error);
});

// POST /api/historia/:id/regularizar-integridad
// Uso excepcional cuando el paciente ya fue corregido directamente en la BD.
// No altera el contenido clínico: únicamente vuelve a sellar el registro actual
// y conserva la razón en la bitácora de actividad.
router.post('/:id/regularizar-integridad', auth, esAdmin, registrarActividad('regularizar_integridad', 'historia_clinica', {
  contexto: (req, respuesta) => ({
    paciente_id: Number(respuesta?.paciente_id) || null,
    motivo: String(req.body?.motivo || '').trim().slice(0, 1000),
    firma_anterior: respuesta?.firma_anterior || null,
    firma_nueva: respuesta?.firma_nueva || null
  })
}), async (req, res) => {
  try {
    const motivo = String(req.body.motivo || '').trim();
    if (motivo.length < 10 || motivo.length > 1000) {
      return res.status(400).json({ error: 'Describe el motivo de la regularización (10 a 1000 caracteres).' });
    }
    const historia = await HistoriaClinica.findByPk(req.params.id);
    if (!historia) return res.status(404).json({ error: 'Registro de historia clínica no encontrado.' });
    const paciente = await Paciente.findByPk(historia.paciente_id, { attributes: ['id', 'nombre', 'apellido', 'dni'] });
    if (!paciente) return res.status(409).json({ error: 'El paciente actual del registro no existe.' });
    if (String(req.body.confirmacion || '').trim().toUpperCase() !== String(paciente.dni || '').trim().toUpperCase()) {
      return res.status(400).json({ error: 'La confirmación no coincide con el número de paciente.' });
    }
    const firmaAnterior = historia.firma_hash;
    const firmaNueva = firmarRegistro(historia.toJSON());
    if (firmaAnterior && firmaAnterior === firmaNueva) {
      return res.status(409).json({ error: 'La integridad de este registro ya está verificada.' });
    }
    await historia.update({ firma_hash: firmaNueva });
    res.json({
      mensaje: 'Integridad regularizada y registrada en auditoría.',
      id: historia.id,
      paciente_id: paciente.id,
      firma_anterior: firmaAnterior,
      firma_nueva: firmaNueva
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'No fue posible regularizar la integridad.' });
  }
});

// POST /api/historia/:id/transferir
// Corrige una asignación equivocada sin editar la BD manualmente. Los anexos e
// interpretaciones conservan sus IDs y permanecen unidos a la misma historia.
router.post('/:id/transferir', auth, esAdmin, registrarActividad('transferir', 'historia_clinica', {
  contexto: (req, respuesta) => ({
    paciente_origen_id: Number(respuesta?.paciente_origen_id) || null,
    paciente_destino_id: Number(respuesta?.paciente_destino_id || req.body?.paciente_destino_id) || null,
    motivo: String(req.body?.motivo || '').trim().slice(0, 1000),
    firma_anterior: respuesta?.firma_anterior || null,
    firma_nueva: respuesta?.firma_nueva || null
  })
}), async (req, res) => {
  let transaction = await sequelize.transaction();
  try {
    const destinoId = Number(req.body.paciente_destino_id);
    const motivo = String(req.body.motivo || '').trim();
    if (!Number.isInteger(destinoId) || destinoId <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Selecciona el paciente correcto.' });
    }
    if (motivo.length < 10 || motivo.length > 1000) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Describe el motivo de la transferencia (10 a 1000 caracteres).' });
    }
    const historia = await HistoriaClinica.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!historia) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Registro de historia clínica no encontrado.' });
    }
    if (Number(historia.paciente_id) === destinoId) {
      await transaction.rollback();
      return res.status(409).json({ error: 'La historia ya pertenece a ese paciente. Usa Regularizar integridad si fue cambiada en la BD.' });
    }
    const [origen, destino] = await Promise.all([
      Paciente.findByPk(historia.paciente_id, { attributes: ['id', 'nombre', 'apellido', 'dni'], transaction }),
      Paciente.findOne({ where: { id: destinoId, activo: true }, attributes: ['id', 'nombre', 'apellido', 'dni'], transaction })
    ]);
    if (!destino) {
      await transaction.rollback();
      return res.status(404).json({ error: 'El paciente destino no existe o está inactivo.' });
    }
    if (String(req.body.confirmacion || '').trim().toUpperCase() !== String(destino.dni || '').trim().toUpperCase()) {
      await transaction.rollback();
      return res.status(400).json({ error: 'La confirmación no coincide con el número del paciente destino.' });
    }

    const previoDestino = await HistoriaClinica.findOne({
      where: { paciente_id: destinoId, id: { [Op.ne]: historia.id } },
      order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
      transaction
    });
    let citaId = historia.cita_id;
    if (citaId) {
      const cita = await Cita.findByPk(citaId, { attributes: ['id', 'paciente_id'], transaction });
      if (!cita || Number(cita.paciente_id) !== destinoId) citaId = null;
    }
    const valores = {
      paciente_id: destinoId,
      cita_id: citaId,
      registro_previo_hash: previoDestino?.firma_hash || null
    };
    const firmaAnterior = historia.firma_hash;
    const firmaNueva = firmarRegistro({ ...historia.toJSON(), ...valores });
    await historia.update({ ...valores, firma_hash: firmaNueva }, { transaction });
    await transaction.commit();
    transaction = null;
    res.json({
      mensaje: 'Historia transferida y sellada correctamente.',
      id: historia.id,
      paciente_origen_id: Number(origen?.id || historia.paciente_id),
      paciente_destino_id: destino.id,
      paciente_destino: `${destino.nombre} ${destino.apellido}`.trim(),
      firma_anterior: firmaAnterior,
      firma_nueva: firmaNueva
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ error: error.message || 'No fue posible transferir la historia.' });
  }
});

// POST /api/historia
router.post('/', auth, esDoctor, registrarActividad('crear', 'historia_clinica', {
  contexto: (req, respuesta) => ({ paciente_id: Number(respuesta?.paciente_id || req.body.paciente_id) })
}), async (req, res) => {
  try {
    const totalPrevio = await HistoriaClinica.count({ where: { paciente_id: Number(req.body.paciente_id) } });
    if (totalPrevio === 0 && req.body.tipo_nota !== 'inicial') {
      return res.status(400).json({ error: 'El primer registro del paciente debe ser una historia clínica inicial extensa.' });
    }
    const errorValidacion = validarNotaClinica(req.body);
    if (errorValidacion) return res.status(400).json({ error: errorValidacion });
    const historia = await crearRegistroInmutable({ body: req.body, usuario: req.usuario });
    res.status(201).json(historia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/historia/:id/adendas - las correcciones se agregan, nunca sobrescriben
router.post('/:id/adendas', auth, esDoctor, registrarActividad('crear_adenda', 'historia_clinica', {
  contexto: (req, respuesta) => ({ historia_origen_id: Number(req.params.id), paciente_id: Number(respuesta?.paciente_id) || null })
}), async (req, res) => {
  try {
    const origen = await HistoriaClinica.findByPk(req.params.id);
    if (!origen) return res.status(404).json({ error: 'Registro original no encontrado.' });
    if (!req.body.motivo_adenda?.trim()) return res.status(400).json({ error: 'El motivo de la adenda es obligatorio.' });
    const historia = await crearRegistroInmutable({ body: req.body, usuario: req.usuario, origen });
    res.status(201).json(historia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/historia/:id
router.put('/:id', auth, esDoctor, async (req, res) => {
  res.status(409).json({ error: 'Las notas clínicas son inmutables. Registra una adenda para corregir o ampliar información.' });
});

module.exports = router;
