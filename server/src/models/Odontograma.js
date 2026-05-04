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
  observacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
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
