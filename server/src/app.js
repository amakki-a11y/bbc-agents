const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Trust proxy - required for Railway/Render/etc behind load balancer
app.set('trust proxy', 1);

const authRoutes = require('./routes/auth.routes');
const aiRoutes = require('./routes/ai.routes');
const v1Routes = require('./routes/v1');

const helmetConfig = require('./middleware/helmet');
const { securityMiddleware } = require('./middleware/security');
const requestLogger = require('./middleware/requestLogger');
const compression = require('./middleware/compression');
const { limiter, authLimiter } = require('./middleware/rateLimit');
const performanceMiddleware = require('./middleware/performance');
const healthRoutes = require('./routes/health');

app.use(performanceMiddleware);
app.use(compression);
app.use(requestLogger);
app.use(helmetConfig);

// CORS configuration
const allowedOrigins = [
  'https://front-end-production-ad4c.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());
app.use(express.json());

// Serve uploaded files statically (use Railway volume path if available)
const UPLOAD_BASE = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOAD_BASE));
console.log('Serving static uploads from:', UPLOAD_BASE);

// Security middleware
app.use(limiter);
securityMiddleware(app);

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

// Auth routes (no version prefix)
app.use('/auth', authLimiter, authRoutes);

// API v1 routes (recommended)
app.use('/api/v1', v1Routes);

// Legacy /api routes (backwards compatibility - will be deprecated)
app.use('/api', v1Routes);

// AI routes
app.use('/ai', aiRoutes);

// Health check
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'BBC Agents API',
        version: '1.0.0',
        endpoints: {
            v1: '/api/v1',
            legacy: '/api (deprecated, use /api/v1)',
            auth: '/auth',
            health: '/health'
        }
    });
});

// Handle 404
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'ERR_NOT_FOUND'));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
