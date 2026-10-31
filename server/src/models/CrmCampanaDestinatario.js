const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CrmCampanaDestinatario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campana_id: { type: DataTypes.INTEGER, allowNull: false },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  cita_id: { type: DataTypes.INTEGER, allowNull: true },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'ENVIADO', 'RESPONDIO', 'CITA', 'NO_CONTACTAR', 'ERROR'), allowNull: false, defaultValue: 'PENDIENTE' },
  enviado_en: { type: DataTypes.DATE, allowNull: true },
  respondido_en: { type: DataTypes.DATE, allowNull: true },
  ingreso_atribuido: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  notas: { type: DataTypes.STRING(500), allowNull: true }
}, {
  tableName: 'crm_campanas_destinatarios',
  timestamps: true,
  indexes: [{ unique: true, fields: ['campana_id', 'paciente_id'] }]
});
