const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Paciente = require('./Paciente');
const Cita = require('./Cita');
const CategoriaTratamiento = require('./CategoriaTratamiento');
const Tratamiento = require('./Tratamiento');
const Presupuesto = require('./Presupuesto');
const DetallePresupuesto = require('./DetallePresupuesto');
const Odontograma = require('./Odontograma');
const Pago = require('./Pago');
const HistoriaClinica = require('./HistoriaClinica');
const ArchivoHistoria = require('./ArchivoHistoria');
const ArchivoInterpretacion = require('./ArchivoInterpretacion');
const Configuracion = require('./Configuracion');
const Consentimiento = require('./Consentimiento');
const LogActividad = require('./LogActividad');
const Receta = require('./Receta')(sequelize, require('sequelize').DataTypes);
const Periodontograma = require('./Periodontograma');
const EntregaExpediente = require('./EntregaExpediente');
const Factura = require('./Factura');
const CrmEtapa = require('./CrmEtapa');
const CrmOportunidad = require('./CrmOportunidad');
const CrmTarea = require('./CrmTarea');
const CrmNota = require('./CrmNota');
const CrmPerfil = require('./CrmPerfil');
const CrmCampana = require('./CrmCampana');
const CrmCampanaDestinatario = require('./CrmCampanaDestinatario');
const CrmPlantillaCampana = require('./CrmPlantillaCampana');

// --- Asociaciones ---

//Presupuestos-Citas
Presupuesto.belongsTo(Cita, {foreignKey: 'cita_id',as: 'cita'});
Cita.hasOne(Presupuesto, {foreignKey: 'cita_id',as: 'presupuesto'
});
// Citas
Paciente.hasMany(Cita, { foreignKey: 'paciente_id', as: 'citas' });
Cita.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Cita, { foreignKey: 'doctor_id', as: 'citas' });
Cita.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });

// Tratamientos - Categorías
CategoriaTratamiento.hasMany(Tratamiento, { foreignKey: 'categoria_id', as: 'tratamientos' });
Tratamiento.belongsTo(CategoriaTratamiento, { foreignKey: 'categoria_id', as: 'categoria' });

// Presupuestos
Paciente.hasMany(Presupuesto, { foreignKey: 'paciente_id', as: 'presupuestos' });
Presupuesto.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Presupuesto, { foreignKey: 'doctor_id', as: 'presupuestos' });
Presupuesto.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });

// Detalle Presupuestos
Presupuesto.hasMany(DetallePresupuesto, { foreignKey: 'presupuesto_id', as: 'detalles' });
DetallePresupuesto.belongsTo(Presupuesto, { foreignKey: 'presupuesto_id', as: 'presupuesto' });
Tratamiento.hasMany(DetallePresupuesto, { foreignKey: 'tratamiento_id', as: 'detalles' });
DetallePresupuesto.belongsTo(Tratamiento, { foreignKey: 'tratamiento_id', as: 'tratamiento' });

// Odontograma
Paciente.hasMany(Odontograma, { foreignKey: 'paciente_id', as: 'odontograma' });
Odontograma.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Odontograma, { foreignKey: 'doctor_id', as: 'odontogramas' });
Odontograma.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });

// Pagos
Paciente.hasMany(Pago, { foreignKey: 'paciente_id', as: 'pagos' });
Pago.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Presupuesto.hasMany(Pago, { foreignKey: 'presupuesto_id', as: 'pagos' });
Pago.belongsTo(Presupuesto, { foreignKey: 'presupuesto_id', as: 'presupuesto' });
Pago.hasMany(Factura, { foreignKey: 'pago_id', as: 'facturas' });
Factura.belongsTo(Pago, { foreignKey: 'pago_id', as: 'pago' });
Paciente.hasMany(Factura, { foreignKey: 'paciente_id', as: 'facturas' });
Factura.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Factura, { foreignKey: 'creado_por_id', as: 'facturasRegistradas' });
Factura.belongsTo(Usuario, { foreignKey: 'creado_por_id', as: 'creadoPor' });

// Historia Clínica
Paciente.hasMany(HistoriaClinica, { foreignKey: 'paciente_id', as: 'historias' });
HistoriaClinica.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(HistoriaClinica, { foreignKey: 'doctor_id', as: 'historias' });
HistoriaClinica.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });
Cita.hasOne(HistoriaClinica, { foreignKey: 'cita_id', as: 'historia' });
HistoriaClinica.belongsTo(Cita, { foreignKey: 'cita_id', as: 'cita' });
HistoriaClinica.hasMany(ArchivoHistoria, { foreignKey: 'historia_id', as: 'archivos', onDelete: 'CASCADE' });
ArchivoHistoria.belongsTo(HistoriaClinica, { foreignKey: 'historia_id', as: 'historia' });
Usuario.hasMany(ArchivoHistoria, { foreignKey: 'usuario_id', as: 'archivosHistoria' });
ArchivoHistoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
ArchivoHistoria.hasMany(ArchivoInterpretacion, { foreignKey: 'archivo_id', as: 'interpretaciones', onDelete: 'CASCADE' });
ArchivoInterpretacion.belongsTo(ArchivoHistoria, { foreignKey: 'archivo_id', as: 'archivo' });
Usuario.hasMany(ArchivoInterpretacion, { foreignKey: 'usuario_id', as: 'interpretacionesArchivos' });
ArchivoInterpretacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Paciente.hasMany(EntregaExpediente, { foreignKey: 'paciente_id', as: 'entregasExpediente' });
EntregaExpediente.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(EntregaExpediente, { foreignKey: 'responsable_id', as: 'entregasExpediente' });
EntregaExpediente.belongsTo(Usuario, { foreignKey: 'responsable_id', as: 'responsable' });

