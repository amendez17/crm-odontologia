const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Fecha actual local
 * Resultado:
 * 2026-05-11
 */
export const fechaHoy = () => {

  const now = new Date();

  const year = now.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric'
  });

  const month = now.toLocaleString('en-US', {
    timeZone: timezone,
    month: '2-digit'
  });

  const day = now.toLocaleString('en-US', {
    timeZone: timezone,
    day: '2-digit'
  });

  return `${year}-${month}-${day}`;
};

/**
 * Formato corto:
 * 11/05/2026
 */
export const formatearFecha = (fecha) => {

  if (!fecha) return '';

  return new Date(fecha).toLocaleDateString('es-MX', {
    timeZone: timezone
  });
};

/**
 * Fecha y hora:
 * 11/05/2026, 8:30 PM
 */
export const formatearFechaHora = (fecha) => {

  if (!fecha) return '';

  return new Date(fecha).toLocaleString('es-MX', {
    timeZone: timezone
  });
};

/**
 * Hora sola
 */
export const formatearHora = (fecha) => {

  if (!fecha) return '';

  return new Date(fecha).toLocaleTimeString('es-MX', {
    timeZone: timezone
  });
};

/**
 * Nombre de zona horaria
 */
export const obtenerZonaHoraria = () => {
  return timezone;
};