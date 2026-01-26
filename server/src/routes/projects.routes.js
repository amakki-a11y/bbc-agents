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
    approveProject,
    rejectProject,
    shareProject,
    removeProjectShare,
    getProjectShares,
    getProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    getProjectActivities
} = require('../controllers/projects.controller');
const { check, param, query } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// ==========================================
// PROJECT CRUD
// ==========================================

// Get all projects
router.get('/', [
    query('includeArchived').optional().isBoolean(),
    query('status').optional().isIn(['all', 'DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED', 'CANCELLED']),
    query('priority').optional().isIn(['all', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    query('showAIGenerated').optional().isBoolean(),
    query('showPendingApproval').optional().isBoolean(),
    validate
], getProjects);

// Create new project
router.post('/', [
    check('name').trim().notEmpty().withMessage('Project name is required').escape(),
    check('description').optional().trim(),
    check('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    check('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    check('status').optional().isIn(['DRAFT', 'ACTIVE', 'ON_HOLD']),
    check('startDate').optional().isISO8601(),
    check('dueDate').optional().isISO8601(),
    check('departmentId').optional().isString(),
    check('isAIGenerated').optional().isBoolean(),
    check('aiGeneratedBy').optional().isString(),
    check('tasks').optional().isArray(),
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
    check('status').optional().isIn(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED', 'CANCELLED']),
    check('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    check('startDate').optional(),
    check('dueDate').optional(),
    check('departmentId').optional(),
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
// AI PROJECT APPROVAL
// ==========================================

// Approve AI-generated project
router.post('/:id/approve', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    validate
], approveProject);

// Reject AI-generated project
router.post('/:id/reject', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    check('reason').optional().isString(),
    validate
], rejectProject);

// ==========================================
// PROJECT SHARING (ProjectShare - Employee/Role/Department based)
// ==========================================

// Get project shares
router.get('/:id/shares', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    validate
], getProjectShares);

// Share project with user, role, or department
router.post('/:id/share', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    check('userId').optional().isString(),
    check('roleId').optional().isString(),
    check('departmentId').optional().isString(),
    check('permission').optional().isIn(['VIEWER', 'EDITOR', 'ADMIN']),
    validate
], shareProject);

// Remove project share
router.delete('/:id/share/:shareId', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    param('shareId').isInt().withMessage('Invalid share ID').toInt(),
    validate
], removeProjectShare);

// ==========================================
// PROJECT MEMBERS (Legacy - User-based sharing)
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

// ==========================================
// PROJECT ACTIVITIES
// ==========================================

// Get project activity log
router.get('/:id/activities', [
    param('id').isInt().withMessage('Invalid project ID').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    validate
], getProjectActivities);

module.exports = router;
