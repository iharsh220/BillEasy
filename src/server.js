const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const routes = require('./routes');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const requestLogger = require('./middlewares/requestLogger');
const { errorHandler } = require('./middlewares/errorHandler');
const { globalLimiter } = require('./middlewares/rateLimiter');
require('dotenv').config();

// Import worker to start processing
require('./services/fileProcessor');

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 3000;

// Get max file size from environment
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 * 1024; // 10GB default

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies with increased limit
app.use(requestLogger); // Log requests
app.use(globalLimiter); // Rate limiting

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
