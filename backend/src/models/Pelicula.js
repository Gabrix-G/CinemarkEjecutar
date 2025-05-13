const mongoose = require('mongoose');

const PeliculaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor ingrese el título de la película'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'Por favor ingrese una descripción'],
    trim: true
  },
  director: {
    type: String,
    required: [true, 'Por favor ingrese el nombre del director'],
    trim: true
  },
  genero: {
    type: [String],
    required: [true, 'Por favor ingrese al menos un género']
  },
  anio: {
    type: Number,
    required: [true, 'Por favor ingrese el año de lanzamiento']
  },
  duracion: {
    type: Number,
    required: [true, 'Por favor ingrese la duración en minutos']
  },
  imagen: {
    type: String,
    required: [true, 'Por favor cargue una imagen']
  },
  imageId: {
    type: String, // ID de Cloudinary para facilitar eliminación
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pelicula', PeliculaSchema);