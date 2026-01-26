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
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

// All routes here are protected
router.use(authenticateToken);

// Tasks
router.get('/tasks', getTasks);

router.post('/tasks', [
    check('title').trim().notEmpty().withMessage('Title is required').escape(),
    check('description').optional({ nullable: true }).trim(),
    check('status').optional().isIn(['todo', 'in_progress', 'in-progress', 'done', 'blocked']).withMessage('Invalid status'),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    check('due_date').optional({ nullable: true }).custom((value) => {
        if (value === null || value === '') return true;
        if (isNaN(Date.parse(value))) throw new Error('Invalid due date');
        return true;
    }),
    check('project_id').optional({ nullable: true }).custom((value) => {
        if (value === null) return true;
        if (!Number.isInteger(Number(value))) throw new Error('Invalid project ID');
        return true;
    }),
    check('tags').optional().custom((value) => {
        if (Array.isArray(value) || typeof value === 'string' || value === null) return true;
        throw new Error('Tags must be an array or string');
    }),
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
    param('id').isInt().withMessage('Invalid task ID'),
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional({ nullable: true }).trim(),
    check('status').optional().isIn(['todo', 'in_progress', 'in-progress', 'done', 'blocked']).withMessage('Invalid status'),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    check('due_date').optional({ nullable: true }).custom((value) => {
        if (value === null || value === '') return true;
        if (isNaN(Date.parse(value))) throw new Error('Invalid due date');
        return true;
    }),
    check('project_id').optional({ nullable: true }).custom((value) => {
        if (value === null) return true;
        if (!Number.isInteger(Number(value))) throw new Error('Invalid project ID');
        return true;
    }),
    check('tags').optional().custom((value) => {
        if (Array.isArray(value) || typeof value === 'string' || value === null) return true;
        throw new Error('Tags must be an array or string');
    }),
    validate
], updateTask);

router.delete('/tasks/:id', [
    param('id').isInt().withMessage('Invalid task ID'),
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
    param('id').isInt().withMessage('Invalid event ID'),
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional().trim().escape(),
    check('start_time').optional().isISO8601().toDate(),
    check('end_time').optional().isISO8601().toDate(),
    validate
], updateEvent);

router.delete('/events/:id', [
    param('id').isInt().withMessage('Invalid event ID'),
    validate
], deleteEvent);

module.exports = router;
