const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    // Permissions
    getPermissions,
    getRoleTemplates,
    // Role CRUD
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    // Role activity
    getRoleActivity,
    // Employee assignment
    assignEmployeesToRole,
    removeEmployeeFromRole,
    // Legacy
    updatePermissions,
    getMyPermissions
} = require('../controllers/roles.controller');

router.use(authenticateToken);

// ===== Permissions Endpoints =====

// Get all available permissions - requires roles.view permission
router.get('/permissions', checkPermission('roles.view'), getPermissions);

// Get role templates - requires roles.view permission
router.get('/templates', checkPermission('roles.view'), getRoleTemplates);

// ===== User's Own Permissions =====

// Get my permissions (no permission required - own permissions)
router.get('/me/permissions', getMyPermissions);

// ===== Role CRUD =====

// Get all roles - requires roles.view permission
router.get('/', checkPermission('roles.view'), getRoles);

// Get single role details - requires roles.view permission
router.get('/:id', [
    checkPermission('roles.view'),
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], getRole);

// Create role - requires roles.create permission
router.post('/', [
    checkPermission('roles.create'),
    check('name').trim().notEmpty().withMessage('Role name is required').escape(),
    check('description').optional().trim().escape(),
    check('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
    check('icon').optional().trim().escape(),
    check('isDefault').optional().isBoolean(),
    check('permissions').optional(),
    check('permissionKeys').optional().isArray(),
    validate
], createRole);

// Update role - requires roles.edit permission
router.put('/:id', [
    checkPermission('roles.edit'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('name').optional().trim().notEmpty().withMessage('Role name cannot be empty').escape(),
    check('description').optional().trim(),
    check('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
    check('icon').optional().trim(),
    check('isDefault').optional().isBoolean(),
    check('permissions').optional(),
    check('permissionKeys').optional().isArray(),
    validate
], updateRole);

// Update role permissions only - requires roles.edit permission (legacy)
router.patch('/:id/permissions', [
    checkPermission('roles.edit'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('permissions').notEmpty().withMessage('Permissions object is required'),
    validate
], updatePermissions);

// Delete role - requires roles.delete permission
router.delete('/:id', [
    checkPermission('roles.delete'),
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], deleteRole);

// ===== Role Actions =====

// Duplicate role - requires roles.create permission
router.post('/:id/duplicate', [
    checkPermission('roles.create'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('name').optional().trim().escape(),
    validate
], duplicateRole);

// Get role activity log - requires roles.view permission
router.get('/:id/activity', [
    checkPermission('roles.view'),
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], getRoleActivity);

// ===== Employee Assignment =====

// Assign employees to role - requires roles.edit permission
router.post('/:id/assign-employees', [
    checkPermission('roles.edit'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('employeeIds').isArray().withMessage('Employee IDs must be an array'),
    validate
], assignEmployeesToRole);

// Remove employee from role - requires roles.edit permission
router.post('/:id/remove-employee', [
    checkPermission('roles.edit'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('employeeId').notEmpty().withMessage('Employee ID is required'),
    validate
], removeEmployeeFromRole);

module.exports = router;
