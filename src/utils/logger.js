const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const accessLogPath = path.join(logsDir, 'access.log');
const errorLogPath = path.join(logsDir, 'error.log');

const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
};

const writeToFile = (filePath, message) => {
  fs.appendFile(filePath, message, (err) => {
    if (err) {
      console.error(`Error writing to log file: ${err.message}`);
    }
  });
};

//Logger object
const logger = {
  info: (message, meta = {}) => {
    const logMessage = formatLogMessage('info', message, meta);
    console.log(logMessage.trim());
    writeToFile(accessLogPath, logMessage);
  },
  warn: (message, meta = {}) => {
    const logMessage = formatLogMessage('warn', message, meta);
    console.warn(logMessage.trim());
    writeToFile(accessLogPath, logMessage);
  },
  error: (message, meta = {}) => {
    const logMessage = formatLogMessage('error', message, meta);
    console.error(logMessage.trim());
    writeToFile(errorLogPath, logMessage);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = formatLogMessage('debug', message, meta);
      console.debug(logMessage.trim());
      writeToFile(accessLogPath, logMessage);
    }
  },
  request: (req, res) => {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : 'anonymous'
    };
    logger.info('HTTP Request', meta);
  }
};

module.exports = logger;
