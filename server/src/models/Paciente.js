const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  genero: {
    type: DataTypes.ENUM('masculino', 'femenino', 'otro'),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  obra_social: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  numero_afiliado: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  antecedentes_medicos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alergias: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicamentos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pacientes',
  timestamps: true
});

module.exports = Paciente;
