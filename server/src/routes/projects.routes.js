const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    createProject,
    getProjects,
    getProjectDetails,
    updateProject,
    archiveProject,
    deleteProject,
    getProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember
} = require('../controllers/projects.controller');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// PROJECT CRUD
// ==========================================

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

// ==========================================
// PROJECT MEMBERS (Sharing)
// ==========================================

// Get project members
router.get('/:id/members', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    validate
], getProjectMembers);

// Add project member
router.post('/:id/members', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    check('userId').isInt().withMessage('User ID is required'),
    check('role').optional().isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role'),
    validate
], addProjectMember);

// Update project member role
router.patch('/:id/members/:memberId', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    param('memberId').isInt().withMessage('Invalid member ID').toInt(),
    check('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role'),
    validate
], updateProjectMember);

// Remove project member
router.delete('/:id/members/:memberId', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    param('memberId').isInt().withMessage('Invalid member ID').toInt(),
    validate
], removeProjectMember);

module.exports = router;
