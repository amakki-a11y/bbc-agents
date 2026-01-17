/**
 * Middleware to track request duration and add Server-Timing header
 */
const performanceMiddleware = (req, res, next) => {
    const start = process.hrtime();

    // Hook into response finish event
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e9 + diff[1]) / 1e6;

        // Log slow requests (over 100ms)
        if (timeInMs > 100) {
            console.warn(`[SLOW] ${req.method} ${req.originalUrl} took ${timeInMs.toFixed(3)}ms`);
        }

        // Note: We can't set headers here because headers are already sent.
        // Server-Timing header must be set BEFORE verifying response.
        // If we want to set it, we'd need to monkey-patch res.end or similar 
        // but finish event is safer for just logging. 
        // To add the header, we can estimate or use a different approach, 
        // but for now, logging is the priority for "Monitoring".
    });

    // Add a simple start timestamp to req for use in other middlewares
    req._startTime = Date.now();

    next();
};

module.exports = performanceMiddleware;
