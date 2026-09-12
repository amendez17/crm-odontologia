# Respaldos verificables en Google Drive

Este flujo crea una copia de la base MySQL y de los archivos clínicos almacenados en Cloudinary, la cifra antes de enviarla a una carpeta privada de Google Drive y prueba la restauración en una base MySQL efímera. No escribe respaldos ni datos clínicos en el repositorio o en artefactos de GitHub.

## Frecuencia e historial

El workflow `Respaldo verificable` se ejecuta cada domingo a las 12:30 UTC y también admite ejecución manual. Cada ejecución conserva dos archivos privados en la carpeta `Respaldos CRM Odontología`:

- `backup-<fecha>.tar.gz.enc`: respaldo cifrado autenticado con AES-256-GCM.
- `backup-<fecha>.verification.json`: fecha, tamaño, SHA-256, cantidad de tablas y archivos y resultado de la prueba de restauración.

El historial se consulta en **GitHub > Actions > Respaldo verificable** y en la carpeta privada de Drive. Los archivos se crean con el alcance limitado `drive.file`, que no concede acceso general a los demás documentos de la cuenta.

## Configuración única para Gmail personal

### 1. Crear la aplicación de Google

1. Abra [Google Cloud Console](https://console.cloud.google.com/) y cree un proyecto llamado `Respaldos CRM Odontología`.
2. En **APIs y servicios > Biblioteca**, habilite **Google Drive API**.
3. En **Google Auth Platform**, configure la pantalla de consentimiento como **External** y agregue únicamente su cuenta de Gmail como usuario de prueba.
4. Cree un cliente OAuth 2.0 de tipo **Web application**.
5. Agregue como URI de redirección autorizada `https://developers.google.com/oauthplayground`.
6. Copie el Client ID y Client Secret. No los agregue al repositorio ni los comparta por chat.

### 2. Obtener el refresh token

1. Abra [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Abra el engrane, active **Use your own OAuth credentials** y pegue temporalmente el Client ID y Client Secret.
3. En **Step 1**, escriba el alcance `https://www.googleapis.com/auth/drive.file` y pulse **Authorize APIs**.
4. Inicie sesión con la cuenta personal de Gmail que conservará los respaldos y acepte el permiso.
5. En **Step 2**, pulse **Exchange authorization code for tokens** y copie el `refresh_token`.
6. Retire el Client Secret del formulario del Playground al terminar.

Para evitar que un token de una aplicación en modo de prueba expire, complete la publicación de la aplicación en Google Auth Platform antes de depender del calendario automático. El alcance `drive.file` es de acceso limitado a archivos creados por la aplicación.

### 3. Crear secretos en GitHub

En **GitHub > Settings > Secrets and variables > Actions**, agregue estos secretos del repositorio:

| Secreto | Contenido |
|---|---|
| `BACKUP_DATABASE_URL` | URL pública de Railway MySQL, con usuario, contraseña, host, puerto y base. |
| `BACKUP_ENCRYPTION_KEY` | Frase aleatoria de 32 caracteres o más, guardada también fuera de GitHub. Sin ella no se puede restaurar. |
| `GOOGLE_DRIVE_CLIENT_ID` | Client ID del cliente OAuth creado. |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Client Secret del cliente OAuth. |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Refresh token generado con el alcance `drive.file`. |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de la cuenta actual. |
| `CLOUDINARY_API_KEY` | API key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary. |

## Primera prueba

1. Abra **Actions > Respaldo verificable > Run workflow**.
2. Seleccione la rama `feature/historia-adjuntos` y ejecute.
3. Confirme que termina en verde y muestra `Respaldo verificado correctamente en Google Drive`.
4. Confirme que Drive creó la carpeta `Respaldos CRM Odontología` con un archivo `.enc` y un reporte `.verification.json`.
5. Guarde una segunda copia de `BACKUP_ENCRYPTION_KEY` en el gestor de contraseñas de la clínica. Nunca la envíe por correo o mensajería.

## Qué valida la prueba

La tarea vuelve a descargar desde Drive el archivo almacenado, compara su SHA-256, verifica el cifrado AES-GCM, valida el SQL y cada imagen/PDF contra el manifiesto, restaura el SQL en un MySQL temporal y compara el número de filas de todas las tablas. La base temporal desaparece al terminar y nunca escribe en producción.

## Recuperación real

Una recuperación real debe hacerse primero en un entorno aislado. Descargue el respaldo y conserve su reporte, use la clave de cifrado para abrirlo y restaure `database.sql`; después recargue los archivos en Cloudinary usando `manifest.json` para relacionar cada archivo con su `public_id`. Documente fecha, responsable, respaldo elegido y resultado antes de cambiar el entorno productivo.

La existencia de respaldos no sustituye controles de acceso, capacitación, bitácoras ni una política formal de conservación. La clínica debe definir retención y eliminación conforme a sus obligaciones aplicables y vigilar el espacio disponible de la cuenta de Drive.
