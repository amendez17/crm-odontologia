const express = require('express');
const { Usuario } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/usuarios
router.get('/', auth, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password'] },
      order: [['nombre', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/usuarios/doctores
router.get('/doctores', auth, async (req, res) => {
  try {
    const doctores = await Usuario.findAll({
      where: { rol: 'doctor', activo: true },
      attributes: { exclude: ['password'] },
      order: [['nombre', 'ASC']]
    });
    res.json(doctores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/usuarios/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/usuarios
router.post('/', auth, esAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.create(req.body);
    const { password, ...data } = usuario.toJSON();
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', auth, esAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { password, ...updateData } = req.body;
    await usuario.update(updateData);
    const { password: _, ...data } = usuario.toJSON();
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/usuarios/:id (soft delete)
router.delete('/:id', auth, esAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await usuario.update({ activo: false });
    res.json({ message: 'Usuario desactivado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
