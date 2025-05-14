const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Empleado = require('../models/Empleado');
const sendEmail = require('../utils/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generar Token JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Registrar usuario (cliente)
// @route   POST /api/auth/register/cliente
// @access  Public
exports.registrarCliente = async (req, res) => {
  try {
    const { nombre, correo, contrasenia, telefono, direccion } = req.body;

    // Verificar si el usuario ya existe
    let usuario = await Usuario.findOne({ correo });
    if (usuario) {
      return res.status(400).json({ success: false, error: 'El correo ya está registrado' });
    }

    // Crear el usuario
    usuario = await Usuario.create({
      tipo: 'cliente',
      correo,
      contrasenia
    });

    // Crear el cliente
    const cliente = await Cliente.create({
      usuario: usuario._id,
      nombre,
      telefono,
      direccion,
      activo: true
    });

    enviarTokenRespuesta(usuario, 201, res, 'cliente');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// @desc    Registrar usuario (empleado)
// @route   POST /api/auth/register/empleado
// @access  Private/Admin
exports.registrarEmpleado = async (req, res) => {
  try {
    const { nombre, correo, contrasenia, telefono, direccion, puesto, salario, fecha_contratacion } = req.body;

    // Verificar si el usuario ya existe
    let usuario = await Usuario.findOne({ correo });
    if (usuario) {
      return res.status(400).json({ success: false, error: 'El correo ya está registrado' });
    }

    // Crear el usuario
    usuario = await Usuario.create({
      tipo: 'empleado',
      correo,
      contrasenia
    });

    // Crear el empleado
    const empleado = await Empleado.create({
      usuario: usuario._id,
      nombre,
      telefono,
      direccion,
      puesto,
      salario,
      fecha_contratacion: fecha_contratacion || Date.now(),
      activo: true
    });

    res.status(201).json({
      success: true,
      data: {
        usuario: {
          _id: usuario._id,
          correo: usuario.correo,
          tipo: usuario.tipo
        },
        empleado
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// @desc    Registrar usuario (admin)
// @route   POST /api/auth/register/admin
// @access  Public (idealmente debería ser un proceso seguro o una ruta protegida)
exports.registrarAdmin = async (req, res) => {
  try {
    const { correo, contrasenia } = req.body;

    // Verificar si el usuario ya existe
    let usuario = await Usuario.findOne({ correo });
    if (usuario) {
      return res.status(400).json({ success: false, error: 'El correo ya está registrado' });
    }

    // Crear el usuario admin
    usuario = await Usuario.create({
      tipo: 'admin',
      correo,
      contrasenia
    });

    res.status(201).json({
      success: true,
      data: {
        _id: usuario._id,
        correo: usuario.correo,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// @desc    Login usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { correo, contrasenia } = req.body;

    // Validar correo y contraseña
    if (!correo || !contrasenia) {
      return res.status(400).json({ success: false, error: 'Proporcione un correo y contraseña' });
    }

    // Buscar usuario y seleccionar la contraseña
    const usuario = await Usuario.findOne({ correo }).select('+contrasenia');

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Verificar si la contraseña coincide
    const isMatch = await usuario.matchPassword(contrasenia);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Si es cliente o empleado, obtener la información completa
    let detalles = null;
    if (usuario.tipo === 'cliente') {
      detalles = await Cliente.findOne({ usuario: usuario._id });
    } else if (usuario.tipo === 'empleado') {
      detalles = await Empleado.findOne({ usuario: usuario._id });
    }

    enviarTokenRespuesta(usuario, 200, res, usuario.tipo, detalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// @desc    Cerrar sesión / limpiar cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);

    // Si es cliente o empleado, obtener la información completa
    let detalles = null;
    if (usuario.tipo === 'cliente') {
      detalles = await Cliente.findOne({ usuario: usuario._id });
    } else if (usuario.tipo === 'empleado') {
      detalles = await Empleado.findOne({ usuario: usuario._id });
    }

    res.status(200).json({
      success: true,
      data: {
        usuario: {
          _id: usuario._id,
          correo: usuario.correo,
          tipo: usuario.tipo
        },
        detalles
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// @desc    Solicitud de recuperación de contraseña
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ correo: req.body.correo });

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'No hay usuario con ese correo' });
    }

    // Generar token
    const resetToken = usuario.getResetPasswordToken();

    await usuario.save({ validateBeforeSave: false });

    // Crear URL de reset
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    const message = `
      <h1>Solicitud de restablecimiento de contraseña</h1>
      <p>Ha recibido este correo porque usted (o alguien más) ha solicitado restablecer su contraseña.</p>
      <p>Por favor use el siguiente código para restablecer su contraseña:</p>
      <h2>${resetToken}</h2>
      <p>Si no ha solicitado este restablecimiento, simplemente ignore este correo y su contraseña permanecerá sin cambios.</p>
    `;

    try {
      await sendEmail({
        email: usuario.correo,
        subject: 'Restablecimiento de contraseña',
        message
      });

      res.status(200).json({ success: true, data: 'Correo electrónico enviado' });
    } catch (error) {
      console.error(error);
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpire = undefined;

      await usuario.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, error: 'No se pudo enviar el correo' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// @desc    Restablecer contraseña
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Obtener token hasheado
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const usuario = await Usuario.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ success: false, error: 'Token inválido o expirado' });
    }

    // Establecer nueva contraseña
    usuario.contrasenia = req.body.contrasenia;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpire = undefined;
    await usuario.save();

    enviarTokenRespuesta(usuario, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// Función auxiliar para enviar respuesta con token
const enviarTokenRespuesta = (usuario, statusCode, res, tipo = null, detalles = null) => {
  // Crear token
  const token = generarToken(usuario._id);

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      usuario: {
        _id: usuario._id,
        correo: usuario.correo,
        tipo: tipo || usuario.tipo
      },
      detalles: detalles || null
    });
};