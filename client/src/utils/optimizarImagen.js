const LIMITE_DIMENSION = 3000;
const UMBRAL_OPTIMIZACION = 1024 * 1024;

const cargarImagen = file => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const imagen = new Image();
  imagen.onload = () => { URL.revokeObjectURL(url); resolve(imagen); };
  imagen.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo procesar la imagen.')); };
  imagen.src = url;
});

const crearBlob = (canvas, tipo, calidad) => new Promise(resolve => canvas.toBlob(resolve, tipo, calidad));

export const optimizarImagen = async file => {
  if (!file?.type?.startsWith('image/') || file.size < UMBRAL_OPTIMIZACION) return file;

  const imagen = await cargarImagen(file);
  const escala = Math.min(1, LIMITE_DIMENSION / Math.max(imagen.naturalWidth, imagen.naturalHeight));
  const ancho = Math.max(1, Math.round(imagen.naturalWidth * escala));
  const alto = Math.max(1, Math.round(imagen.naturalHeight * escala));
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext('2d', { alpha: file.type !== 'image/jpeg' });
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(imagen, 0, 0, ancho, alto);

  const tipoSalida = file.type === 'image/png' ? 'image/webp' : file.type;
  const blob = await crearBlob(canvas, tipoSalida, 0.9);
  if (!blob || blob.size >= file.size * 0.9) return file;

  const extension = tipoSalida === 'image/webp' ? 'webp' : tipoSalida === 'image/jpeg' ? 'jpg' : 'png';
  const nombre = file.name.replace(/\.[^.]+$/, '') + `.${extension}`;
  return new File([blob], nombre, { type: tipoSalida, lastModified: file.lastModified });
};

export const optimizarImagenes = async files => {
  const resultado = [];
  // Procesar una por una evita picos de memoria en celulares con varias fotografías grandes.
  for (const file of files) {
    try { resultado.push(await optimizarImagen(file)); } catch { resultado.push(file); }
  }
  return resultado;
};
