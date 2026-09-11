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
    motivo_adenda: { type: DataTypes.TEXT, allowNull: true },
    tipo_nota: { type: DataTypes.ENUM('inicial', 'subsecuente', 'adenda'), allowNull: false, defaultValue: 'subsecuente' },
    antecedentes_heredofamiliares: { type: DataTypes.TEXT, allowNull: true },
    antecedentes_patologicos: { type: DataTypes.TEXT, allowNull: true },
    antecedentes_no_patologicos: { type: DataTypes.TEXT, allowNull: true },
    antecedentes_odontologicos: { type: DataTypes.TEXT, allowNull: true },
    habitos_orales: { type: DataTypes.TEXT, allowNull: true },
    interrogatorio_sistemas: { type: DataTypes.TEXT, allowNull: true },
    motivo_consulta: { type: DataTypes.TEXT, allowNull: true },
    interrogatorio: { type: DataTypes.TEXT, allowNull: true },
    exploracion_extraoral: { type: DataTypes.TEXT, allowNull: true },
    exploracion_intraoral: { type: DataTypes.TEXT, allowNull: true },
    presion_arterial: { type: DataTypes.STRING(20), allowNull: true },
    frecuencia_cardiaca: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    frecuencia_respiratoria: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    temperatura: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
    peso: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    talla: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    pronostico: { type: DataTypes.TEXT, allowNull: true },
    indicaciones: { type: DataTypes.TEXT, allowNull: true }
  };

  for (const [name, definition] of Object.entries(columns)) {
    if (!table[name]) await queryInterface.addColumn('historia_clinica', name, definition);
  }

  const consentTable = await queryInterface.describeTable('consentimientos');
  const consentColumns = {
    creado_por_id: { type: DataTypes.INTEGER, allowNull: true },
    doctor_nombre: { type: DataTypes.STRING(220), allowNull: true },
    doctor_cedula: { type: DataTypes.STRING(80), allowNull: true },
    firmado_por_id: { type: DataTypes.INTEGER, allowNull: true },
    firmante_nombre: { type: DataTypes.STRING(220), allowNull: true },
    firmante_caracter: { type: DataTypes.ENUM('paciente', 'madre_padre', 'tutor', 'representante_legal'), allowNull: true },
    aceptacion_explicita: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    documento_hash: { type: DataTypes.STRING(64), allowNull: true },
    firma_hash: { type: DataTypes.STRING(64), allowNull: true }
  };
  for (const [name, definition] of Object.entries(consentColumns)) {
    if (!consentTable[name]) await queryInterface.addColumn('consentimientos', name, definition);
  }

  const odontogramaTable = await queryInterface.describeTable('odontograma');
  const odontogramaColumns = {
    tipo_registro: { type: DataTypes.ENUM('hallazgo', 'plan', 'realizado'), allowNull: false, defaultValue: 'hallazgo' },
    fecha_hora: { type: DataTypes.DATE, allowNull: true },
    doctor_nombre: { type: DataTypes.STRING(220), allowNull: true },
    doctor_cedula: { type: DataTypes.STRING(80), allowNull: true },
    firma_hash: { type: DataTypes.STRING(64), allowNull: true },
    registro_previo_hash: { type: DataTypes.STRING(64), allowNull: true },
    firma_version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 }
  };
  for (const [name, definition] of Object.entries(odontogramaColumns)) {
    if (!odontogramaTable[name]) await queryInterface.addColumn('odontograma', name, definition);
  }

  const archivosTable = await queryInterface.describeTable('archivos_historia');
  const archivoColumns = {
    interpretacion: { type: DataTypes.TEXT, allowNull: true },
    interpretado_por_id: { type: DataTypes.INTEGER, allowNull: true },
    interpretado_por_nombre: { type: DataTypes.STRING(220), allowNull: true },
    interpretado_por_cedula: { type: DataTypes.STRING(80), allowNull: true },
    fecha_interpretacion: { type: DataTypes.DATE, allowNull: true },
    interpretacion_hash: { type: DataTypes.STRING(64), allowNull: true }
  };
  for (const [name, definition] of Object.entries(archivoColumns)) {
    if (!archivosTable[name]) await queryInterface.addColumn('archivos_historia', name, definition);
  }

  const userTable = await queryInterface.describeTable('usuarios');
  if (!userTable.token_version) {
    await queryInterface.addColumn('usuarios', 'token_version', { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 });
  }
}

module.exports = ensureComplianceSchema;
