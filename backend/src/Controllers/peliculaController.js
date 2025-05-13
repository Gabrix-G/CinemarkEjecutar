const path = require('path');
const fs = require('fs');
const Pelicula = require('../models/Pelicula');
const cloudinary = require('../config/cloudinary');

// @desc    Obtener todas las películas
// @route   GET /api/peliculas
// @access  Public
exports.getPeliculas = async (req, res, next) => {
  try {
    const peliculas = await Pelicula.find();

    res.status(200).json({
      success: true,
      count: peliculas.length,
      data: peliculas
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una película por ID
// @route   GET /api/peliculas/:id
// @access  Public
exports.getPelicula = async (req, res, next) => {
  try {
    const pelicula = await Pelicula.findById(req.params.id);

    if (!pelicula) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró la película'
      });
    }

    res.status(200).json({
      success: true,
      data: pelicula
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nueva película
// @route   POST /api/peliculas
// @access  Private
exports.createPelicula = async (req, res, next) => {
  try {
    // Verificar si se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba una imagen'
      });
    }

    // Subir imagen a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'cinemark/peliculas',
      resource_type: 'image'
    });

    // Eliminar archivo local después de subirlo a Cloudinary
    fs.unlinkSync(req.file.path);

    // Crear película con datos del formulario
    const { titulo, descripcion, director, genero, anio, duracion } = req.body;

    const pelicula = await Pelicula.create({
      titulo,
      descripcion,
      director,
      genero: genero.split(',').map(g => g.trim()), // Convertir string a array
      anio,
      duracion,
      imagen: result.secure_url,
      imageId: result.public_id
    });

    res.status(201).json({
      success: true,
      data: pelicula
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar película
// @route   PUT /api/peliculas/:id
// @access  Private
exports.updatePelicula = async (req, res, next) => {
  try {
    let pelicula = await Pelicula.findById(req.params.id);

    if (!pelicula) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró la película'
      });
    }

    let updateData = {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      director: req.body.director,
      genero: typeof req.body.genero === 'string' ? req.body.genero.split(',').map(g => g.trim()) : req.body.genero,
      anio: req.body.anio,
      duracion: req.body.duracion
    };

    // Si se subió una nueva imagen
    if (req.file) {
      // Eliminar imagen anterior de Cloudinary
      if (pelicula.imageId) {
        await cloudinary.uploader.destroy(pelicula.imageId);
      }

      // Subir nueva imagen a Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'cinemark/peliculas',
        resource_type: 'image'
      });

      // Eliminar archivo local
      fs.unlinkSync(req.file.path);

      // Agregar URL e ID de la nueva imagen
      updateData.imagen = result.secure_url;
      updateData.imageId = result.public_id;
    }

    // Actualizar película
    pelicula = await Pelicula.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: pelicula
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar película
// @route   DELETE /api/peliculas/:id
// @access  Private
exports.deletePelicula = async (req, res, next) => {
  try {
    const pelicula = await Pelicula.findById(req.params.id);

    if (!pelicula) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró la película'
      });
    }

    // Eliminar imagen de Cloudinary
    if (pelicula.imageId) {
      await cloudinary.uploader.destroy(pelicula.imageId);
    }

    // Eliminar película
    await pelicula.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};