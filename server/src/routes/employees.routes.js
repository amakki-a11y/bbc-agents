const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
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

// Get my profile
router.get('/me', getMyProfile);

// Get org hierarchy
router.get('/hierarchy', getHierarchy);

// Get all employees
router.get('/', getEmployees);

// Get single employee
router.get('/:id', [
    check('id').notEmpty().withMessage('Employee ID is required'),
    validate
], getEmployee);

// Create employee
router.post('/', [
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

// Update employee
router.put('/:id', [
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

// Delete employee
router.delete('/:id', [
    check('id').notEmpty().withMessage('Employee ID is required'),
    validate
], deleteEmployee);

module.exports = router;
