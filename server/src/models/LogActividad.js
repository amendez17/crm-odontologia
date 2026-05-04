const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogActividad = sequelize.define('LogActividad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  accion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'crear, actualizar, eliminar, login, logout'
  },
  entidad: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'paciente, cita, presupuesto, pago, etc.'
  },
  entidad_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  detalle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'log_actividad',
  timestamps: true,
  updatedAt: false
});

module.exports = LogActividad;
