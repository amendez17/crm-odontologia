const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consentimiento = sequelize.define('Consentimiento', {
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
  tipo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Ej: Extracción, Endodoncia, Ortodoncia, Implante, Blanqueamiento'
  },
  contenido: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  firmado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_firma: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ip_firma: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'consentimientos',
  timestamps: true
});

module.exports = Consentimiento;
