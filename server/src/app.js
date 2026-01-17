const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const authRoutes = require('./routes/auth.routes');
const dataRoutes = require('./routes/data.routes');
const aiRoutes = require('./routes/ai.routes');
const detailedTaskRoutes = require('./routes/detailed_task.routes');

const helmetConfig = require('./middleware/helmet');
const { securityMiddleware } = require('./middleware/security');
const requestLogger = require('./middleware/requestLogger');
const compression = require('./middleware/compression');
const { limiter, authLimiter } = require('./middleware/rateLimit');
const performanceMiddleware = require('./middleware/performance');
const healthRoutes = require('./routes/health');

app.use(performanceMiddleware); // Measure time first
app.use(compression); // Compress responses
app.use(requestLogger);
app.use(helmetConfig);
app.use(cors());
app.use(express.json());

// Apply security middleware (Rate limiting, XSS, HPP)
// securityMiddleware applies some rate limiting, but we want our custom one too. 
// If securityMiddleware already does rate limiting, we should check. 
// Assuming we add ours as global or specific. 
// Let's add global limiter here.
app.use(limiter);
securityMiddleware(app);

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

app.use('/auth', authLimiter, authRoutes);
app.use('/api', dataRoutes);
app.use('/api/tasks/details', detailedTaskRoutes); // Specialized routes
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/templates', require('./routes/templates.routes'));
app.use('/ai', aiRoutes);
app.use('/health', healthRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'AI Planner API is running' });
});

// Handle 404
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'ERR_NOT_FOUND'));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
