const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Proteger rutas
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verificar si el token está en los headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extraer token del header
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si no hay token
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para acceder a esta ruta'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Agregar usuario al request
      req.usuario = await Usuario.findById(decoded.id);
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para acceder a esta ruta'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para acceder a esta ruta'
      });
    }
    
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        error: `El rol ${req.usuario.rol} no está autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};