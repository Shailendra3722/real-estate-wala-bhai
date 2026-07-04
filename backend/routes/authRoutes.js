/**
 * Authentication Route Definitions
 * 
 * Maps login, register, and session profile endpoints to the Auth Controller.
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public access routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Token authenticated routes
router.get('/me', verifyToken, AuthController.getMe);

module.exports = router;
