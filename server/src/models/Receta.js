module.exports = (sequelize, DataTypes) => {
  const Receta = sequelize.define('Receta', {
    diagnostico: DataTypes.TEXT,
    medicamentos: DataTypes.TEXT,
    indicaciones: DataTypes.TEXT,
    folio: DataTypes.STRING,
    pacienteId: DataTypes.INTEGER,
    usuarioId: DataTypes.INTEGER
  });

  return Receta;
};
