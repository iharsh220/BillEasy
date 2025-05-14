const rateLimit = require('express-rate-limit');
const { ApiError } = require('./errorHandler');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    throw new ApiError(429, 'Too many requests, please try again later.');
  }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 login attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    throw new ApiError(429, 'Too many login attempts, please try again later.');
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id.toString(), // Rate limit by user ID
  handler: (req, res, next, options) => {
    throw new ApiError(429, 'Upload limit reached, please try again later.');
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter
};
