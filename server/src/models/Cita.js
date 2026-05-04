const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cita = sequelize.define('Cita', {
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
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: true
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'),
    defaultValue: 'programada'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'citas',
  timestamps: true
});

module.exports = Cita;
