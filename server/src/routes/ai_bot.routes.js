const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    handleBotMessage,
    getConversationHistory,
    getContext,
    routeMessage,
    markAsRead
} = require('../controllers/ai_bot.controller');

// All routes require authentication
router.use(authenticateToken);

// Send message to bot
router.post('/message', [
    check('content').trim().notEmpty().withMessage('Message content is required'),
    check('messageType').optional().isIn(['question', 'report', 'request', 'announcement']),
    validate
], handleBotMessage);

// Get conversation history
router.get('/history', getConversationHistory);

// Get employee's current context
router.get('/context', getContext);

// Route message to another employee
router.post('/route', [
    check('toEmployeeId').notEmpty().withMessage('Target employee ID is required'),
    check('content').trim().notEmpty().withMessage('Message content is required'),
    check('messageType').optional().isIn(['question', 'report', 'request', 'announcement']),
    validate
], routeMessage);

// Mark messages as read
router.post('/read', markAsRead);

module.exports = router;
