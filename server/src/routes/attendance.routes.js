const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
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
    getAttendanceSummary,
    getTodayStatus
} = require('../controllers/attendance.controller');

router.use(authenticateToken);

// Check in (current user)
router.post('/check-in', checkIn);

// Check out (current user)
router.post('/check-out', checkOut);

// Get my attendance
router.get('/me', getMyAttendance);

// Get today's status (dashboard)
router.get('/today', getTodayStatus);

// Get attendance summary
router.get('/summary', [
    check('start_date').notEmpty().isISO8601().withMessage('Valid start_date is required'),
    check('end_date').notEmpty().isISO8601().withMessage('Valid end_date is required'),
    check('employee_id').optional(),
    check('department_id').optional(),
    validate
], getAttendanceSummary);

// Get all attendance records
router.get('/', getAttendance);

// Get single attendance record
router.get('/:id', [
    check('id').notEmpty().withMessage('Attendance ID is required'),
    validate
], getAttendanceRecord);

// Create attendance record (admin)
router.post('/', [
    check('employee_id').notEmpty().withMessage('Employee ID is required'),
    check('date').notEmpty().isISO8601().withMessage('Valid date is required'),
    check('check_in').optional().isISO8601().withMessage('Invalid check_in time'),
    check('check_out').optional().isISO8601().withMessage('Invalid check_out time'),
    check('status').optional().isIn(['present', 'late', 'absent', 'on_leave', 'half_day']).withMessage('Invalid status'),
    check('notes').optional().trim().escape(),
    validate
], createAttendance);

// Update attendance record
router.put('/:id', [
    check('id').notEmpty().withMessage('Attendance ID is required'),
    check('check_in').optional().isISO8601().withMessage('Invalid check_in time'),
    check('check_out').optional().isISO8601().withMessage('Invalid check_out time'),
    check('status').optional().isIn(['present', 'late', 'absent', 'on_leave', 'half_day']).withMessage('Invalid status'),
    check('notes').optional().trim().escape(),
    check('approved_by').optional(),
    validate
], updateAttendance);

// Delete attendance record
router.delete('/:id', [
    check('id').notEmpty().withMessage('Attendance ID is required'),
    validate
], deleteAttendance);

module.exports = router;
