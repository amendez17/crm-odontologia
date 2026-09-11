const express = require('express');
const { QueryTypes } = require('sequelize');
const { Pago, Paciente, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { registrarActividad } = require('../middleware/logger');

const router = express.Router();

const fechaMazatlan = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mazatlan' }).format(new Date());

router.get('/', auth, async (_req, res) => {
  try {
    const hoy = fechaMazatlan();
    const limite = new Date(`${hoy}T12:00:00Z`);
    limite.setUTCMonth(limite.getUTCMonth() - 4);
    const fechaLimite = limite.toISOString().slice(0, 10);

    const [facturas, limpiezas] = await Promise.all([
      Pago.findAll({
        where: { requiere_factura: true, factura_emitida: false },
        include: [{ model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'telefono'] }],
        order: [['fecha', 'ASC'], ['id', 'ASC']],
        limit: 100
      }),
      sequelize.query(`
        SELECT p.id, p.nombre, p.apellido, p.telefono, MAX(c.fecha) AS ultima_visita
        FROM pacientes p
        INNER JOIN citas c ON c.paciente_id = p.id AND c.estado = 'completada'
        WHERE p.activo = 1
        GROUP BY p.id, p.nombre, p.apellido, p.telefono
        HAVING MAX(c.fecha) <= :fechaLimite
          AND NOT EXISTS (
            SELECT 1 FROM citas futuras
            WHERE futuras.paciente_id = p.id
              AND futuras.fecha >= :hoy
              AND futuras.estado IN ('programada', 'confirmada', 'en_curso')
          )
        ORDER BY ultima_visita ASC
        LIMIT 100
      `, { replacements: { fechaLimite, hoy }, type: QueryTypes.SELECT })
    ]);

    res.json({ facturas, limpiezas, fecha_limite: fechaLimite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/facturas/:pagoId/emitida', auth, registrarActividad('marcar_factura_emitida', 'pago', {
  entidadId: req => req.params.pagoId
}), async (req, res) => {
  try {
    const pago = await Pago.findByPk(req.params.pagoId);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });
    if (!pago.requiere_factura) return res.status(409).json({ error: 'Este pago no tiene una factura solicitada.' });
    await pago.update({ factura_emitida: true, fecha_factura: new Date() });
    res.json({ mensaje: 'Factura marcada como emitida.', id: pago.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
