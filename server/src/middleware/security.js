const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

const isDev = process.env.NODE_ENV !== 'production';

// General API Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100, // Higher limit for development
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        error: 'Too many requests, please try again later.',
    },
});

// Stricter limiter for authentication routes (Brute force protection)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDev ? 100 : 10, // Higher limit for development
    message: {
        status: 429,
        error: 'Too many login attempts, please try again later.',
    },
});

const securityMiddleware = (app) => {
    // Data Sanitization against XSS
    app.use(xss());

    // Prevent Parameter Pollution
    app.use(hpp());

    // Apply general rate limiter to all API routes
    app.use('/api', apiLimiter);

    // Apply auth limiter to auth routes
    app.use('/auth', authLimiter);
};

module.exports = {
    apiLimiter,
    authLimiter,
    securityMiddleware,
};
