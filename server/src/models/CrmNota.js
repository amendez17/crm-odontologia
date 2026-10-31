const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmNota', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: true },
  tipo: { type: DataTypes.ENUM('NOTA', 'LLAMADA', 'WHATSAPP', 'VISITA', 'SISTEMA'), allowNull: false, defaultValue: 'NOTA' },
  texto: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'crm_notas', timestamps: true });
