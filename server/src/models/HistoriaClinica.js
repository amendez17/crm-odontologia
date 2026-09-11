const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistoriaClinica = sequelize.define('HistoriaClinica', {
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
  cita_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: true
  },
  doctor_nombre: {
    type: DataTypes.STRING(220),
    allowNull: true
  },
  doctor_cedula: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  firma_hash: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  registro_previo_hash: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  es_adenda: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  historia_origen_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  motivo_adenda: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tratamiento_realizado: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  piezas_tratadas: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Piezas dentales separadas por coma'
  },
  receta: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  proxima_visita: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'historia_clinica',
  timestamps: true
});

module.exports = HistoriaClinica;
