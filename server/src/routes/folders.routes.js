const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getFolders,
    getFolderById,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders
} = require('../controllers/folders.controller');
const { check, param, body } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// FOLDER CRUD
// ==========================================

// Get all folders in a space
router.get('/space/:spaceId', [
    param('spaceId').isInt().withMessage('Invalid space ID').toInt(),
    validate
], getFolders);

// Get folder by ID
router.get('/:id', [
    param('id').isInt().withMessage('Invalid folder ID').toInt(),
    validate
], getFolderById);

// Create folder
router.post('/', [
    check('spaceId').isInt().withMessage('Space ID is required'),
    check('name').trim().notEmpty().withMessage('Folder name is required').escape(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    validate
], createFolder);

// Update folder
router.put('/:id', [
    param('id').isInt().withMessage('Invalid folder ID').toInt(),
    check('name').optional().trim().notEmpty().escape(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('isExpanded').optional().isBoolean(),
    check('sortOrder').optional().isInt(),
    validate
], updateFolder);

// Delete folder
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid folder ID').toInt(),
    validate
], deleteFolder);

// Reorder folders in a space
router.put('/space/:spaceId/reorder', [
    param('spaceId').isInt().withMessage('Invalid space ID').toInt(),
    body('folderIds').isArray().withMessage('folderIds must be an array'),
    validate
], reorderFolders);

module.exports = router;
