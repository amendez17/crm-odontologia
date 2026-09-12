# Respaldos verificables

Este flujo crea una copia de la base MySQL y de los archivos clínicos almacenados en Cloudinary, la cifra antes de enviarla a un depósito privado compatible con S3 y prueba la restauración en una base MySQL efímera. No escribe respaldos ni datos clínicos en el repositorio o en artefactos de GitHub.

## Frecuencia e historial

El workflow `Respaldo verificable` se ejecuta cada domingo a las 12:30 UTC y también admite ejecución manual. Cada ejecución conserva dos objetos privados:

- `backup-<fecha>.tar.gz.enc`: respaldo cifrado autenticado con AES-256-GCM.
- `backup-<fecha>.verification.json`: fecha, tamaño, SHA-256, cantidad de tablas y archivos y resultado de la prueba de restauración.

El historial se consulta en **GitHub > Actions > Respaldo verificable** y en el prefijo `crm-odontologia/YYYY-MM/` del depósito privado. La política de retención debe configurarse en el propio proveedor de almacenamiento; se recomienda conservar copias semanales y bloquear el acceso público.

## Configuración única

Crear un depósito privado en AWS S3, Cloudflare R2, Backblaze B2 u otro servicio compatible con S3. Utilizar credenciales exclusivas con permisos mínimos para leer, escribir y listar únicamente ese depósito.

En **GitHub > Settings > Secrets and variables > Actions**, agregar estos secretos del repositorio:

| Secreto | Contenido |
|---|---|
| `BACKUP_DATABASE_URL` | URL pública de Railway MySQL, con usuario, contraseña, host, puerto y base. |
| `BACKUP_ENCRYPTION_KEY` | Frase aleatoria de 32 caracteres o más, guardada también fuera de GitHub. Sin ella no se puede restaurar. |
| `BACKUP_S3_ENDPOINT` | Endpoint HTTPS del proveedor. En AWS S3 puede dejarse vacío. |
| `BACKUP_S3_REGION` | Región del depósito; para R2 normalmente `auto`. |
| `BACKUP_S3_BUCKET` | Nombre del depósito privado. |
| `BACKUP_S3_ACCESS_KEY_ID` | Identificador de la credencial limitada al depósito. |
| `BACKUP_S3_SECRET_ACCESS_KEY` | Secreto de la credencial limitada al depósito. |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de la cuenta actual. |
| `CLOUDINARY_API_KEY` | API key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary. |

Variables opcionales (no secretas):

| Variable | Uso |
|---|---|
| `BACKUP_S3_FORCE_PATH_STYLE` | Usar `true` solo si el proveedor exige URLs path-style. |
| `BACKUP_S3_SERVER_SIDE_ENCRYPTION` | En AWS S3 puede usarse `AES256`; el archivo ya viaja cifrado por la aplicación. |

## Primera prueba

1. Abrir **Actions > Respaldo verificable > Run workflow**.
2. Seleccionar la rama `feature/historia-adjuntos` y ejecutar.
3. Confirmar que termina en verde y que el último mensaje indica `Respaldo verificado correctamente`.
4. Confirmar en el depósito que existen el archivo `.enc` y el reporte `.verification.json`.
5. Guardar una segunda copia de `BACKUP_ENCRYPTION_KEY` en el gestor de contraseñas de la clínica. Nunca enviarla por correo o mensajería.

## Qué valida la prueba

La tarea vuelve a descargar el objeto que fue almacenado, compara su SHA-256, verifica el cifrado AES-GCM, lo descomprime, restaura el SQL en un MySQL temporal y compara el número de filas de todas las tablas. La base temporal desaparece al terminar el workflow y nunca se conecta a producción para escribir.

## Recuperación real

Una recuperación real debe hacerse primero en un entorno aislado. Descargue el respaldo y conserve su reporte, use la clave de cifrado para abrirlo y restaure `database.sql`; después recargue los archivos en Cloudinary usando `manifest.json` para relacionar cada archivo con su `public_id`. Documente fecha, responsable, respaldo elegido y resultado de la validación antes de cambiar el entorno productivo.

La existencia de respaldos no sustituye controles de acceso, capacitación, bitácoras ni una política formal de conservación. La clínica debe definir retención y eliminación conforme a sus obligaciones aplicables.
