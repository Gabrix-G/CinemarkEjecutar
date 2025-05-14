const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  // Crear transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Opciones de correo
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // Enviar correo
  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;