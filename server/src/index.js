const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();


const { sequelize, Usuario } = require('./models');
const ensureComplianceSchema = require('./migrations/ensureComplianceSchema');
const { validarPasswordSegura } = require('./utils/passwordPolicy');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const origenesPermitidos = [
  'http://localhost:5173',
  'https://clinicadental-almar.vercel.app',
  ...(process.env.CLIENT_URLS || '').split(',').map(url => url.trim()).filter(Boolean)
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || origenesPermitidos.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  exposedHeaders: ['Content-Disposition', 'X-Backup-SHA256'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions,

  transports: ['websocket'],

  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});
app.set('io', io);
// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', req.path.startsWith('/api/') ? 'no-store' : 'no-cache');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/pacientes', require('./routes/pacientes.routes'));
app.use('/api/citas', require('./routes/citas.routes'));
app.use('/api/tratamientos', require('./routes/tratamientos.routes'));
app.use('/api/presupuestos', require('./routes/presupuestos.routes'));
app.use('/api/odontograma', require('./routes/odontograma.routes'));
app.use('/api/periodontograma', require('./routes/periodontograma.routes'));
app.use('/api/pagos', require('./routes/pagos.routes'));
app.use('/api/historia', require('./routes/historia.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));
app.use('/api/configuracion', require('./routes/configuracion.routes'));
app.use('/api/exportar', require('./routes/exportar.routes'));
app.use('/api/consentimiento', require('./routes/consentimiento.routes'));
app.use('/api/actividad', require('./routes/actividad.routes'));
app.use('/api/notificaciones', require('./routes/notificaciones.routes'));
app.use('/api/mantenimiento', require('./routes/mantenimiento.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe estar configurado con al menos 32 caracteres.');
    }
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida.');

    await sequelize.sync();
    await ensureComplianceSchema(sequelize);
    console.log('Tablas sincronizadas.');

    // Alta inicial opcional, únicamente mediante variables seguras y sin credenciales conocidas.
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (adminEmail && adminPassword && !validarPasswordSegura(adminPassword)) {
      const adminExiste = await Usuario.findOne({ where: { email: adminEmail } });
      if (!adminExiste) {
      await Usuario.create({
        nombre: process.env.ADMIN_INITIAL_NAME || 'Administrador',
        apellido: process.env.ADMIN_INITIAL_LASTNAME || 'Sistema',
        email: adminEmail,
        password: adminPassword,
        rol: 'administrador'
      });
        console.log('Usuario administrador inicial creado.');
      }
    }

    server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
}

iniciar();
