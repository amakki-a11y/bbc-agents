const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getTaskDetails,
    updateTaskAdvanced,
    addSubtask,
    toggleSubtask,
    addComment,
    addActionItem,
    updateActionItem,
    deleteActionItem
} = require('../controllers/detailed_task.controller');
const { check } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

router.get('/:id', [
    check('id').isInt().withMessage('Invalid task ID').toInt(),
    validate
], getTaskDetails);

router.put('/:id', [
    check('id').isInt().withMessage('Invalid task ID').toInt(),
    // Allow comprehensive updates, similar to regular updateTask but maybe with more fields
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional().trim().escape(),
    validate
], updateTaskAdvanced);

router.post('/:taskId/subtasks', [
    check('taskId').isInt().withMessage('Invalid task ID').toInt(),
    check('title').trim().notEmpty().withMessage('Subtask title is required').escape(),
    validate
], addSubtask);

router.put('/subtasks/:id', [
    check('id').isInt().withMessage('Invalid subtask ID').toInt(),
    validate
], toggleSubtask);

router.post('/:taskId/comments', [
    check('taskId').isInt().withMessage('Invalid task ID').toInt(),
    check('content').trim().notEmpty().withMessage('Comment content is required').escape(),
    validate
], addComment);

// Action Items
router.post('/:taskId/action-items', [
    check('taskId').isInt().withMessage('Invalid task ID').toInt(),
    check('content').trim().notEmpty().withMessage('Action item content is required').escape(),
    validate
], addActionItem);

router.put('/action-items/:id', [
    check('id').isInt().withMessage('Invalid action item ID').toInt(),
    check('completed').optional().isBoolean(),
    check('content').optional().trim().notEmpty().escape(),
    validate
], updateActionItem);

router.delete('/action-items/:id', [
    check('id').isInt().withMessage('Invalid action item ID').toInt(),
    validate
], deleteActionItem);

module.exports = router;
