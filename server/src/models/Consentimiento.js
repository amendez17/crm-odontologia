const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consentimiento = sequelize.define('Consentimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  creado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  doctor_nombre: { type: DataTypes.STRING(220), allowNull: true },
  doctor_cedula: { type: DataTypes.STRING(80), allowNull: true },
  tipo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Ej: Extracción, Endodoncia, Ortodoncia, Implante, Blanqueamiento'
  },
  contenido: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  firmado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_firma: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ip_firma: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  firmado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  firmante_nombre: { type: DataTypes.STRING(220), allowNull: true },
  firmante_caracter: { type: DataTypes.ENUM('paciente', 'madre_padre', 'tutor', 'representante_legal'), allowNull: true },
  aceptacion_explicita: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  documento_hash: { type: DataTypes.STRING(64), allowNull: true },
  firma_hash: { type: DataTypes.STRING(64), allowNull: true }
}, {
  tableName: 'consentimientos',
  timestamps: true
});

module.exports = Consentimiento;
