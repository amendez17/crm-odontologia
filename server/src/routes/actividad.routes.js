const express = require('express');
const { LogActividad, Usuario } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/actividad
router.get('/', auth, esAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, entidad, accion, desde, hasta } = req.query;
    const where = {};
    if (entidad) where.entidad = entidad;
    if (accion) where.accion = accion;
    if (desde && hasta) {
      where.createdAt = { [Op.between]: [new Date(desde), new Date(hasta + 'T23:59:59')] };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await LogActividad.findAndCountAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'rol'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs: rows,
      total: count,
      pagina: parseInt(page),
      totalPaginas: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
