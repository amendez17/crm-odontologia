const express = require('express');
const { Paciente, Cita, Presupuesto, Pago, Odontograma, HistoriaClinica, Usuario, Receta } = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');
const { Op } = require('sequelize');
const router = express.Router();



function toCSV(headers, rows) {
  const escape = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];

  rows.forEach(row => {
    lines.push(row.map(escape).join(','));
  });

  return '\ufeff' + lines.join('\r\n');
}
// GET /api/pacientes
router.get('/', auth, async (req, res) => {
  try {
    const { buscar, page = 1, limit = 20 } = req.query;
    const where = { activo: true };

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { dni: { [Op.like]: `%${buscar}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Paciente.findAndCountAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      pacientes: rows,
      total: count,
      pagina: parseInt(page),
      totalPaginas: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pacientes/exportar
router.get('/exportar', auth, async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { activo: true },
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    const headers = [
      'Apellido', 'Nombre', 'DNI', 'Teléfono', 'Email',
      'Dirección', 'Obra Social', 'N° Afiliado',
      'Fecha Nacimiento', 'Género'
    ];

    const rows = pacientes.map(p => [
      p.apellido,
      p.nombre,
      p.dni,
      p.telefono,
      p.email,
      p.direccion,
      p.obra_social,
      p.numero_afiliado,
      p.fecha_nacimiento,
      p.genero
    ]);

    const csv = toCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=pacientes.csv');
    res.send(csv);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pacientes/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id, {
      include: [
        { model: Cita, as: 'citas', include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }], limit: 10, order: [['fecha', 'DESC']] },
        { model: Presupuesto, as: 'presupuestos', include: [{ model: Usuario, as: 'doctor', attributes: ['id', 'nombre', 'apellido'] }] },
        { model: Pago, as: 'pagos', order: [['fecha', 'DESC']] }
      ]
    });
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pacientes
router.post('/', auth, registrarActividad('crear', 'paciente'), async (req, res) => {
  try {
    const paciente = await Paciente.create(req.body);
    res.status(201).json(paciente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/pacientes/:id
router.put('/:id', auth, registrarActividad('actualizar', 'paciente'), async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    await paciente.update(req.body);
    res.json(paciente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Update /api/pacientes/id:/receta
router.put('/:id', auth, async (req, res) => {
  try {
    const receta = await Receta.findByPk(req.params.id);

    if (!receta) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    // 🔐 SEGURIDAD: solo el creador puede editar
    if (receta.usuarioId !== req.usuario.id &&  req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        error: 'No tienes permiso para editar esta receta'
      });
    }

    await receta.update({
      diagnostico: req.body.diagnostico,
      medicamentos: req.body.medicamentos,
      indicaciones: req.body.indicaciones
    });

    res.json(receta);

  } catch (error) {
    res.status(500).json({ error: 'No tienes permisos para editar esta receta' });
  }
});

//DELETE /api/paciente/:id receta
router.delete('/recetas/:id', auth, async (req, res) => {
  try {
    const receta = await Receta.findByPk(req.params.id);

    if (!receta) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    // 🔐 seguridad (solo creador o admin)
    if (
      receta.usuarioId !== req.usuario.id &&
      req.usuario.rol !== 'administrador'
    ) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    await receta.destroy();

    res.json({ message: 'Receta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pacientes/:id/recetas
router.post('/pacientes/:id/recetas', auth, async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.usuario);
    console.log("PACIENTE:", req.params.id);

    const receta = await Receta.create({
      ...req.body,
      pacienteId: req.params.id,
      usuarioId: req.usuario.id
    });

    res.status(201).json(receta);
  } catch (error) {
    console.error("ERROR CREANDO RECETA:", error);
    res.status(500).json({ error: error.message });
  }
});
// GET /api/pacientes/:id/recetas
router.get('/:id/recetas', auth, async (req, res) => {

  try {

    const recetas = await Receta.findAll({

      where: {
        pacienteId: req.params.id
      },

      include: [{
        model: Usuario,
        as: 'doctor',
        attributes: ['nombre', 'apellido']
      }],

      order: [['id', 'DESC']]
    });

    res.json(recetas);

  } catch (error) {

    console.error('ERROR OBTENER RECETAS:', error);

    res.status(500).json({
      error: error.message
    });
  }
});

// DELETE /api/pacientes/:id (soft delete)
router.delete('/:id', auth, registrarActividad('eliminar', 'paciente'), async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
    await paciente.update({ activo: false });
    res.json({ message: 'Paciente desactivado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
