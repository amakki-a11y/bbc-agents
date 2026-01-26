const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
    triggerOnboarding,
    triggerOffboarding,
    triggerQuarterlyReview,
    checkDeadlineReminders,
    checkOverdueTasks,
    autoCompleteProjects,
    generateProjectSuggestions,
    PROJECT_TEMPLATES
} = require('../services/projectAutomation');

router.use(authenticateToken);

// ==========================================
// AUTOMATION TRIGGERS
// ==========================================

/**
 * Trigger employee onboarding project
 * POST /api/automation/onboarding/:employeeId
 */
router.post('/onboarding/:employeeId', [
    checkPermission('projects.create'),
    param('employeeId').notEmpty().withMessage('Employee ID is required'),
    validate
], async (req, res) => {
    try {
        const { employeeId } = req.params;
        const triggeredBy = req.employee?.id || req.userId;

        const project = await triggerOnboarding(employeeId, triggeredBy);

        res.status(201).json({
            success: true,
            message: 'Onboarding project created successfully',
            project
        });
    } catch (error) {
        console.error('Onboarding trigger error:', error);
        res.status(500).json({ error: error.message || 'Failed to create onboarding project' });
    }
});

/**
 * Trigger employee offboarding project
 * POST /api/automation/offboarding/:employeeId
 */
router.post('/offboarding/:employeeId', [
    checkPermission('projects.create'),
    param('employeeId').notEmpty().withMessage('Employee ID is required'),
    validate
], async (req, res) => {
    try {
        const { employeeId } = req.params;
        const triggeredBy = req.employee?.id || req.userId;

        const project = await triggerOffboarding(employeeId, triggeredBy);

        res.status(201).json({
            success: true,
            message: 'Offboarding project created successfully',
            project
        });
    } catch (error) {
        console.error('Offboarding trigger error:', error);
        res.status(500).json({ error: error.message || 'Failed to create offboarding project' });
    }
});

/**
 * Trigger quarterly review project for a department
 * POST /api/automation/quarterly-review/:departmentId
 */
router.post('/quarterly-review/:departmentId', [
    checkPermission('projects.create'),
    param('departmentId').notEmpty().withMessage('Department ID is required'),
    validate
], async (req, res) => {
    try {
        const { departmentId } = req.params;
        const triggeredBy = req.employee?.id || req.userId;

        const project = await triggerQuarterlyReview(departmentId, triggeredBy);

        res.status(201).json({
            success: true,
            message: 'Quarterly review project created successfully',
            project
        });
    } catch (error) {
        console.error('Quarterly review trigger error:', error);
        res.status(500).json({ error: error.message || 'Failed to create quarterly review project' });
    }
});

// ==========================================
// SCHEDULED TASKS (can be called by cron jobs)
// ==========================================

/**
 * Run deadline reminder checks
 * POST /api/automation/check-deadlines
 */
router.post('/check-deadlines', [
    checkPermission('system.audit_logs') // Admin only
], async (req, res) => {
    try {
        const count = await checkDeadlineReminders();
        res.json({
            success: true,
            message: `Checked deadlines, sent ${count} reminders`
        });
    } catch (error) {
        console.error('Deadline check error:', error);
        res.status(500).json({ error: 'Failed to check deadlines' });
    }
});

/**
 * Run overdue task checks
 * POST /api/automation/check-overdue
 */
router.post('/check-overdue', [
    checkPermission('system.audit_logs') // Admin only
], async (req, res) => {
    try {
        const count = await checkOverdueTasks();
        res.json({
            success: true,
            message: `Found ${count} overdue tasks`
        });
    } catch (error) {
        console.error('Overdue check error:', error);
        res.status(500).json({ error: 'Failed to check overdue tasks' });
    }
});

/**
 * Run auto-complete projects check
 * POST /api/automation/auto-complete
 */
router.post('/auto-complete', [
    checkPermission('system.audit_logs') // Admin only
], async (req, res) => {
    try {
        const count = await autoCompleteProjects();
        res.json({
            success: true,
            message: `Auto-completed ${count} projects`
        });
    } catch (error) {
        console.error('Auto-complete error:', error);
        res.status(500).json({ error: 'Failed to auto-complete projects' });
    }
});

/**
 * Run all scheduled automation tasks
 * POST /api/automation/run-all
 */
router.post('/run-all', [
    checkPermission('system.audit_logs') // Admin only
], async (req, res) => {
    try {
        const results = {
            deadlineReminders: await checkDeadlineReminders(),
            overdueTasks: await checkOverdueTasks(),
            autoCompleted: await autoCompleteProjects()
        };

        res.json({
            success: true,
            message: 'All automation tasks completed',
            results
        });
    } catch (error) {
        console.error('Run all automation error:', error);
        res.status(500).json({ error: 'Failed to run automation tasks' });
    }
});

// ==========================================
// SUGGESTIONS & TEMPLATES
// ==========================================

/**
 * Get AI-powered project suggestions for current user
 * GET /api/automation/suggestions
 */
router.get('/suggestions', async (req, res) => {
    try {
        const userId = req.employee?.id || req.userId;
        const suggestions = await generateProjectSuggestions(userId);

        res.json(suggestions);
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

/**
 * Get available project templates
 * GET /api/automation/templates
 */
router.get('/templates', (req, res) => {
    const templates = Object.entries(PROJECT_TEMPLATES).map(([key, template]) => ({
        id: key,
        name: template.name.replace(/\{.*?\}/g, '...'),
        description: template.description.replace(/\{.*?\}/g, '...'),
        taskCount: template.tasks.length,
        priority: template.priority
    }));

    res.json(templates);
});

module.exports = router;
