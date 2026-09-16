const crypto = require('crypto');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const proveedorActivo = () => String(process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase();

const configuracionR2 = () => ({
  endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : ''),
  bucket: process.env.R2_BUCKET_NAME,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
});

let clienteR2;
const obtenerClienteR2 = () => {
  const config = configuracionR2();
  if (!config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('El almacenamiento R2 no está configurado completamente.');
  }
  if (!clienteR2) {
    clienteR2 = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    });
  }
  return { cliente: clienteR2, bucket: config.bucket };
};

const almacenamientoConfigurado = () => {
  if (proveedorActivo() === 'r2') {
    const config = configuracionR2();
    return Boolean(config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey);
  }
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

const nombreSeguro = nombre => String(nombre || 'archivo')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9._-]/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 120);

const extensionArchivo = file => {
  const extension = path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '');
  if (extension) return extension;
  const porMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf', 'application/xml': '.xml', 'text/xml': '.xml' };
  return porMime[file.mimetype] || '';
};

const subirCloudinary = (file, { carpeta, resourceType = 'auto' }) => new Promise((resolve, reject) => {
  const opciones = {
    folder: carpeta,
    resource_type: resourceType,
    type: 'authenticated',
    use_filename: true,
    unique_filename: true
  };
  if (resourceType === 'raw') {
    const extension = extensionArchivo(file);
    const base = nombreSeguro(path.basename(file.originalname || 'archivo', path.extname(file.originalname || '')));
    opciones.public_id = `${base}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`;
    opciones.overwrite = false;
    delete opciones.use_filename;
    delete opciones.unique_filename;
  }
  const stream = cloudinary.uploader.upload_stream(opciones, (error, resultado) => error ? reject(error) : resolve({
    secure_url: resultado.secure_url,
    public_id: resultado.public_id,
    resource_type: resultado.resource_type,
    format: resultado.format || null,
    type: resultado.type || 'authenticated'
  }));
  stream.end(file.buffer);
});

const subirR2 = async (file, { carpeta }) => {
  const { cliente, bucket } = obtenerClienteR2();
  const base = nombreSeguro(path.basename(file.originalname || 'archivo', path.extname(file.originalname || '')));
  const key = `${carpeta}/${Date.now()}-${crypto.randomUUID()}-${base}${extensionArchivo(file)}`;
  await cliente.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: { 'nombre-original': Buffer.from(file.originalname || 'archivo').toString('base64').slice(0, 2000) }
  }));
  return {
    secure_url: `r2://${bucket}/${key}`,
    public_id: key,
    resource_type: 'raw',
    format: extensionArchivo(file).replace('.', '') || null,
    type: 'r2'
  };
};

const subirPrivado = (file, opciones) => proveedorActivo() === 'r2'
  ? subirR2(file, opciones)
  : subirCloudinary(file, opciones);

const urlPrivadaTemporal = async (archivo, expiresIn = 600) => {
  if (!archivo?.public_id) return null;
  if (archivo.delivery_type === 'r2') {
    const { cliente, bucket } = obtenerClienteR2();
    return getSignedUrl(cliente, new GetObjectCommand({ Bucket: bucket, Key: archivo.public_id }), { expiresIn });
  }
  return cloudinary.utils.private_download_url(archivo.public_id, archivo.formato || undefined, {
    resource_type: archivo.resource_type,
    type: archivo.delivery_type || 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    attachment: false
  });
};

const eliminarPrivado = async archivo => {
  if (!archivo?.public_id) return;
  if (archivo.delivery_type === 'r2' || archivo.type === 'r2') {
    const { cliente, bucket } = obtenerClienteR2();
    await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: archivo.public_id }));
    return;
  }
  await cloudinary.uploader.destroy(archivo.public_id, {
    resource_type: archivo.resource_type || 'image',
    type: archivo.delivery_type || archivo.type || 'authenticated'
  });
};

module.exports = { almacenamientoConfigurado, subirPrivado, urlPrivadaTemporal, eliminarPrivado, proveedorActivo };
