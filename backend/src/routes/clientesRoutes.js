const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Rutas públicas
router.post('/registro', clienteController.registrarCliente);

// Rutas protegidas - requieren autenticación
router.use(authMiddleware.protegerRuta);

// Rutas para todos los clientes autenticados
router.get('/perfil', clienteController.obtenerPerfil);
router.patch('/actualizar-perfil', clienteController.actualizarPerfil);

// Rutas solo para administradores
router.use(roleMiddleware.restriccionRol('admin'));
router.get('/', clienteController.obtenerTodosClientes);
router.get('/:id', clienteController.obtenerCliente);
router.patch('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

module.exports = router;