const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contador = sequelize.define('Contador', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  pacientes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  anio: {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getFullYear()
  }
});

module.exports = Contador;
