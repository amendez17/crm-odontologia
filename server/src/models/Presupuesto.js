const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Presupuesto = sequelize.define('Presupuesto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aceptado', 'en_curso', 'finalizado', 'rechazado'),
    defaultValue: 'pendiente'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'presupuestos',
  timestamps: true
});

module.exports = Presupuesto;
