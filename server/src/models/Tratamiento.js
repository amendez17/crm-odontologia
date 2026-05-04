const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tratamiento = sequelize.define('Tratamiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duracion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tratamientos',
  timestamps: true
});

module.exports = Tratamiento;
