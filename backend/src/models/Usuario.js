const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['admin', 'cliente', 'empleado'],
    required: true
  },
  correo: {
    type: String,
    required: true,
    unique: true
  },
  contrasenia: {
    type: String,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encriptar contraseña antes de guardar
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('contrasenia')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.contrasenia = await bcrypt.hash(this.contrasenia, salt);
});

// Método para comparar contraseñas
UsuarioSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.contrasenia);
};

// Generar token de restablecimiento de contraseña
UsuarioSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token y asignarlo al campo resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Establecer tiempo de expiración (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model('Usuario', UsuarioSchema);