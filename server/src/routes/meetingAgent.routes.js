const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    startSession,
    listSessions,
    getSession,
    getScreenshot,
    stopSession,
    regenerateNotes,
    updateActionItem,
    createTasks,
    deleteSession,
    listAssignees
} = require('../controllers/meetingAgent.controller');

router.use(authenticateToken);

router.get('/assignees', listAssignees);

router.post('/sessions', startSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSession);
router.get('/sessions/:id/screenshots/:segmentId', getScreenshot);
router.post('/sessions/:id/stop', stopSession);
router.post('/sessions/:id/regenerate', regenerateNotes);
router.post('/sessions/:id/create-tasks', createTasks);
router.delete('/sessions/:id', deleteSession);

router.patch('/action-items/:itemId', updateActionItem);

module.exports = router;
