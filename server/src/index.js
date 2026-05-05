const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, Usuario } = require('./models');

const app = express();

// =======================
// MIDDLEWARES
// =======================
app.use(cors({ origin: "*" }));
app.use(express.json());

// =======================
// RUTAS
// =======================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/pacientes', require('./routes/pacientes.routes'));
app.use('/api/citas', require('./routes/citas.routes'));
app.use('/api/tratamientos', require('./routes/tratamientos.routes'));
app.use('/api/presupuestos', require('./routes/presupuestos.routes'));
app.use('/api/odontograma', require('./routes/odontograma.routes'));
app.use('/api/pagos', require('./routes/pagos.routes'));
app.use('/api/historia', require('./routes/historia.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));
app.use('/api/configuracion', require('./routes/configuracion.routes'));
app.use('/api/exportar', require('./routes/exportar.routes'));
app.use('/api/consentimiento', require('./routes/consentimiento.routes'));
app.use('/api/actividad', require('./routes/actividad.routes'));
app.use('/api/mantenimiento', require('./routes/mantenimiento.routes'));

// =======================
// HEALTH CHECK
// =======================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// =======================
// PUERTO
// =======================
const PORT = process.env.PORT || 4000;

// =======================
// INICIO DEL SERVIDOR
// =======================
async function iniciar() {
  try {

    console.log('🚀 Iniciando servidor...');

    // =======================
    // LOG VARIABLES (DEBUG)
    // =======================
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "OK" : "MISSING");
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "OK" : "MISSING");

    // =======================
    // CONEXIÓN A BD
    // =======================
    await sequelize.authenticate();
    console.log('✅ DB conectada');

    await sequelize.sync();
    console.log('📦 Tablas sincronizadas');

    // =======================
    // CREAR ADMIN SI NO EXISTE
    // =======================
    const adminExiste = await Usuario.findOne({
      where: { email: 'admin@clinica.com' }
    });

    if (!adminExiste) {
      await Usuario.create({
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@clinica.com',
        password: 'admin123',
        rol: 'administrador'
      });

      console.log('👤 Usuario admin creado');
    }

    // =======================
    // LEVANTAR SERVIDOR
    // =======================
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL INICIAR SERVIDOR:');
    console.error(error);

    // IMPORTANTE para Render
    process.exit(1);
  }
}

iniciar();
