const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Token inválido o usuario inactivo.' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso solo para administradores.' });
  }
  next();
};

const esDoctor = (req, res, next) => {
  if (req.usuario.rol !== 'doctor' && req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso solo para doctores.' });
  }
  next();
};

module.exports = { auth, esAdmin, esDoctor };
