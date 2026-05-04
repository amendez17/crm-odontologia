const express = require('express');
const { Tratamiento, CategoriaTratamiento } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/tratamientos
router.get('/', auth, async (req, res) => {
  try {
    const tratamientos = await Tratamiento.findAll({
      where: { activo: true },
      include: [{ model: CategoriaTratamiento, as: 'categoria' }],
      order: [['nombre', 'ASC']]
    });
    res.json(tratamientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tratamientos/categorias
router.get('/categorias', auth, async (req, res) => {
  try {
    const categorias = await CategoriaTratamiento.findAll({
      include: [{ model: Tratamiento, as: 'tratamientos', where: { activo: true }, required: false }],
      order: [['nombre', 'ASC']]
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tratamientos/categorias
router.post('/categorias', auth, esAdmin, async (req, res) => {
  try {
    const categoria = await CategoriaTratamiento.create(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/tratamientos
router.post('/', auth, esAdmin, async (req, res) => {
  try {
    const tratamiento = await Tratamiento.create(req.body);
    res.status(201).json(tratamiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/tratamientos/:id
router.put('/:id', auth, esAdmin, async (req, res) => {
  try {
    const tratamiento = await Tratamiento.findByPk(req.params.id);
    if (!tratamiento) return res.status(404).json({ error: 'Tratamiento no encontrado.' });
    await tratamiento.update(req.body);
    res.json(tratamiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/tratamientos/:id
router.delete('/:id', auth, esAdmin, async (req, res) => {
  try {
    const tratamiento = await Tratamiento.findByPk(req.params.id);
    if (!tratamiento) return res.status(404).json({ error: 'Tratamiento no encontrado.' });
    await tratamiento.update({ activo: false });
    res.json({ message: 'Tratamiento desactivado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
