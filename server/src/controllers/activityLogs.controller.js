const prisma = require('../lib/prisma');

// Get all activity logs with pagination and filters
const getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const {
            action,
            entityType,
            userId,
            employeeId,
            startDate,
            endDate,
            search
        } = req.query;

        const where = {
            ...(action && { action }),
            ...(entityType && { entity_type: entityType }),
            ...(userId && { user_id: parseInt(userId) }),
            ...(employeeId && { employee_id: employeeId }),
            ...(search && {
                description: { contains: search, mode: 'insensitive' }
            })
        };

        // Handle date range properly
        if (startDate || endDate) {
            where.created_at = {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
            };
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true }
                    },
                    employee: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            error: 'Failed to fetch activity logs',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
            code: error.code
        });
    }
};

// Get logs for a specific entity
const getEntityLogs = async (req, res) => {
    try {
        const { type, id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = {
            entity_type: type,
            entity_id: String(id)
        };

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching entity logs:', error);
        res.status(500).json({ error: 'Failed to fetch entity logs' });
    }
};

// Get logs for a specific user
const getUserLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = { user_id: parseInt(userId) };

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user logs:', error);
        res.status(500).json({ error: 'Failed to fetch user logs' });
    }
};

// Get activity statistics
const getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.created_at = {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
            };
        }

        // Get counts by action type
        const actionCounts = await prisma.activityLog.groupBy({
            by: ['action'],
            where: dateFilter,
            _count: { action: true }
        });

        // Get counts by entity type
        const entityCounts = await prisma.activityLog.groupBy({
            by: ['entity_type'],
            where: dateFilter,
            _count: { entity_type: true }
        });

        // Get recent activity count (last 24 hours)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCount = await prisma.activityLog.count({
            where: { created_at: { gte: last24Hours } }
        });

        // Get total count
        const totalCount = await prisma.activityLog.count({ where: dateFilter });

        res.json({
            total: totalCount,
            recentCount,
            byAction: actionCounts.reduce((acc, item) => {
                acc[item.action] = item._count.action;
                return acc;
            }, {}),
            byEntityType: entityCounts.reduce((acc, item) => {
                acc[item.entity_type] = item._count.entity_type;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({ error: 'Failed to fetch activity statistics' });
    }
};

// Export logs to CSV format
const exportLogs = async (req, res) => {
    try {
        const { startDate, endDate, action, entityType } = req.query;

        const where = {
            ...(action && { action }),
            ...(entityType && { entity_type: entityType })
        };

        if (startDate || endDate) {
            where.created_at = {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
            };
        }

        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 10000, // Limit export to 10k records
            include: {
                user: { select: { email: true } },
                employee: { select: { name: true } }
            }
        });

        // Build CSV
        const headers = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Description', 'User Email', 'Employee Name', 'IP Address'];
        const rows = logs.map(log => [
            log.id,
            log.created_at.toISOString(),
            log.action,
            log.entity_type,
            log.entity_id || '',
            `"${(log.description || '').replace(/"/g, '""')}"`,
            log.user?.email || '',
            log.employee?.name || '',
            log.ip_address || ''
        ]);

        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({ error: 'Failed to export logs' });
    }
};

// Test endpoint to manually create an activity log (for debugging)
const testLog = async (req, res) => {
    try {
        console.log('[ActivityLogs] Test log endpoint called by user:', req.user?.userId);

        const log = await prisma.activityLog.create({
            data: {
                user_id: req.user?.userId || null,
                action: 'test',
                entity_type: 'system',
                description: 'Test activity log entry',
                ip_address: req.ip || null,
                user_agent: req.headers?.['user-agent'] || null
            }
        });

        console.log('[ActivityLogs] Test log created:', log.id);
        res.json({ success: true, log });
    } catch (error) {
        console.error('[ActivityLogs] Test log failed:', error);
        res.status(500).json({
            error: 'Failed to create test log',
            details: error.message,
            code: error.code
        });
    }
};

// Diagnostic endpoint to check database status
const diagnose = async (req, res) => {
    const results = {
        timestamp: new Date().toISOString(),
        checks: {}
    };

    // Check 1: Can we count logs?
    try {
        const count = await prisma.activityLog.count();
        results.checks.tableExists = { success: true, count };
    } catch (error) {
        results.checks.tableExists = {
            success: false,
            error: error.message,
            code: error.code
        };
    }

    // Check 2: Can we write a log?
    try {
        const testLog = await prisma.activityLog.create({
            data: {
                user_id: req.user?.userId || null,
                action: 'diagnostic',
                entity_type: 'system',
                description: 'Diagnostic test entry'
            }
        });
        results.checks.canWrite = { success: true, logId: testLog.id };
    } catch (error) {
        results.checks.canWrite = {
            success: false,
            error: error.message,
            code: error.code
        };
    }

    // Check 3: Can we read logs?
    try {
        const logs = await prisma.activityLog.findMany({ take: 5, orderBy: { created_at: 'desc' } });
        results.checks.canRead = { success: true, recentLogs: logs.length };
    } catch (error) {
        results.checks.canRead = {
            success: false,
            error: error.message,
            code: error.code
        };
    }

    // Overall status
    results.allPassing = Object.values(results.checks).every(c => c.success);

    res.json(results);
};

module.exports = {
    getLogs,
    getEntityLogs,
    getUserLogs,
    getStats,
    exportLogs,
    testLog,
    diagnose
};
