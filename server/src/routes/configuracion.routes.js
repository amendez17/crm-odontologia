const express = require('express');
const { Configuracion } = require('../models');
const { auth, esAdmin } = require('../middleware/auth');
const router = express.Router();

const CLAVES_VALIDAS = [
  'clinica_nombre',
  'clinica_direccion',
  'clinica_telefono',
  'clinica_email',
  'clinica_horario_inicio',
  'clinica_horario_fin',
  'clinica_dias_laborales',
  'clinica_cuit',
  'clinica_responsable',
  'moneda_simbolo',
  'duracion_turno_default'
];

// GET /api/configuracion
router.get('/', auth, async (req, res) => {
  try {
    const configs = await Configuracion.findAll();
    const resultado = {};
    configs.forEach(c => { resultado[c.clave] = c.valor; });

    // Valores por defecto
    CLAVES_VALIDAS.forEach(clave => {
      if (!resultado[clave]) {
        const defaults = {
          clinica_nombre: 'Mi Clínica Dental',
          clinica_direccion: '',
          clinica_telefono: '',
          clinica_email: '',
          clinica_horario_inicio: '08:00',
          clinica_horario_fin: '18:00',
          clinica_dias_laborales: 'Lunes a Viernes',
          clinica_cuit: '',
          clinica_responsable: '',
          moneda_simbolo: '$',
          duracion_turno_default: '30'
        };
        resultado[clave] = defaults[clave] || '';
      }
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/configuracion
router.put('/', auth, esAdmin, async (req, res) => {
  try {
    const datos = req.body;
    for (const [clave, valor] of Object.entries(datos)) {
      if (!CLAVES_VALIDAS.includes(clave)) continue;
      await Configuracion.upsert({ clave, valor: valor || '' });
    }
    res.json({ message: 'Configuración actualizada.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
