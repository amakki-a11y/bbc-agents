const rateLimit = require('express-rate-limit');

// Relaxed rate limits for testing
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 1000, // 1000 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too many requests, please try again later.'
    }
});

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 100, // 100 login attempts per minute
    message: {
        status: 429,
        error: 'Too many login attempts, please try again later.'
    }
});

module.exports = { limiter, authLimiter };
