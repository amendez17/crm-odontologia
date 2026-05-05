const express = require('express');
const { Odontograma, Paciente, Usuario } = require('../models');
const { auth, esDoctor } = require('../middleware/auth');
const router = express.Router();

// GET /api/odontograma/:pacienteId
router.get('/:pacienteId', auth, async (req, res) => {
  try {
    const registros = await Odontograma.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['fecha', 'DESC'], ['pieza_dental', 'ASC']]
    });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/odontograma (upsert por paciente_id + pieza_dental + cara)
router.post('/', auth, esDoctor, async (req, res) => {
  try {
    const { paciente_id, pieza_dental, cara, estado, observacion, fecha } = req.body;

    if (!paciente_id || !pieza_dental) {
      return res.status(400).json({ error: 'paciente_id y pieza_dental son requeridos.' });
    }

    const caraVal = cara || 'completa';
    const fechaVal = fecha || new Date().toISOString().split('T')[0];

    const [registro, created] = await Odontograma.findOrCreate({
      where: { paciente_id, pieza_dental, cara: caraVal },
      defaults: { estado, observacion, fecha: fechaVal, doctor_id: req.usuario.id }
    });

    if (!created) {
      await registro.update({ estado, observacion, fecha: fechaVal, doctor_id: req.usuario.id });
    }

    res.status(created ? 201 : 200).json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/odontograma/:id
router.put('/:id', auth, esDoctor, async (req, res) => {
  try {
    const registro = await Odontograma.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado.' });
    const { estado, observacion, fecha, cara } = req.body;
    await registro.update({
      ...(estado !== undefined && { estado }),
      ...(observacion !== undefined && { observacion }),
      ...(fecha !== undefined && { fecha }),
      ...(cara !== undefined && { cara }),
      doctor_id: req.usuario.id
    });
    res.json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/odontograma/:id
router.delete('/:id', auth, esDoctor, async (req, res) => {
  try {
    const registro = await Odontograma.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado.' });
    await registro.destroy();
    res.json({ message: 'Registro eliminado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
