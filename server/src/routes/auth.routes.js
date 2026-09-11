const express = require('express');
const jwt = require('jsonwebtoken');
const { Usuario, LogActividad } = require('../models');
const { auth } = require('../middleware/auth');
const { enviarCorreoRecuperacion } = require('../services/email');
const { validarPasswordSegura } = require('../utils/passwordPolicy');
const { limitarSolicitudes } = require('../middleware/rateLimit');
const router = express.Router();


// POST /api/auth/login
router.post('/login', limitarSolicitudes({ maximo: 5 }), async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ where: { email, activo: true } });

    if (!usuario || !(await usuario.validarPassword(password))) {
      await LogActividad.create({ accion: 'login_fallido', entidad: 'sesion', detalle: JSON.stringify({ email: String(email || '').slice(0, 150) }), ip: req.ip }).catch(() => {});
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, v: usuario.token_version },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await LogActividad.create({ usuario_id: usuario.id, accion: 'login', entidad: 'sesion', detalle: JSON.stringify({ resultado: 'exitoso' }), ip: req.ip }).catch(() => {});

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        especialidad: usuario.especialidad
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//reset password
router.post('/forgot-password', limitarSolicitudes({ maximo: 3 }), async (req, res) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({
      where: { email }
    });

    if (!usuario) return res.json({ message: 'Si la cuenta existe, se enviará un correo de recuperación.' });

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const link =
      `${process.env.CLIENT_URL || 'https://clinicadental-almar.vercel.app'}/reset-password/${token}`;

    await enviarCorreoRecuperacion(
      usuario.email,
      link
    );

    res.json({
      message: 'Si la cuenta existe, se enviará un correo de recuperación.'
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: 'Error al enviar correo'
    });
  }
});

//Endo point reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const errorPassword = validarPasswordSegura(password);
    if (errorPassword) return res.status(400).json({ error: errorPassword });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    usuario.password = password;
    usuario.token_version += 1;

    await usuario.save();

    res.json({
      message: 'Contraseña actualizada'
    });

  } catch (error) {
    console.log(error);

    res.status(400).json({
      error: 'Token inválido o expirado'
    });
  }
});
// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.usuario.id,
    nombre: req.usuario.nombre,
    apellido: req.usuario.apellido,
    email: req.usuario.email,
    rol: req.usuario.rol,
    especialidad: req.usuario.especialidad
  });
});

// POST /api/auth/cambiar-password
router.post('/cambiar-password', auth, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const usuario = await Usuario.findByPk(req.usuario.id);

    if (!(await usuario.validarPassword(passwordActual))) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const errorPassword = validarPasswordSegura(passwordNueva);
    if (errorPassword) return res.status(400).json({ error: errorPassword });

    usuario.password = passwordNueva;
    usuario.token_version += 1;
    await usuario.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
