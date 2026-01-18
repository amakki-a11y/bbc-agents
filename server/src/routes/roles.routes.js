const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    updatePermissions,
    getMyPermissions
} = require('../controllers/roles.controller');

router.use(authenticateToken);

// Get my permissions (no permission required - own permissions)
router.get('/me/permissions', getMyPermissions);

// Get all roles (no permission required - all authenticated users)
router.get('/', getRoles);

// Get single role (no permission required - all authenticated users)
router.get('/:id', [
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], getRole);

// Create role - requires manage_roles permission
router.post('/', [
    checkPermission('manage_roles'),
    check('name').trim().notEmpty().withMessage('Role name is required').escape(),
    check('permissions').optional(),
    validate
], createRole);

// Update role - requires manage_roles permission
router.put('/:id', [
    checkPermission('manage_roles'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('name').optional().trim().notEmpty().withMessage('Role name cannot be empty').escape(),
    check('permissions').optional(),
    validate
], updateRole);

// Update role permissions only - requires manage_roles permission
router.patch('/:id/permissions', [
    checkPermission('manage_roles'),
    check('id').notEmpty().withMessage('Role ID is required'),
    check('permissions').notEmpty().withMessage('Permissions object is required'),
    validate
], updatePermissions);

// Delete role - requires manage_roles permission
router.delete('/:id', [
    checkPermission('manage_roles'),
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], deleteRole);

module.exports = router;
