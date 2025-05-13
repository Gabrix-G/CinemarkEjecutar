
const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicializar Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/peliculas', require('./routes/peliculaRoutes'));
app.use('/api/empleados', require('./routes/empleadoRoutes'));
app.use('/api/clientes', require('./routes/clienteRoutes'));

// Ruta para probar que el API está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Cinemark' });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Error en el servidor'
  });
});

module.exports = app;