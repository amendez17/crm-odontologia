const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: DataTypes.STRING(100),
  apellido: DataTypes.STRING(100),
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: DataTypes.STRING(255),
  rol: {
    type: DataTypes.ENUM('administrador', 'doctor', 'recepcionista'),
    defaultValue: 'recepcionista'
  },
  especialidad: DataTypes.STRING(100),
  telefono: DataTypes.STRING(20),
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    }
  }
});

Usuario.prototype.validarPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
