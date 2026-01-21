const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { handleCommand, createProjectPlan, createProjectFromPlan } = require('../controllers/ai.controller');
const { check } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// Existing command endpoint
router.post('/command', [
    check('command').trim().notEmpty().withMessage('Command is required'),
    validate
], handleCommand);

// Generate project plan from goal
router.post('/plan', [
    check('goal').trim().notEmpty().withMessage('Goal is required')
        .isLength({ min: 5 }).withMessage('Goal must be at least 5 characters'),
    validate
], createProjectPlan);

// Create project from AI-generated plan
router.post('/plan/create', [
    check('plan').notEmpty().withMessage('Plan is required'),
    check('plan.name').notEmpty().withMessage('Plan name is required'),
    check('plan.tasks').isArray({ min: 1 }).withMessage('Plan must have at least one task'),
    validate
], createProjectFromPlan);

module.exports = router;
