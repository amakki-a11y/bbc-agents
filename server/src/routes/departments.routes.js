const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
} = require('../controllers/departments.controller');

router.use(authenticateToken);

// Get all departments - requires departments.view permission
router.get('/', checkPermission('departments.view'), getDepartments);

// Get department stats - requires departments.view permission
router.get('/stats', checkPermission('departments.view'), getDepartmentStats);

// Get single department - requires departments.view permission
router.get('/:id', [
    checkPermission('departments.view'),
    check('id').notEmpty().withMessage('Department ID is required'),
    validate
], getDepartment);

// Create department - requires manage_departments permission
router.post('/', [
    checkPermission('manage_departments'),
    check('name').trim().notEmpty().withMessage('Department name is required').escape(),
    check('description').optional().trim().escape(),
    validate
], createDepartment);

// Update department - requires manage_departments permission
router.put('/:id', [
    checkPermission('manage_departments'),
    check('id').notEmpty().withMessage('Department ID is required'),
    check('name').optional().trim().notEmpty().withMessage('Department name cannot be empty').escape(),
    check('description').optional().trim().escape(),
    validate
], updateDepartment);

// Delete department - requires manage_departments permission
router.delete('/:id', [
    checkPermission('manage_departments'),
    check('id').notEmpty().withMessage('Department ID is required'),
    validate
], deleteDepartment);

module.exports = router;
