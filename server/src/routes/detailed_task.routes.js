const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getTaskDetails,
    updateTaskAdvanced,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtaskFull,
    addComment,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addAttachment,
    deleteAttachment,
    addTimeEntry,
    updateTimeEntry,
    getTimeEntries,
    deleteActivity,
    addDependency,
    removeDependency,
    duplicateTask,
    moveTaskToProject
} = require('../controllers/detailed_task.controller');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// Custom validator for large numeric IDs (timestamp-based)
const isValidId = (value) => {
    const num = Number(value);
    return !isNaN(num) && Number.isFinite(num) && num > 0;
};

// Get task details
router.get('/:id', [
    param('id').custom(isValidId).withMessage('Invalid task ID'),
    validate
], getTaskDetails);

// Update task
router.put('/:id', [
    param('id').custom(isValidId).withMessage('Invalid task ID'),
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional().trim().escape(),
    validate
], updateTaskAdvanced);

// Subtasks
router.post('/:taskId/subtasks', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('title').trim().notEmpty().withMessage('Subtask title is required').escape(),
    validate
], addSubtask);

router.put('/subtasks/:id', [
    param('id').custom(isValidId).withMessage('Invalid subtask ID'),
    validate
], toggleSubtask);

// Comments
router.post('/:taskId/comments', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('content').trim().notEmpty().withMessage('Comment content is required').escape(),
    validate
], addComment);

// Action Items
router.post('/:taskId/action-items', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('content').trim().notEmpty().withMessage('Action item content is required').escape(),
    validate
], addActionItem);

router.put('/action-items/:id', [
    param('id').custom(isValidId).withMessage('Invalid action item ID'),
    check('is_complete').optional().isBoolean(),
    check('content').optional().trim().notEmpty().escape(),
    validate
], updateActionItem);

router.delete('/action-items/:id', [
    param('id').custom(isValidId).withMessage('Invalid action item ID'),
    validate
], deleteActionItem);

// Subtask delete route
router.delete('/subtasks/:id', [
    param('id').custom(isValidId).withMessage('Invalid subtask ID'),
    validate
], deleteSubtask);

// Attachments
router.post('/:taskId/attachments', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('filename').trim().notEmpty().withMessage('Filename is required'),
    check('file_url').trim().notEmpty().withMessage('File URL is required'),
    validate
], addAttachment);

router.delete('/attachments/:id', [
    param('id').custom(isValidId).withMessage('Invalid attachment ID'),
    validate
], deleteAttachment);

// Time Entries
router.get('/:taskId/time-entries', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    validate
], getTimeEntries);

router.post('/:taskId/time-entries', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('start_time').notEmpty().withMessage('Start time is required'),
    validate
], addTimeEntry);

router.put('/time-entries/:id', [
    param('id').custom(isValidId).withMessage('Invalid time entry ID'),
    validate
], updateTimeEntry);

// Delete Activity (comment)
router.delete('/activities/:id', [
    param('id').custom(isValidId).withMessage('Invalid activity ID'),
    validate
], deleteActivity);

// Dependencies
router.post('/:taskId/dependencies', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('depends_on_id').custom(isValidId).withMessage('Invalid dependency task ID'),
    validate
], addDependency);

router.delete('/:taskId/dependencies/:dependsOnId', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    param('dependsOnId').custom(isValidId).withMessage('Invalid dependency task ID'),
    validate
], removeDependency);

// Duplicate Task
router.post('/:id/duplicate', [
    param('id').custom(isValidId).withMessage('Invalid task ID'),
    validate
], duplicateTask);

// Move Task to Project
router.put('/:id/move', [
    param('id').custom(isValidId).withMessage('Invalid task ID'),
    check('project_id').custom(isValidId).withMessage('Invalid project ID'),
    validate
], moveTaskToProject);

module.exports = router;
