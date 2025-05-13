const mongoose = require('mongoose');

const EmpleadoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nombre: {
    type: String,
    required: [true, 'Por favor ingrese el nombre del empleado'],
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
  puesto: {
    type: String,
    required: [true, 'Por favor ingrese el puesto o rol']
  },
  fecha_contratacion: {
    type: Date,
    required: [true, 'Por favor ingrese la fecha de contratación'],
    default: Date.now
  },
  salario: {
    type: Number,
    required: [true, 'Por favor ingrese el salario']
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

module.exports = mongoose.model('Empleado', EmpleadoSchema);