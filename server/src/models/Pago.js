const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  presupuesto_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  numero_recibo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'pagos',
  timestamps: true
});

module.exports = Pago;
