const express = require('express');
const router = express.Router();
const {
  getPeliculas,
  getPelicula,
  createPelicula,
  updatePelicula,
  deletePelicula
} = require('../controllers/peliculaController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Rutas públicas
router.get('/', getPeliculas);
router.get('/:id', getPelicula);

// Rutas protegidas
router.post(
  '/',
  protect,
  authorize('admin', 'empleado'),
  upload.single('imagen'),
  createPelicula
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'empleado'),
  upload.single('imagen'),
  updatePelicula
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deletePelicula
);

module.exports = router;