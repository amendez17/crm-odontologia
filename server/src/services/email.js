const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const enviarCorreoRecuperacion = async (to, link) => {
  await resend.emails.send({
    from: 'CRM Dental <onboarding@resend.dev>',
    to,
    subject: 'Recuperar contraseña',
    html: `
      <h2>Recuperación de contraseña</h2>

      <p>Haz click en el siguiente enlace:</p>

      <a href="${link}">
        Recuperar contraseña
      </a>

      <p>Si no solicitaste esto ignora el correo.</p>
    `
  });
};

module.exports = { enviarCorreoRecuperacion };