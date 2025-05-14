const express = require('express');
const authRoutes = require('./authRoutes');
const fileRoutes = require('./fileRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Register routes
router.use('/auth', authRoutes);
router.use('/', fileRoutes);

module.exports = router;
