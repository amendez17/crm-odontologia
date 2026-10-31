const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmPerfil', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  responsable_id: { type: DataTypes.INTEGER, allowNull: true },
  origen: { type: DataTypes.STRING(60), allowNull: true },
  acepta_marketing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ultimo_contacto: { type: DataTypes.DATE, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'crm_perfiles_paciente', timestamps: true });
