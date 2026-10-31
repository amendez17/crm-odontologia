const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmEtapa', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clave: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  color: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '#64748b' },
  probabilidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  tipo: { type: DataTypes.ENUM('ABIERTA', 'GANADA', 'PERDIDA'), allowNull: false, defaultValue: 'ABIERTA' },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: 'crm_etapas', timestamps: true });
