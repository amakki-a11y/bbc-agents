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
const aiRoutes = require('../ai.routes');
const userRoutes = require('../users.routes');
const automationRoutes = require('../automation.routes');

// Workspace hierarchy routes
const workspaceRoutes = require('../workspaces.routes');
const spaceRoutes = require('../spaces.routes');
const folderRoutes = require('../folders.routes');
const listRoutes = require('../lists.routes');
const listTaskRoutes = require('../listTasks.routes');

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
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/automation', automationRoutes);

// Workspace hierarchy routes
router.use('/workspaces', workspaceRoutes);
router.use('/spaces', spaceRoutes);
router.use('/folders', folderRoutes);
router.use('/lists', listRoutes);
router.use('/list-tasks', listTaskRoutes);

module.exports = router;
