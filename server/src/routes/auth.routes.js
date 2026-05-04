const express = require('express');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ where: { email, activo: true } });

    if (!usuario || !(await usuario.validarPassword(password))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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

    if (!passwordNueva || passwordNueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    usuario.password = passwordNueva;
    await usuario.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
