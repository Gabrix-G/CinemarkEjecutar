const express = require('express');
const router = express.Router();
const {
  getEmpleados,
  getEmpleado,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} = require('../controllers/empleadoController');
const { protect, authorize } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas solo para admin
router.route('/')
  .get(authorize('admin'), getEmpleados)
  .post(authorize('admin'), createEmpleado);

router.route('/:id')
  .get(authorize('admin'), getEmpleado)
  .put(authorize('admin'), updateEmpleado)
  .delete(authorize('admin'), deleteEmpleado);

module.exports = router;