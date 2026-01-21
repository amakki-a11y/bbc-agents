const rateLimit = require('express-rate-limit');

// Development-friendly rate limits
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 30,
    message: {
        status: 429,
        message: 'Too many login attempts, please try again later.'
    }
});

module.exports = { limiter, authLimiter };
