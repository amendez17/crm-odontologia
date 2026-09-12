const { LogActividad } = require('../models');

function registrarActividad(accion, entidad, opciones = {}) {
  return async (req, res, next) => {
    let respuesta = null;
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      respuesta = data;
      return originalJson(data);
    };

    res.once('finish', () => {
      const entidadId = opciones.entidadId
        ? opciones.entidadId(req, respuesta)
        : respuesta?.id || req.params?.id || null;
      const contexto = opciones.contexto ? opciones.contexto(req, respuesta) : {};
      LogActividad.create({
        usuario_id: req.usuario?.id || null,
        accion,
        entidad,
        entidad_id: entidadId || null,
        detalle: JSON.stringify({
          metodo: req.method,
          ruta: req.originalUrl.split('?')[0],
          resultado: res.statusCode < 400 ? 'exitoso' : 'rechazado',
          codigo_http: res.statusCode,
          agente: req.get('user-agent')?.slice(0, 250) || null,
          ...contexto
        }),
        ip: req.ip
      }).catch(error => console.error('No se pudo registrar actividad:', error.message));
    });
    next();
  };
}

module.exports = { registrarActividad };
