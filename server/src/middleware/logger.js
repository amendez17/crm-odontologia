const { LogActividad } = require('../models');

function registrarActividad(accion, entidad) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode < 400) {
        LogActividad.create({
          usuario_id: req.usuario?.id || null,
          accion,
          entidad,
          entidad_id: data?.id || req.params?.id || null,
          detalle: `${req.method} ${req.originalUrl}`,
          ip: req.ip
        }).catch(() => {});
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = { registrarActividad };
