const rateLimit = require('express-rate-limit');

// Development-friendly rate limits
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100, // 1000 in dev, 100 in production
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});

// Stricter limit for login/auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDev ? 100 : 10, // 100 in dev, 10 in production
    message: {
        status: 429,
        message: 'Too many login attempts, please try again later.'
    }
});

module.exports = { limiter, authLimiter };
