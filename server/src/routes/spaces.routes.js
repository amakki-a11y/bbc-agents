const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getSpaces,
    getSpaceById,
    createSpace,
    updateSpace,
    deleteSpace,
    addSpaceMember,
    removeSpaceMember
} = require('../controllers/spaces.controller');
const { check, param, query } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// SPACE CRUD
// ==========================================

// Get all spaces in a workspace
router.get('/workspace/:workspaceId', [
    param('workspaceId').isInt().withMessage('Invalid workspace ID').toInt(),
    validate
], getSpaces);

// Get space by ID with folders and lists
router.get('/:id', [
    param('id').isInt().withMessage('Invalid space ID').toInt(),
    validate
], getSpaceById);

// Create space
router.post('/', [
    check('workspaceId').isInt().withMessage('Workspace ID is required'),
    check('name').trim().notEmpty().withMessage('Space name is required').escape(),
    check('description').optional().trim(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('departmentId').optional().isString(),
    check('isPrivate').optional().isBoolean(),
    validate
], createSpace);

// Update space
router.put('/:id', [
    param('id').isInt().withMessage('Invalid space ID').toInt(),
    check('name').optional().trim().notEmpty().escape(),
    check('description').optional().trim(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('departmentId').optional().isString(),
    check('isPrivate').optional().isBoolean(),
    validate
], updateSpace);

// Delete space
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid space ID').toInt(),
    validate
], deleteSpace);

// ==========================================
// SPACE MEMBERS
// ==========================================

// Add member to space
router.post('/:id/members', [
    param('id').isInt().withMessage('Invalid space ID').toInt(),
    check('employeeId').isString().withMessage('Employee ID is required'),
    check('role').optional().isIn(['ADMIN', 'MEMBER', 'GUEST']),
    validate
], addSpaceMember);

// Remove member from space
router.delete('/:id/members/:memberId', [
    param('id').isInt().withMessage('Invalid space ID').toInt(),
    param('memberId').isInt().withMessage('Invalid member ID').toInt(),
    validate
], removeSpaceMember);

module.exports = router;
