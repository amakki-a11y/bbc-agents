const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getLists,
    getListById,
    createList,
    updateList,
    deleteList,
    updateListStatus,
    deleteListStatus,
    reorderLists
} = require('../controllers/lists.controller');
const { check, param, query, body } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// LIST CRUD
// ==========================================

// Get all lists in a space
router.get('/space/:spaceId', [
    param('spaceId').isInt().withMessage('Invalid space ID').toInt(),
    query('folderId').optional().isInt().toInt(),
    validate
], getLists);

// Get list by ID with tasks
router.get('/:id', [
    param('id').isInt().withMessage('Invalid list ID').toInt(),
    validate
], getListById);

// Create list
router.post('/', [
    check('spaceId').isInt().withMessage('Space ID is required'),
    check('name').trim().notEmpty().withMessage('List name is required').escape(),
    check('description').optional().trim(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('folderId').optional().isInt(),
    check('defaultView').optional().isIn(['LIST', 'BOARD', 'CALENDAR', 'TIMELINE', 'GANTT']),
    validate
], createList);

// Update list
router.put('/:id', [
    param('id').isInt().withMessage('Invalid list ID').toInt(),
    check('name').optional().trim().notEmpty().escape(),
    check('description').optional().trim(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('folderId').optional(),
    check('defaultView').optional().isIn(['LIST', 'BOARD', 'CALENDAR', 'TIMELINE', 'GANTT']),
    check('sortOrder').optional().isInt(),
    check('isArchived').optional().isBoolean(),
    validate
], updateList);

// Delete list
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid list ID').toInt(),
    validate
], deleteList);

// ==========================================
// LIST STATUSES
// ==========================================

// Add status to list
router.post('/:id/statuses', [
    param('id').isInt().withMessage('Invalid list ID').toInt(),
    check('name').trim().notEmpty().withMessage('Status name is required').escape(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('sortOrder').optional().isInt(),
    check('isDefault').optional().isBoolean(),
    check('isClosed').optional().isBoolean(),
    validate
], updateListStatus);

// Update status
router.put('/:id/statuses/:statusId', [
    param('id').isInt().withMessage('Invalid list ID').toInt(),
    param('statusId').isInt().withMessage('Invalid status ID').toInt(),
    check('name').optional().trim().notEmpty().escape(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('sortOrder').optional().isInt(),
    check('isDefault').optional().isBoolean(),
    check('isClosed').optional().isBoolean(),
    validate
], updateListStatus);

// Delete status
router.delete('/:id/statuses/:statusId', [
    param('id').isInt().withMessage('Invalid list ID').toInt(),
    param('statusId').isInt().withMessage('Invalid status ID').toInt(),
    query('moveTasksTo').optional().isInt().toInt(),
    validate
], deleteListStatus);

// Reorder lists in a space
router.put('/space/:spaceId/reorder', [
    param('spaceId').isInt().withMessage('Invalid space ID').toInt(),
    body('listIds').isArray().withMessage('listIds must be an array'),
    validate
], reorderLists);

module.exports = router;
