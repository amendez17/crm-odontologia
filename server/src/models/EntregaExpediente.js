const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EntregaExpediente = sequelize.define('EntregaExpediente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  solicitante_nombre: { type: DataTypes.STRING(220), allowNull: false },
  solicitante_caracter: {
    type: DataTypes.ENUM('paciente', 'madre_padre', 'tutor', 'representante_legal', 'otro'),
    allowNull: false
  },
  documentos: { type: DataTypes.TEXT, allowNull: false },
  documentos_detalle: { type: DataTypes.TEXT, allowNull: true },
  motivo: { type: DataTypes.TEXT, allowNull: false },
  medio_entrega: { type: DataTypes.ENUM('impresa', 'digital', 'ambas'), allowNull: false },
  responsable_id: { type: DataTypes.INTEGER, allowNull: false },
  responsable_nombre: { type: DataTypes.STRING(220), allowNull: false },
  responsable_rol: { type: DataTypes.STRING(50), allowNull: false },
  fecha_entrega: { type: DataTypes.DATE, allowNull: false },
  firma_hash: { type: DataTypes.STRING(64), allowNull: false }
}, {
  tableName: 'entregas_expediente',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['paciente_id'] }, { fields: ['fecha_entrega'] }]
});

module.exports = EntregaExpediente;
