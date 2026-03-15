const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, refresh } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, register);

router.post('/login', authRateLimiter, login);

router.get('/me', authMiddleware, getMe);

router.post('/logout', authMiddleware, logout);

router.post('/refresh', refresh);

module.exports = router;
