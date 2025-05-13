const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const Empleado = require('../models/Empleado');
const Cliente = require('../models/Cliente');
const sendEmail = require('../utils/emailService');

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { nombre, correo, contrasenia, rol, telefono, direccion } = req.body;

    // Verificar si el correo ya está registrado
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      correo,
      contrasenia,
      rol: rol || 'cliente'
    });

    // Si es empleado, crear registro de empleado
    if (rol === 'empleado') {
      const { puesto, salario, fecha_contratacion } = req.body;
      await Empleado.create({
        usuario: usuario._id,
        nombre,
        correo,
        telefono,
        direccion,
        puesto,
        salario,
        fecha_contratacion: fecha_contratacion || Date.now()
      });
    }
    
    // Si es cliente, crear registro de cliente
    if (rol === 'cliente' || !rol) {
      await Cliente.create({
        usuario: usuario._id,
        nombre,
        correo,
        telefono,
        direccion
      });
    }

    sendTokenResponse(usuario, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { correo, contrasenia } = req.body;

    // Validar correo y contraseña
    if (!correo || !contrasenia) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione un correo y contraseña'
      });
    }

    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ correo }).select('+contrasenia');
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar si la contraseña coincide
    const isMatch = await usuario.matchPassword(contrasenia);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    sendTokenResponse(usuario, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Cerrar sesión / limpiar cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Olvidó contraseña
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const usuario = await Usuario.findOne({ correo: req.body.correo });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'No hay un usuario con ese correo electrónico'
      });
    }

    // Obtener token de reseteo
    const resetToken = usuario.getResetPasswordToken();

    // Guardar el token en la BD
    await usuario.save({ validateBeforeSave: false });

    // Crear URL de reseteo
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/resetpassword/${resetToken}`;

    // HTML de correo
    const message = `
      <h1>Has solicitado reestablecer tu contraseña</h1>
      <p>Por favor ingresa al siguiente enlace para reestablecer tu contraseña:</p>
      <a href="${resetUrl}" target="_blank">Reestablecer Contraseña</a>
      <p>Si no solicitaste este cambio, por favor ignora este correo.</p>
    `;

    try {
      await sendEmail({
        email: usuario.correo,
        subject: 'Recuperación de contraseña - Cinemark',
        message
      });

      res.status(200).json({
        success: true,
        data: 'Correo electrónico enviado'
      });
    } catch (err) {
      console.log(err);
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpire = undefined;

      await usuario.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'No se pudo enviar el correo electrónico'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Resetear contraseña
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Obtener token hasheado
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Buscar usuario con token válido
    const usuario = await Usuario.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Establecer nueva contraseña
    usuario.contrasenia = req.body.contrasenia;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpire = undefined;

    await usuario.save();

    sendTokenResponse(usuario, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      nombre: req.body.nombre,
      correo: req.body.correo
    };

    const usuario = await Usuario.findByIdAndUpdate(req.usuario.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar contraseña
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('+contrasenia');

    // Verificar contraseña actual
    if (!(await usuario.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    usuario.contrasenia = req.body.newPassword;
    await usuario.save();

    sendTokenResponse(usuario, 200, res);
  } catch (error) {
    next(error);
  }
};

// Función para generar y enviar token JWT
const sendTokenResponse = (usuario, statusCode, res) => {
  // Crear token
  const token = usuario.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};