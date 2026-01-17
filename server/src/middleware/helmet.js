const helmet = require('helmet');

const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts if necessary, but try to avoid
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"], // Add frontend URL
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for API
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: "deny",
    },
});

module.exports = helmetConfig;