Paciente.hasMany(Periodontograma, { foreignKey: 'paciente_id', as: 'periodontogramas' });
Periodontograma.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Periodontograma, { foreignKey: 'doctor_id', as: 'periodontogramas' });
Periodontograma.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });

// Consentimientos
Paciente.hasMany(Consentimiento, { foreignKey: 'paciente_id', as: 'consentimientos' });
Consentimiento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Consentimiento, { foreignKey: 'doctor_id', as: 'consentimientos' });
Consentimiento.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });

// Log de Actividad
Usuario.hasMany(LogActividad, { foreignKey: 'usuario_id', as: 'logs' });
LogActividad.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
// Recetas
Paciente.hasMany(Receta, {
  foreignKey: 'pacienteId',
  as: 'recetas'
});

Receta.belongsTo(Paciente, {
  foreignKey: 'pacienteId',
  as: 'paciente'
});
// Relación receta -> doctor
Usuario.hasMany(Receta, {
  foreignKey: 'usuarioId',
  as: 'recetasDoctor'
});

Receta.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'doctor'
});

// CRM: datos comerciales separados del expediente clínico
Paciente.hasOne(CrmPerfil, { foreignKey: 'paciente_id', as: 'crmPerfil', onDelete: 'CASCADE' });
CrmPerfil.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
CrmPerfil.belongsTo(Usuario, { foreignKey: 'responsable_id', as: 'responsable' });

Paciente.hasMany(CrmOportunidad, { foreignKey: 'paciente_id', as: 'crmOportunidades' });
CrmOportunidad.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
CrmEtapa.hasMany(CrmOportunidad, { foreignKey: 'etapa_id', as: 'oportunidades' });
CrmOportunidad.belongsTo(CrmEtapa, { foreignKey: 'etapa_id', as: 'etapa' });
CrmOportunidad.belongsTo(Usuario, { foreignKey: 'responsable_id', as: 'responsable' });
CrmOportunidad.belongsTo(Usuario, { foreignKey: 'creado_por_id', as: 'creadoPor' });

Paciente.hasMany(CrmTarea, { foreignKey: 'paciente_id', as: 'crmTareas' });
CrmTarea.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
CrmOportunidad.hasMany(CrmTarea, { foreignKey: 'oportunidad_id', as: 'tareas' });
CrmTarea.belongsTo(CrmOportunidad, { foreignKey: 'oportunidad_id', as: 'oportunidad' });
CrmTarea.belongsTo(Usuario, { foreignKey: 'asignado_id', as: 'asignado' });
CrmTarea.belongsTo(Usuario, { foreignKey: 'creado_por_id', as: 'creadoPor' });

Paciente.hasMany(CrmNota, { foreignKey: 'paciente_id', as: 'crmNotas' });
CrmNota.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
CrmNota.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

CrmPlantillaCampana.hasMany(CrmCampana, { foreignKey: 'plantilla_id', as: 'campanas' });
CrmCampana.belongsTo(CrmPlantillaCampana, { foreignKey: 'plantilla_id', as: 'plantilla' });
Usuario.hasMany(CrmCampana, { foreignKey: 'creado_por_id', as: 'crmCampanas' });
CrmCampana.belongsTo(Usuario, { foreignKey: 'creado_por_id', as: 'creadoPor' });
CrmCampana.hasMany(CrmCampanaDestinatario, { foreignKey: 'campana_id', as: 'destinatarios', onDelete: 'CASCADE' });
CrmCampanaDestinatario.belongsTo(CrmCampana, { foreignKey: 'campana_id', as: 'campana' });
Paciente.hasMany(CrmCampanaDestinatario, { foreignKey: 'paciente_id', as: 'crmCampanasRecibidas' });
CrmCampanaDestinatario.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Cita.hasMany(CrmCampanaDestinatario, { foreignKey: 'cita_id', as: 'crmAtribuciones' });
CrmCampanaDestinatario.belongsTo(Cita, { foreignKey: 'cita_id', as: 'cita' });
module.exports = {
  sequelize,
  Usuario,
  Paciente,
  Cita,
  CategoriaTratamiento,
  Tratamiento,
  Presupuesto,
  DetallePresupuesto,
  Odontograma,
  Pago,
  HistoriaClinica,
  ArchivoHistoria,
  ArchivoInterpretacion,
  Configuracion,
  Consentimiento,
  LogActividad,
  Receta,
  Periodontograma,
  EntregaExpediente,
  Factura,
  CrmEtapa,
  CrmOportunidad,
  CrmTarea,
  CrmNota,
  CrmPerfil,
  CrmCampana,
  CrmCampanaDestinatario,
  CrmPlantillaCampana
};
