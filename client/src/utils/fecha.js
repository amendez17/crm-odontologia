const timezone = 'America/Mazatlan';

/**
 * YYYY-MM-DD
 * Ideal para inputs date y filtros
 */
export const fechaHoy = (
  fecha = new Date()
) => {

  const date = new Date(fecha);

  const year = date.toLocaleString(
    'en-US',
    {
      timeZone: timezone,
      year: 'numeric'
    }
  );

  const month = date.toLocaleString(
    'en-US',
    {
      timeZone: timezone,
      month: '2-digit'
    }
  );

  const day = date.toLocaleString(
    'en-US',
    {
      timeZone: timezone,
      day: '2-digit'
    }
  );

  return `${year}-${month}-${day}`;
};

/**
 * 11/05/2026
 */
export const formatearFecha = (
  fecha
) => {

  if (!fecha) return '';

  const fechaSegura =
    typeof fecha === 'string' &&
    fecha.length === 10
      ? `${fecha}T12:00:00`
      : fecha;

  return new Date(fechaSegura)
    .toLocaleDateString(
      'es-MX',
      {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    );
};
/**
 * 11/05/2026 08:30 PM
 */
export const formatearFechaHora = (
  fecha
) => {

  if (!fecha) return '';

  return new Date(fecha)
    .toLocaleString(
      'es-MX',
      {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
};

/**
 * 08:30 PM
 */
export const formatearHora = (
  fecha
) => {

  if (!fecha) return '';

  return new Date(fecha)
    .toLocaleTimeString(
      'es-MX',
      {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit'
      }
    );
};

/**
 * lunes, 11 de mayo de 2026
 */
export const fechaLarga = (
  fecha
) => {

  if (!fecha) return '';

  return new Date(fecha)
    .toLocaleDateString(
      'es-MX',
      {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
};

/**
 * Saber si una fecha es hoy
 */
export const esHoy = (
  fecha
) => {

  return (
    fechaHoy(fecha) === fechaHoy()
  );
};

/**
 * Diferencia de días
 */
export const diasEntre = (
  fecha1,
  fecha2
) => {

  const f1 = new Date(fecha1);
  const f2 = new Date(fecha2);

  const diferencia =
    f2.getTime() - f1.getTime();

  return Math.ceil(
    diferencia / (
      1000 * 60 * 60 * 24
    )
  );
};

/**
 * Zona horaria usada
 */
export const obtenerZonaHoraria = () => {
  return timezone;
};
