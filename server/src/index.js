const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, Usuario } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida.');

    await sequelize.sync();
    console.log('Tablas sincronizadas.');

    // Crear usuario admin por defecto si no existe
    const adminExiste = await Usuario.findOne({ where: { email: 'admin@clinica.com' } });
    if (!adminExiste) {
      await Usuario.create({
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@clinica.com',
        password: 'admin123',
        rol: 'administrador'
      });
      console.log('Usuario admin creado: admin@clinica.com / admin123');
    }

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
}

iniciar();
