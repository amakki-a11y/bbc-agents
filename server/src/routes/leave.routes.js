const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    getLeaves,
    getMyLeaves,
    getTeamLeaves,
    getPendingApprovals,
    requestLeave,
    updateLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getMyBalance,
    getEmployeeBalance,
    getLeaveCalendar,
    initializeBalances
} = require('../controllers/leave.controller');

// All routes require authentication
router.use(authenticateToken);

// ============ Leave Types ============

// Get all leave types (any authenticated user)
router.get('/types', getLeaveTypes);

// Create leave type (requires manage_leave permission)
router.post('/types', [
    checkPermission('manage_leave'),
    check('name').notEmpty().withMessage('Name is required'),
    check('days_allowed').optional().isInt({ min: 0 }).withMessage('Days allowed must be a non-negative integer'),
    check('color').optional().isHexColor().withMessage('Invalid color format'),
    validate
], createLeaveType);

// Update leave type (requires manage_leave permission)
router.put('/types/:id', [
    checkPermission('manage_leave'),
    check('name').optional().notEmpty().withMessage('Name cannot be empty'),
    check('days_allowed').optional().isInt({ min: 0 }).withMessage('Days allowed must be a non-negative integer'),
    check('color').optional().isHexColor().withMessage('Invalid color format'),
    validate
], updateLeaveType);

// Delete leave type (requires manage_leave permission)
router.delete('/types/:id', [
    checkPermission('manage_leave')
], deleteLeaveType);

// ============ Leave Requests ============

// Get my leaves (any authenticated employee)
router.get('/my', getMyLeaves);

// Get my balance (any authenticated employee)
router.get('/balance', getMyBalance);

// Get leave calendar
router.get('/calendar', getLeaveCalendar);

// Get team leaves (for managers)
router.get('/team', getTeamLeaves);

// Get pending approvals (for managers)
router.get('/pending', getPendingApprovals);

// Get all leaves (requires manage_leave permission)
router.get('/', checkPermission('manage_leave'), getLeaves);

// Get employee balance (requires manage_leave permission or manager)
router.get('/balance/:employeeId', getEmployeeBalance);

// Request leave (any authenticated employee)
router.post('/', [
    check('leave_type_id').notEmpty().withMessage('Leave type is required'),
    check('start_date').notEmpty().isISO8601().withMessage('Valid start date is required'),
    check('end_date').notEmpty().isISO8601().withMessage('Valid end date is required'),
    check('reason').optional().trim(),
    validate
], requestLeave);

// Update leave request (owner only, pending only)
router.put('/:id', [
    check('leave_type_id').optional().notEmpty(),
    check('start_date').optional().isISO8601().withMessage('Invalid start date'),
    check('end_date').optional().isISO8601().withMessage('Invalid end date'),
    check('reason').optional().trim(),
    validate
], updateLeave);

// Approve leave (manager or HR)
router.post('/:id/approve', approveLeave);

// Reject leave (manager or HR)
router.post('/:id/reject', [
    check('reason').optional().trim(),
    validate
], rejectLeave);

// Cancel leave (owner only)
router.post('/:id/cancel', cancelLeave);

// Initialize balances for a year (requires manage_leave permission)
router.post('/init-balances', [
    checkPermission('manage_leave'),
    check('year').optional().isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
    validate
], initializeBalances);

module.exports = router;
