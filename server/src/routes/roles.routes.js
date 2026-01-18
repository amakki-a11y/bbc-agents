const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
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

// Get my permissions
router.get('/me/permissions', getMyPermissions);

// Get all roles
router.get('/', getRoles);

// Get single role
router.get('/:id', [
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], getRole);

// Create role
router.post('/', [
    check('name').trim().notEmpty().withMessage('Role name is required').escape(),
    check('permissions').optional(),
    validate
], createRole);

// Update role
router.put('/:id', [
    check('id').notEmpty().withMessage('Role ID is required'),
    check('name').optional().trim().notEmpty().withMessage('Role name cannot be empty').escape(),
    check('permissions').optional(),
    validate
], updateRole);

// Update role permissions only
router.patch('/:id/permissions', [
    check('id').notEmpty().withMessage('Role ID is required'),
    check('permissions').notEmpty().withMessage('Permissions object is required'),
    validate
], updatePermissions);

// Delete role
router.delete('/:id', [
    check('id').notEmpty().withMessage('Role ID is required'),
    validate
], deleteRole);

module.exports = router;
