const { DataTypes } = require('sequelize');

async function ensureComplianceSchema(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('historia_clinica');
  const columns = {
    fecha_hora: { type: DataTypes.DATE, allowNull: true },
    doctor_nombre: { type: DataTypes.STRING(220), allowNull: true },
    doctor_cedula: { type: DataTypes.STRING(80), allowNull: true },
    firma_hash: { type: DataTypes.STRING(64), allowNull: true },
    registro_previo_hash: { type: DataTypes.STRING(64), allowNull: true },
    es_adenda: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    historia_origen_id: { type: DataTypes.INTEGER, allowNull: true },
    motivo_adenda: { type: DataTypes.TEXT, allowNull: true }
  };

  for (const [name, definition] of Object.entries(columns)) {
    if (!table[name]) await queryInterface.addColumn('historia_clinica', name, definition);
  }
}

module.exports = ensureComplianceSchema;
