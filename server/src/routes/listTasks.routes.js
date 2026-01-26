const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    addTaskAssignee,
    removeTaskAssignee,
    addTaskComment,
    updateTaskComment,
    deleteTaskComment,
    reorderTasks,
    moveTask
} = require('../controllers/listTasks.controller');
const { check, param, query, body } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// TASK CRUD
// ==========================================

// Get all tasks in a list
router.get('/list/:listId', [
    param('listId').isInt().withMessage('Invalid list ID').toInt(),
    query('includeArchived').optional().isBoolean(),
    query('statusId').optional().isInt().toInt(),
    query('priority').optional().isIn(['URGENT', 'HIGH', 'NORMAL', 'LOW', 'NONE']),
    query('assigneeId').optional().isString(),
    validate
], getTasks);

// Get task by ID
router.get('/:id', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    validate
], getTaskById);

// Create task
router.post('/', [
    check('listId').isInt().withMessage('List ID is required'),
    check('title').trim().notEmpty().withMessage('Task title is required'),
    check('description').optional().trim(),
    check('priority').optional().isIn(['URGENT', 'HIGH', 'NORMAL', 'LOW', 'NONE']),
    check('dueDate').optional().isISO8601(),
    check('startDate').optional().isISO8601(),
    check('timeEstimate').optional().isInt({ min: 0 }),
    check('statusId').optional().isInt(),
    check('parentTaskId').optional().isInt(),
    check('assigneeIds').optional().isArray(),
    validate
], createTask);

// Update task
router.put('/:id', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    check('title').optional().trim().notEmpty(),
    check('description').optional().trim(),
    check('priority').optional().isIn(['URGENT', 'HIGH', 'NORMAL', 'LOW', 'NONE']),
    check('dueDate').optional(),
    check('startDate').optional(),
    check('timeEstimate').optional().isInt({ min: 0 }),
    check('statusId').optional().isInt(),
    check('sortOrder').optional().isInt(),
    check('isArchived').optional().isBoolean(),
    check('listId').optional().isInt(),
    validate
], updateTask);

// Delete task
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    validate
], deleteTask);

// Move task to different list
router.post('/:id/move', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    check('listId').isInt().withMessage('Target list ID is required'),
    check('statusId').optional().isInt(),
    validate
], moveTask);

// ==========================================
// TASK ASSIGNEES
// ==========================================

// Add assignee to task
router.post('/:id/assignees', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    check('employeeId').isString().withMessage('Employee ID is required'),
    validate
], addTaskAssignee);

// Remove assignee from task
router.delete('/:id/assignees/:assigneeId', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    param('assigneeId').isInt().withMessage('Invalid assignee ID').toInt(),
    validate
], removeTaskAssignee);

// ==========================================
// TASK COMMENTS
// ==========================================

// Add comment to task
router.post('/:id/comments', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    check('content').trim().notEmpty().withMessage('Comment content is required'),
    check('parentId').optional().isInt(),
    validate
], addTaskComment);

// Update comment
router.put('/:id/comments/:commentId', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    param('commentId').isInt().withMessage('Invalid comment ID').toInt(),
    check('content').trim().notEmpty().withMessage('Comment content is required'),
    validate
], updateTaskComment);

// Delete comment
router.delete('/:id/comments/:commentId', [
    param('id').isInt().withMessage('Invalid task ID').toInt(),
    param('commentId').isInt().withMessage('Invalid comment ID').toInt(),
    validate
], deleteTaskComment);

// ==========================================
// TASK REORDERING
// ==========================================

// Reorder tasks in a list
router.put('/list/:listId/reorder', [
    param('listId').isInt().withMessage('Invalid list ID').toInt(),
    body('taskIds').isArray().withMessage('taskIds must be an array'),
    body('statusId').optional().isInt(),
    validate
], reorderTasks);

module.exports = router;
