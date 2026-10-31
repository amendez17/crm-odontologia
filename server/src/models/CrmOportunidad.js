const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmOportunidad', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  etapa_id: { type: DataTypes.INTEGER, allowNull: false },
  responsable_id: { type: DataTypes.INTEGER, allowNull: true },
  creado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  titulo: { type: DataTypes.STRING(160), allowNull: false },
  tratamiento_interes: { type: DataTypes.STRING(180), allowNull: true },
  valor: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  origen: { type: DataTypes.STRING(60), allowNull: true },
  cierre_estimado: { type: DataTypes.DATEONLY, allowNull: true },
  estado: { type: DataTypes.ENUM('ABIERTA', 'GANADA', 'PERDIDA'), allowNull: false, defaultValue: 'ABIERTA' },
  motivo_perdida: { type: DataTypes.STRING(255), allowNull: true },
  notas: { type: DataTypes.TEXT, allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  cerrado_en: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'crm_oportunidades', timestamps: true });
