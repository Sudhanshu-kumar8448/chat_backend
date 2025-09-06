const rateLimit = require('express-rate-limit');

// Custom key generator that handles proxy environments
const getClientIP = (req) => {
  // In production with trusted proxy, use x-forwarded-for
  if (process.env.NODE_ENV === 'production') {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.connection?.remoteAddress || 
           'unknown';
  }
  // In development, use connection remote address
  return req.connection?.remoteAddress || req.ip || 'unknown';
};

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: getClientIP,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Message sending rate limiting
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 messages per minute
  keyGenerator: getClientIP,
  message: {
    success: false,
    message: 'Too many messages sent, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Community creation rate limiting
const communityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 community creations per hour
  keyGenerator: getClientIP,
  message: {
    success: false,
    message: 'Too many communities created, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 uploads per 15 minutes
  keyGenerator: getClientIP,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  messageLimiter,
  communityLimiter,
  uploadLimiter
};
