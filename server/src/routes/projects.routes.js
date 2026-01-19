const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    createProject,
    getProjects,
    getProjectDetails,
    updateProject,
    archiveProject,
    deleteProject
} = require('../controllers/projects.controller');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// Get all projects
router.get('/', getProjects);

// Create new project
router.post('/', [
    check('name').trim().notEmpty().withMessage('Project name is required').escape(),
    check('description').optional().trim(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    validate
], createProject);

// Get project details
router.get('/:id', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    validate
], getProjectDetails);

// Update project
router.put('/:id', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    check('name').optional().trim().notEmpty().escape(),
    check('description').optional().trim(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    validate
], updateProject);

// Archive/unarchive project
router.patch('/:id/archive', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    check('archived').optional().isBoolean().withMessage('Archived must be a boolean'),
    validate
], archiveProject);

// Delete project
router.delete('/:id', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    check('moveTasks').optional().isInt().withMessage('moveTasks must be a valid project ID'),
    validate
], deleteProject);

module.exports = router;
