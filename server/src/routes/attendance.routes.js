const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getAttendance,
    getAttendanceRecord,
    checkIn,
    checkOut,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getMyAttendance,
    getMyTodayStatus,
    getTeamAttendance,
    getAttendanceSummary,
    getTodayStatus
} = require('../controllers/attendance.controller');

router.use(authenticateToken);

// Check in (current user - no permission required)
router.post('/check-in', checkIn);

// Check out (current user - no permission required)
router.post('/check-out', checkOut);

// Get my attendance (no permission required - own attendance)
router.get('/me', getMyAttendance);

// Get my today status (no permission required - own attendance)
router.get('/me/today', getMyTodayStatus);

// Get team attendance (requires manage_attendance permission)
router.get('/team', checkPermission('manage_attendance'), getTeamAttendance);

// Get today's status (dashboard) - requires manage_attendance permission
router.get('/today', checkPermission('manage_attendance'), getTodayStatus);

// Get attendance summary - requires manage_attendance permission
router.get('/summary', [
    checkPermission('manage_attendance'),
    check('start_date').notEmpty().isISO8601().withMessage('Valid start_date is required'),
    check('end_date').notEmpty().isISO8601().withMessage('Valid end_date is required'),
    check('employee_id').optional(),
    check('department_id').optional(),
    validate
], getAttendanceSummary);

// Get all attendance records - requires manage_attendance permission
router.get('/', checkPermission('manage_attendance'), getAttendance);

// Get single attendance record - requires manage_attendance permission
router.get('/:id', [
    checkPermission('manage_attendance'),
    check('id').notEmpty().withMessage('Attendance ID is required'),
    validate
], getAttendanceRecord);

// Create attendance record (admin) - requires manage_attendance permission
router.post('/', [
    checkPermission('manage_attendance'),
    check('employee_id').notEmpty().withMessage('Employee ID is required'),
    check('date').notEmpty().isISO8601().withMessage('Valid date is required'),
    check('check_in').optional().isISO8601().withMessage('Invalid check_in time'),
    check('check_out').optional().isISO8601().withMessage('Invalid check_out time'),
    check('status').optional().isIn(['present', 'late', 'absent', 'on_leave', 'half_day']).withMessage('Invalid status'),
    check('notes').optional().trim().escape(),
    validate
], createAttendance);

// Update/approve attendance record - requires manage_attendance permission
router.put('/:id', [
    checkPermission('manage_attendance'),
    check('id').notEmpty().withMessage('Attendance ID is required'),
    check('check_in').optional().isISO8601().withMessage('Invalid check_in time'),
    check('check_out').optional().isISO8601().withMessage('Invalid check_out time'),
    check('status').optional().isIn(['present', 'late', 'absent', 'on_leave', 'half_day']).withMessage('Invalid status'),
    check('notes').optional().trim().escape(),
    check('approved_by').optional(),
    validate
], updateAttendance);

// Delete attendance record - requires manage_attendance permission
router.delete('/:id', [
    checkPermission('manage_attendance'),
    check('id').notEmpty().withMessage('Attendance ID is required'),
    validate
], deleteAttendance);

module.exports = router;
