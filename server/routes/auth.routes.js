const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/users', authController.getAllUsers);
router.get('/users/passwords', authController.getUserPasswords);
router.put('/users/:id/password', authController.changePassword);
router.put('/users/:id/role', authController.updateRole);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;

