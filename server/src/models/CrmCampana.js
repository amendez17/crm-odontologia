const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmCampana', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  creado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  plantilla_id: { type: DataTypes.INTEGER, allowNull: true },
  nombre: { type: DataTypes.STRING(160), allowNull: false },
  segmento: { type: DataTypes.STRING(40), allowNull: false },
  canal: { type: DataTypes.ENUM('WHATSAPP'), allowNull: false, defaultValue: 'WHATSAPP' },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  estado: { type: DataTypes.ENUM('BORRADOR', 'ACTIVA', 'FINALIZADA'), allowNull: false, defaultValue: 'BORRADOR' },
  lanzada_en: { type: DataTypes.DATE, allowNull: true },
  finalizada_en: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'crm_campanas', timestamps: true });
