const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Crear transportador
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Opciones del mensaje
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // Enviar email
  const info = await transporter.sendMail(mailOptions);
  console.log('Email enviado:', info.messageId);
};

module.exports = sendEmail;