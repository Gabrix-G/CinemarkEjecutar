const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nombre: {
    type: String,
    required: [true, 'Por favor ingrese el nombre del cliente'],
    trim: true
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
  telefono: {
    type: String,
    required: [true, 'Por favor ingrese un número de teléfono']
  },
  direccion: {
    type: String,
    required: [true, 'Por favor ingrese una dirección']
  },
  activo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cliente', ClienteSchema);