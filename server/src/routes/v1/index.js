const express = require('express');
const router = express.Router();

// Import all route modules
const dataRoutes = require('../data.routes');
const detailedTaskRoutes = require('../detailed_task.routes');
const projectRoutes = require('../projects.routes');
const templateRoutes = require('../templates.routes');
const departmentRoutes = require('../departments.routes');
const employeeRoutes = require('../employees.routes');
const attendanceRoutes = require('../attendance.routes');
const roleRoutes = require('../roles.routes');
const leaveRoutes = require('../leave.routes');
const botRoutes = require('../ai_bot.routes');
const goalRoutes = require('../goals.routes');
const messageRoutes = require('../messaging.routes');
const documentRoutes = require('../documents.routes');
const activityLogRoutes = require('../activityLogs.routes');
const agentActionsRoutes = require('../agentActions.routes');

// Mount all routes under /api/v1
router.use('/', dataRoutes);
router.use('/tasks/details', detailedTaskRoutes);
router.use('/projects', projectRoutes);
router.use('/templates', templateRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/roles', roleRoutes);
router.use('/leave', leaveRoutes);
router.use('/bot', botRoutes);
router.use('/goals', goalRoutes);
router.use('/messages', messageRoutes);
router.use('/documents', documentRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/agent-actions', agentActionsRoutes);

module.exports = router;
