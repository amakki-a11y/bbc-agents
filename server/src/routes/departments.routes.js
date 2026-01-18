const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
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

// Get all departments
router.get('/', getDepartments);

// Get department stats
router.get('/stats', getDepartmentStats);

// Get single department
router.get('/:id', [
    check('id').notEmpty().withMessage('Department ID is required'),
    validate
], getDepartment);

// Create department
router.post('/', [
    check('name').trim().notEmpty().withMessage('Department name is required').escape(),
    check('description').optional().trim().escape(),
    validate
], createDepartment);

// Update department
router.put('/:id', [
    check('id').notEmpty().withMessage('Department ID is required'),
    check('name').optional().trim().notEmpty().withMessage('Department name cannot be empty').escape(),
    check('description').optional().trim().escape(),
    validate
], updateDepartment);

// Delete department
router.delete('/:id', [
    check('id').notEmpty().withMessage('Department ID is required'),
    validate
], deleteDepartment);

module.exports = router;
