const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para proteger rutas
exports.protegerRuta = async (req, res, next) => {
  try {
    let token;
    
    // Obtener token del header o cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    // Verificar si existe el token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No estás autorizado para acceder a esta ruta'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'El usuario ya no existe'
      });
    }
    
    // Guardar usuario en el request
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No estás autorizado para acceder a esta ruta'
    });
  }
};

// Generar token JWT
exports.generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Enviar token en cookie
exports.enviarTokenCookie = (usuario, statusCode, res) => {
  const token = this.generarToken(usuario._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
  res.cookie('jwt', token, cookieOptions);
  
  // Remover contraseña de la respuesta
  usuario.contrasenia = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      usuario
    }
  });
};