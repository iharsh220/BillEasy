const express = require('express');
const { login } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// POST /auth/login - Login user
router.post('/login', authLimiter, login);

module.exports = router;
