const intentos = new Map();

function limitarSolicitudes({ ventanaMs = 15 * 60 * 1000, maximo = 5 } = {}) {
  return (req, res, next) => {
    const ahora = Date.now();
    const clave = `${req.ip}:${req.path}`;
    const registro = intentos.get(clave);
    if (!registro || ahora >= registro.reinicia) {
      intentos.set(clave, { total: 1, reinicia: ahora + ventanaMs });
      return next();
    }
    registro.total += 1;
    if (registro.total > maximo) {
      res.setHeader('Retry-After', Math.ceil((registro.reinicia - ahora) / 1000));
      return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' });
    }
    next();
  };
}

module.exports = { limitarSolicitudes };
