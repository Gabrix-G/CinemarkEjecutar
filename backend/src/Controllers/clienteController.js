const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');

// @desc    Obtener todos los clientes
// @route   GET /api/clientes
// @access  Private/Admin
exports.getClientes = async (req, res, next) => {
  try {
    const clientes = await Cliente.find();

    res.status(200).json({
      success: true,
      count: clientes.length,
      data: clientes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un cliente por ID
// @route   GET /api/clientes/:id
// @access  Private/Admin
exports.getCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró el cliente'
      });
    }

    res.status(200).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nuevo cliente
// @route   POST /api/clientes
// @access  Private/Admin
exports.createCliente = async (req, res, next) => {
  try {
    const { nombre, correo, contrasenia, telefono, direccion } = req.body;

    // Verificar si el correo ya está registrado
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Crear usuario tipo cliente
    const usuario = await Usuario.create({
      nombre,
      correo,
      contrasenia,
      rol: 'cliente'
    });

    // Crear registro de cliente
    const cliente = await Cliente.create({
      usuario: usuario._id,
      nombre,
      correo,
      telefono,
      direccion,
      activo: true
    });

    res.status(201).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar cliente
// @route   PUT /api/clientes/:id
// @access  Private/Admin
exports.updateCliente = async (req, res, next) => {
  try {
    // Encontrar cliente
    let cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró el cliente'
      });
    }

    // Actualizar datos del cliente
    cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Si se actualizó el correo o nombre, también actualizar en usuario
    if (req.body.correo || req.body.nombre) {
      const updateUser = {};
      if (req.body.correo) updateUser.correo = req.body.correo;
      if (req.body.nombre) updateUser.nombre = req.body.nombre;

      await Usuario.findByIdAndUpdate(cliente.usuario, updateUser, {
        runValidators: true
      });
    }

    // Si se proporcionó una nueva contraseña, actualizarla
    if (req.body.contrasenia) {
      const usuario = await Usuario.findById(cliente.usuario);
      usuario.contrasenia = req.body.contrasenia;
      await usuario.save();
    }

    res.status(200).json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar cliente (desactivar)
// @route   DELETE /api/clientes/:id
// @access  Private/Admin
exports.deleteCliente = async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró el cliente'
      });
    }

    // En lugar de eliminar, marcar como inactivo
    cliente.activo = false;
    await cliente.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};