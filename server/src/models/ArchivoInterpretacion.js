const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArchivoInterpretacion = sequelize.define('ArchivoInterpretacion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  archivo_id: { type: DataTypes.INTEGER, allowNull: false },
  texto: { type: DataTypes.TEXT, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_nombre: { type: DataTypes.STRING(220), allowNull: false },
  usuario_cedula: { type: DataTypes.STRING(80), allowNull: true },
  fecha: { type: DataTypes.DATE, allowNull: false },
  firma_hash: { type: DataTypes.STRING(64), allowNull: false }
}, {
  tableName: 'archivos_interpretaciones',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['archivo_id'] }, { fields: ['usuario_id'] }]
});

module.exports = ArchivoInterpretacion;
