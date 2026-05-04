const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetallePresupuesto = sequelize.define('DetallePresupuesto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  presupuesto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tratamiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pieza_dental: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número de pieza dental (1-32)'
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_curso', 'completado'),
    defaultValue: 'pendiente'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'detalle_presupuestos',
  timestamps: true
});

module.exports = DetallePresupuesto;
