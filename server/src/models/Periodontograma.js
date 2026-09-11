const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Periodontograma = sequelize.define('Periodontograma', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  doctor_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha_hora: { type: DataTypes.DATE, allowNull: false },
  doctor_nombre: { type: DataTypes.STRING(220), allowNull: false },
  doctor_cedula: { type: DataTypes.STRING(80), allowNull: true },
  mediciones: { type: DataTypes.JSON, allowNull: false },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  firma_hash: { type: DataTypes.STRING(64), allowNull: false }
}, {
  tableName: 'periodontogramas',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['paciente_id', 'fecha_hora'] }]
});

module.exports = Periodontograma;
