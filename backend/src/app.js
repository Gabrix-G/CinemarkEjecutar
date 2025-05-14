const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const conectarDB = require('./config/database');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
conectarDB();

// Inicializar app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/peliculas', require('./routes/peliculaRoutes'));
app.use('/api/empleados', require('./routes/empleadoRoutes'));
app.use('/api/clientes', require('./routes/clienteRoutes'));

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error intlno del server :c';
  
  res.status(statusCode).json({
    success: false,
    error: message
  });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
});

// Manejo de excepciones no capturadas
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Cerrando el servidor debido a un rechazo de promesa no manejado');
  
  // Cerrar servidor
  server.close(() => {
    process.exit(1);
  });
});