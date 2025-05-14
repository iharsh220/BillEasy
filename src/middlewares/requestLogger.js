const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // Save original end function
  const originalEnd = res.end;
  
  // Override end function to capture response
  res.end = function(chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    
    // Log request
    logger.request(req, res);
    
    // Call original end function
    res.end(chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger;
