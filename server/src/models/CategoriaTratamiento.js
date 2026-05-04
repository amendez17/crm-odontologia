const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoriaTratamiento = sequelize.define('CategoriaTratamiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categorias_tratamiento',
  timestamps: true
});

module.exports = CategoriaTratamiento;
