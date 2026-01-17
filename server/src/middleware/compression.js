const compression = require('compression');

// Compress all HTTP responses
const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            // don't compress responses with this request header
            return false;
        }
        // fallback to standard filter function
        return compression.filter(req, res);
    },
    threshold: 1024 // Only compress responses larger than 1KB
});

module.exports = compressionMiddleware;
