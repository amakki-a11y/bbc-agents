const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getHierarchy,
    getMyProfile
} = require('../controllers/employees.controller');

router.use(authenticateToken);

// Get my profile (no permission required - own profile)
router.get('/me', getMyProfile);

// Get org hierarchy (no permission required - all authenticated users)
router.get('/hierarchy', getHierarchy);

// Get all employees (no permission required - all authenticated users)
router.get('/', getEmployees);

// Get single employee (no permission required - all authenticated users)
router.get('/:id', [
    check('id').notEmpty().withMessage('Employee ID is required'),
    validate
], getEmployee);

// Create employee - requires manage_employees permission
router.post('/', [
    checkPermission('manage_employees'),
    check('user_id').isInt().withMessage('Valid user_id is required'),
    check('name').trim().notEmpty().withMessage('Name is required').escape(),
    check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    check('phone').optional().trim().escape(),
    check('department_id').notEmpty().withMessage('Department ID is required'),
    check('role_id').notEmpty().withMessage('Role ID is required'),
    check('manager_id').optional(),
    check('hire_date').optional().isISO8601().withMessage('Invalid hire date').toDate(),
    check('status').optional().isIn(['active', 'on_leave', 'terminated']).withMessage('Invalid status'),
    validate
], createEmployee);

// Update employee - requires manage_employees permission
router.put('/:id', [
    checkPermission('manage_employees'),
    check('id').notEmpty().withMessage('Employee ID is required'),
    check('name').optional().trim().notEmpty().withMessage('Name cannot be empty').escape(),
    check('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    check('phone').optional().trim().escape(),
    check('department_id').optional(),
    check('role_id').optional(),
    check('manager_id').optional(),
    check('hire_date').optional().isISO8601().withMessage('Invalid hire date').toDate(),
    check('status').optional().isIn(['active', 'on_leave', 'terminated']).withMessage('Invalid status'),
    validate
], updateEmployee);

// Delete employee - requires manage_employees permission
router.delete('/:id', [
    checkPermission('manage_employees'),
    check('id').notEmpty().withMessage('Employee ID is required'),
    validate
], deleteEmployee);

module.exports = router;
