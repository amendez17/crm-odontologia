const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmTarea', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: true },
  oportunidad_id: { type: DataTypes.INTEGER, allowNull: true },
  asignado_id: { type: DataTypes.INTEGER, allowNull: true },
  creado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  titulo: { type: DataTypes.STRING(160), allowNull: false },
  tipo: { type: DataTypes.ENUM('LLAMADA', 'WHATSAPP', 'CITA', 'SEGUIMIENTO', 'OTRA'), allowNull: false, defaultValue: 'SEGUIMIENTO' },
  prioridad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'), allowNull: false, defaultValue: 'MEDIA' },
  vence: { type: DataTypes.DATE, allowNull: true },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'HECHA'), allowNull: false, defaultValue: 'PENDIENTE' },
  completada_en: { type: DataTypes.DATE, allowNull: true },
  notas: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'crm_tareas', timestamps: true });
