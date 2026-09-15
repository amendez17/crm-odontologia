const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('Factura', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pago_id: { type: DataTypes.INTEGER, allowNull: false },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  creado_por_id: { type: DataTypes.INTEGER, allowNull: false },
  uuid_fiscal: { type: DataTypes.STRING(36), allowNull: false, unique: true },
  serie: { type: DataTypes.STRING(25), allowNull: true },
  folio: { type: DataTypes.STRING(50), allowNull: true },
  rfc_receptor: { type: DataTypes.STRING(13), allowNull: false },
  razon_social: { type: DataTypes.STRING(255), allowNull: false },
  fecha_timbrado: { type: DataTypes.DATE, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: { type: DataTypes.ENUM('timbrada', 'cancelada'), allowNull: false, defaultValue: 'timbrada' },
  notas: { type: DataTypes.TEXT, allowNull: true },
  fecha_cancelacion: { type: DataTypes.DATE, allowNull: true },
  motivo_cancelacion: { type: DataTypes.TEXT, allowNull: true },
  xml_nombre: { type: DataTypes.STRING(255), allowNull: true },
  xml_public_id: { type: DataTypes.STRING(255), allowNull: true },
  xml_resource_type: { type: DataTypes.STRING(30), allowNull: true },
  xml_formato: { type: DataTypes.STRING(20), allowNull: true },
  xml_delivery_type: { type: DataTypes.STRING(30), allowNull: true },
  pdf_nombre: { type: DataTypes.STRING(255), allowNull: true },
  pdf_public_id: { type: DataTypes.STRING(255), allowNull: true },
  pdf_resource_type: { type: DataTypes.STRING(30), allowNull: true },
  pdf_formato: { type: DataTypes.STRING(20), allowNull: true },
  pdf_delivery_type: { type: DataTypes.STRING(30), allowNull: true }
}, {
  tableName: 'facturas',
  timestamps: true,
  indexes: [
    { fields: ['pago_id'] },
    { fields: ['paciente_id'] },
    { fields: ['fecha_timbrado'] },
    { fields: ['estado'] }
  ]
});

module.exports = Factura;
