const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Odontograma = sequelize.define('Odontograma', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pieza_dental: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Número de pieza dental (11-48 notación FDI)'
  },
  cara: {
    type: DataTypes.ENUM('vestibular', 'lingual', 'mesial', 'distal', 'oclusal', 'completa'),
    defaultValue: 'completa'
  },
  estado: {
    type: DataTypes.ENUM('sano', 'caries', 'obturacion', 'corona', 'extraccion', 'endodoncia', 'implante', 'protesis', 'ausente', 'fractura'),
    defaultValue: 'sano'
  },
  tipo_registro: {
    type: DataTypes.ENUM('hallazgo', 'plan', 'realizado'),
    allowNull: false,
    defaultValue: 'hallazgo'
  },
  observacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fecha_hora: { type: DataTypes.DATE, allowNull: true },
  doctor_nombre: { type: DataTypes.STRING(220), allowNull: true },
  doctor_cedula: { type: DataTypes.STRING(80), allowNull: true },
  firma_hash: { type: DataTypes.STRING(64), allowNull: true },
  registro_previo_hash: { type: DataTypes.STRING(64), allowNull: true },
  firma_version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'odontograma',
  timestamps: true
});

module.exports = Odontograma;
