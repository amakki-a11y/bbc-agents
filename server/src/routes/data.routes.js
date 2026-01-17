const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    bulkDeleteTasks,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} = require('../controllers/data.controller');
const { check } = require('express-validator');
const validate = require('../middleware/validate');

// All routes here are protected
router.use(authenticateToken);

// Tasks
router.get('/tasks', getTasks);

router.post('/tasks', [
    check('title').trim().notEmpty().withMessage('Title is required').escape(),
    check('description').optional().trim().escape(),
    check('status').optional().isIn(['todo', 'in-progress', 'done', 'blocked']).withMessage('Invalid status'),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    check('due_date').optional().isISO8601().withMessage('Invalid due date').toDate(),
    check('projectId').optional().isInt().withMessage('Invalid project ID').toInt(),
    check('assigneeId').optional().isInt().withMessage('Invalid assignee ID').toInt(),
    validate
], createTask);

// Bulk Operations
router.put('/tasks/bulk', [
    check('taskIds').isArray().withMessage('taskIds must be an array'),
    validate
], bulkUpdateTasks);

router.delete('/tasks/bulk', [
    check('taskIds').isArray().withMessage('taskIds must be an array'),
    validate
], bulkDeleteTasks);

router.put('/tasks/:id', [
    check('id').isInt().withMessage('Invalid task ID').toInt(),
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional().trim().escape(),
    check('status').optional().isIn(['todo', 'in-progress', 'done', 'blocked']).withMessage('Invalid status'),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    check('due_date').optional().isISO8601().withMessage('Invalid due date').toDate(),
    validate
], updateTask);

router.delete('/tasks/:id', [
    check('id').isInt().withMessage('Invalid task ID').toInt(),
    validate
], deleteTask);

// Events
router.get('/events', getEvents);

router.post('/events', [
    check('title').trim().notEmpty().withMessage('Title is required').escape(),
    check('description').optional().trim().escape(),
    check('start_time').isISO8601().withMessage('Start time is required and must be valid').toDate(),
    check('end_time').isISO8601().withMessage('End time is required and must be valid').toDate(),
    validate
], createEvent);

router.put('/events/:id', [
    check('id').isInt().withMessage('Invalid event ID').toInt(),
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional().trim().escape(),
    check('start_time').optional().isISO8601().toDate(),
    check('end_time').optional().isISO8601().toDate(),
    validate
], updateEvent);

router.delete('/events/:id', [
    check('id').isInt().withMessage('Invalid event ID').toInt(),
    validate
], deleteEvent);

module.exports = router;
