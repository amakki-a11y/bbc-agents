const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getAgentActions,
    getLowConfidenceActions,
    getAgentAction,
    reviewAgentAction,
    getAgentStats,
    rollbackAgentAction
} = require('../controllers/agentActions.controller');

// All routes require authentication
router.use(authenticateToken);

// Stats endpoint (before :id to avoid conflict)
router.get('/stats', getAgentStats);

// Low confidence actions for review
router.get('/low-confidence', getLowConfidenceActions);

// Main CRUD
router.get('/', getAgentActions);
router.get('/:id', getAgentAction);

// Review and rollback actions
router.post('/:id/review', reviewAgentAction);
router.post('/:id/rollback', rollbackAgentAction);

module.exports = router;
