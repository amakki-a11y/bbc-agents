const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getLogs,
    getEntityLogs,
    getUserLogs,
    getStats,
    exportLogs,
    testLog,
    diagnose
} = require('../controllers/activityLogs.controller');

// All routes require authentication
router.use(authenticateToken);

// Get activity statistics
router.get('/stats', getStats);

// Export logs to CSV
router.get('/export', exportLogs);

// Get all logs (with filters and pagination)
router.get('/', getLogs);

// Get logs for a specific entity
router.get('/entity/:type/:id', [
    check('type').notEmpty().withMessage('Entity type is required'),
    check('id').notEmpty().withMessage('Entity ID is required'),
    validate
], getEntityLogs);

// Get logs for a specific user
router.get('/user/:userId', [
    check('userId').isInt().withMessage('Valid user ID is required'),
    validate
], getUserLogs);

// Test endpoint to verify logging works
router.post('/test', testLog);

// Diagnostic endpoint to check database status
router.get('/diagnose', diagnose);

module.exports = router;
