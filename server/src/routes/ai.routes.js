const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    handleCommand,
    createProjectPlan,
    createProjectFromPlan,
    assistProject,
    generateSubtasks,
    saveSubtasks,
    scanProjectRisks,
    getRiskSummary,
    toggleMonitoring
} = require('../controllers/ai.controller');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// COMMAND & PLAN ENDPOINTS
// ==========================================

// Parse natural language command
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

// ==========================================
// AI ASSIST ENDPOINTS
// ==========================================

// Get AI assistance for a project (context-aware advice)
router.post('/project/:id/assist', [
    param('id').isInt().withMessage('Invalid project ID'),
    validate
], assistProject);

// Generate subtasks for a task
router.post('/task/:id/subtasks', [
    param('id').isInt().withMessage('Invalid task ID'),
    validate
], generateSubtasks);

// Save generated subtasks to database
router.post('/task/:id/subtasks/save', [
    param('id').isInt().withMessage('Invalid task ID'),
    check('subtasks').isArray({ min: 1 }).withMessage('Subtasks array required'),
    validate
], saveSubtasks);

// ==========================================
// RISK MONITORING ENDPOINTS
// ==========================================

// Get risk summary for all user projects
router.get('/risks/summary', getRiskSummary);

// Scan specific project for risks
router.post('/project/:id/scan', [
    param('id').isInt().withMessage('Invalid project ID'),
    validate
], scanProjectRisks);

// Toggle AI monitoring for a project
router.post('/project/:id/monitoring', [
    param('id').isInt().withMessage('Invalid project ID'),
    check('enabled').isBoolean().withMessage('Enabled must be boolean'),
    validate
], toggleMonitoring);

module.exports = router;
