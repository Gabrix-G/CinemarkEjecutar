const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'Por favor ingrese un nombre']
  },
  correo: {
    type: String,
    required: [true, 'Por favor ingrese un correo electrónico'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un correo electrónico válido'
    ]
  },
  contrasenia: {
    type: String,
    required: [true, 'Por favor ingrese una contraseña'],
    minlength: 6,
    select: false
  },
  rol: {
    type: String,
    enum: ['admin', 'empleado', 'cliente'],
    default: 'cliente'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña antes de guardar
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('contrasenia')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.contrasenia = await bcrypt.hash(this.contrasenia, salt);
  next();
});

// Método para comparar contraseñas
UsuarioSchema.methods.matchPassword = async function(contraseniaIngresada) {
  return await bcrypt.compare(contraseniaIngresada, this.contrasenia);
};

// Generar y retornar JWT
UsuarioSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, rol: this.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generar token para resetear contraseña
UsuarioSchema.methods.getResetPasswordToken = function() {
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token y establecerlo en resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Establecer expiración (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('Usuario', UsuarioSchema);