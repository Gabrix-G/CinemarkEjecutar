//Middleware para verificación de roles
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado, inicie sesión primero'
      });
    }

    const hasRole = roles.find(role => req.usuario.rol === role);
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permiso para realizar esta acción'
      });
    }

    next();
  };
};