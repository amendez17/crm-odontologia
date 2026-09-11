const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArchivoHistoria = sequelize.define('ArchivoHistoria', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  historia_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre_original: { type: DataTypes.STRING(255), allowNull: false },
  tipo: { type: DataTypes.ENUM('imagen', 'pdf'), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: false },
  tamano: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  url: { type: DataTypes.TEXT, allowNull: false },
  public_id: { type: DataTypes.STRING(255), allowNull: false },
  resource_type: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'image' },
  formato: { type: DataTypes.STRING(20), allowNull: true },
  delivery_type: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'authenticated' },
  interpretacion: { type: DataTypes.TEXT, allowNull: true },
  interpretado_por_id: { type: DataTypes.INTEGER, allowNull: true },
  interpretado_por_nombre: { type: DataTypes.STRING(220), allowNull: true },
  interpretado_por_cedula: { type: DataTypes.STRING(80), allowNull: true },
  fecha_interpretacion: { type: DataTypes.DATE, allowNull: true },
  interpretacion_hash: { type: DataTypes.STRING(64), allowNull: true }
}, {
  tableName: 'archivos_historia',
  timestamps: true,
  indexes: [{ fields: ['historia_id'] }]
});

module.exports = ArchivoHistoria;
