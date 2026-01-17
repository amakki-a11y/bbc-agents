const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

// General API Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
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
    max: 10, // Limit each IP to 10 login attempts per hour
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
