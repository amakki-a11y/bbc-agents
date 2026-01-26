const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getWorkspaces,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addWorkspaceMember,
    updateWorkspaceMember,
    removeWorkspaceMember
} = require('../controllers/workspaces.controller');
const { check, param, query } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// WORKSPACE CRUD
// ==========================================

// Get all workspaces for current user
router.get('/', getWorkspaces);

// Get workspace by ID with spaces
router.get('/:id', [
    param('id').isInt().withMessage('Invalid workspace ID').toInt(),
    validate
], getWorkspaceById);

// Create workspace
router.post('/', [
    check('name').trim().notEmpty().withMessage('Workspace name is required').escape(),
    check('description').optional().trim(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    validate
], createWorkspace);

// Update workspace
router.put('/:id', [
    param('id').isInt().withMessage('Invalid workspace ID').toInt(),
    check('name').optional().trim().notEmpty().escape(),
    check('description').optional().trim(),
    check('icon').optional().isString(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    validate
], updateWorkspace);

// Delete workspace
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid workspace ID').toInt(),
    validate
], deleteWorkspace);

// ==========================================
// WORKSPACE MEMBERS
// ==========================================

// Add member to workspace
router.post('/:id/members', [
    param('id').isInt().withMessage('Invalid workspace ID').toInt(),
    check('employeeId').isString().withMessage('Employee ID is required'),
    check('role').optional().isIn(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']),
    validate
], addWorkspaceMember);

// Update member role
router.patch('/:id/members/:memberId', [
    param('id').isInt().withMessage('Invalid workspace ID').toInt(),
    param('memberId').isInt().withMessage('Invalid member ID').toInt(),
    check('role').isIn(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']).withMessage('Invalid role'),
    validate
], updateWorkspaceMember);

// Remove member from workspace
router.delete('/:id/members/:memberId', [
    param('id').isInt().withMessage('Invalid workspace ID').toInt(),
    param('memberId').isInt().withMessage('Invalid member ID').toInt(),
    validate
], removeWorkspaceMember);

module.exports = router;
