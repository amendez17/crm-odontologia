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
const Configuracion = require('./Configuracion');
const Consentimiento = require('./Consentimiento');
const LogActividad = require('./LogActividad');

// --- Asociaciones ---

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

// Historia Clínica
Paciente.hasMany(HistoriaClinica, { foreignKey: 'paciente_id', as: 'historias' });
HistoriaClinica.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(HistoriaClinica, { foreignKey: 'doctor_id', as: 'historias' });
HistoriaClinica.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });
Cita.hasOne(HistoriaClinica, { foreignKey: 'cita_id', as: 'historia' });
HistoriaClinica.belongsTo(Cita, { foreignKey: 'cita_id', as: 'cita' });

// Consentimientos
Paciente.hasMany(Consentimiento, { foreignKey: 'paciente_id', as: 'consentimientos' });
Consentimiento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Usuario.hasMany(Consentimiento, { foreignKey: 'doctor_id', as: 'consentimientos' });
Consentimiento.belongsTo(Usuario, { foreignKey: 'doctor_id', as: 'doctor' });

// Log de Actividad
Usuario.hasMany(LogActividad, { foreignKey: 'usuario_id', as: 'logs' });
LogActividad.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

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
  Configuracion,
  Consentimiento,
  LogActividad
};
