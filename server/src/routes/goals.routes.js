const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalStats
} = require('../controllers/goals.controller');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// Get goal statistics
router.get('/stats', getGoalStats);

// Get all goals
router.get('/', getGoals);

// Get single goal
router.get('/:id', [
    param('id').isInt().withMessage('Invalid goal ID').toInt(),
    validate
], getGoalById);

// Create goal
router.post('/', [
    check('title').trim().notEmpty().withMessage('Title is required'),
    check('targetValue').isFloat({ min: 0 }).withMessage('Target value must be a positive number'),
    check('unit').notEmpty().withMessage('Unit is required'),
    check('ownerType').isIn(['employee', 'department', 'company']).withMessage('Invalid owner type'),
    check('dueDate').isISO8601().withMessage('Valid due date is required'),
    validate
], createGoal);

// Update goal
router.put('/:id', [
    param('id').isInt().withMessage('Invalid goal ID').toInt(),
    check('title').optional().trim().notEmpty(),
    check('targetValue').optional().isFloat({ min: 0 }),
    check('currentValue').optional().isFloat({ min: 0 }),
    check('status').optional().isIn(['active', 'completed', 'at_risk', 'failed']),
    validate
], updateGoal);

// Delete goal
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid goal ID').toInt(),
    validate
], deleteGoal);

module.exports = router;
