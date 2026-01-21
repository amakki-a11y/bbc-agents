/**
 * Risk Monitor Service - "Risk Radar"
 * Scans active projects for delays, risks, and issues
 * Creates notifications and logs all decisions via AgentLogger
 */

const prisma = require('../lib/prisma');
const agentLogger = require('./agentLogger');

const AGENT_NAME = 'RiskGuardian';

/**
 * Calculate risk level based on overdue tasks and project health
 */
const calculateRiskLevel = (overdueTasks, totalTasks, avgDaysOverdue) => {
    if (totalTasks === 0) return { level: 'low', score: 100 };

    const overdueRatio = overdueTasks / totalTasks;
    let level = 'low';
    let score = 100;

    if (overdueRatio > 0.5 || avgDaysOverdue > 14) {
        level = 'critical';
        score = Math.max(0, 25 - (avgDaysOverdue * 2));
    } else if (overdueRatio > 0.3 || avgDaysOverdue > 7) {
        level = 'high';
        score = Math.max(25, 50 - (avgDaysOverdue * 3));
    } else if (overdueRatio > 0.1 || avgDaysOverdue > 3) {
        level = 'medium';
        score = Math.max(50, 75 - (avgDaysOverdue * 2));
    } else if (overdueTasks > 0) {
        level = 'low';
        score = Math.max(75, 90 - (overdueTasks * 5));
    }

    return { level, score: Math.round(score) };
};

/**
 * Scan a single project for risks and delays
 */
const scanProjectForRisks = async (project) => {
    const now = new Date();

    // Find overdue tasks (status != 'done' AND due_date < NOW)
    const overdueTasks = await prisma.task.findMany({
        where: {
            project_id: project.id,
            status: { not: 'done' },
            due_date: { lt: now }
        },
        orderBy: { due_date: 'asc' }
    });

    // Get total active tasks
    const totalTasks = await prisma.task.count({
        where: {
            project_id: project.id,
            status: { not: 'done' }
        }
    });

    // Calculate average days overdue
    const avgDaysOverdue = overdueTasks.length > 0
        ? overdueTasks.reduce((sum, task) => {
            const daysOverdue = Math.ceil((now - new Date(task.due_date)) / (1000 * 60 * 60 * 24));
            return sum + daysOverdue;
        }, 0) / overdueTasks.length
        : 0;

    const { level, score } = calculateRiskLevel(overdueTasks.length, totalTasks, avgDaysOverdue);

    return {
        project,
        overdueTasks,
        totalActiveTasks: totalTasks,
        avgDaysOverdue: Math.round(avgDaysOverdue),
        riskLevel: level,
        healthScore: score
    };
};

/**
 * Create notification for project owner about delays
 */
const createDelayNotification = async (project, overdueTasks, riskLevel) => {
    const taskTitles = overdueTasks.slice(0, 3).map(t => t.title).join(', ');
    const moreText = overdueTasks.length > 3 ? ` and ${overdueTasks.length - 3} more` : '';

    const message = riskLevel === 'critical'
        ? `CRITICAL: "${project.name}" has ${overdueTasks.length} overdue tasks: ${taskTitles}${moreText}. Immediate action required!`
        : riskLevel === 'high'
            ? `Alert: "${project.name}" has ${overdueTasks.length} overdue tasks that need attention: ${taskTitles}${moreText}`
            : `Reminder: "${project.name}" has ${overdueTasks.length} task(s) past due date: ${taskTitles}${moreText}`;

    const notification = await prisma.notification.create({
        data: {
            type: `risk_${riskLevel}`,
            message,
            user_id: project.user_id,
            project_id: project.id,
            task_id: overdueTasks[0]?.id || null
        }
    });

    return notification;
};

/**
 * Main scan function - scans all projects with AI monitoring enabled
 */
const scanAllProjects = async () => {
    const startTime = Date.now();

    try {
        // Find all projects with AI monitoring enabled (or all active projects)
        const projects = await prisma.project.findMany({
            where: {
                archived: false,
                ai_monitoring_enabled: true
            },
            include: {
                user: { select: { id: true, email: true } }
            }
        });

        console.log(`[RiskGuardian] Scanning ${projects.length} projects...`);

        const results = {
            scanned: 0,
            alerts: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        for (const project of projects) {
            const scan = await scanProjectForRisks(project);
            results.scanned++;
            results[scan.riskLevel]++;

            // Update project's AI monitoring data
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    last_ai_check: new Date(),
                    ai_risk_level: scan.riskLevel,
                    ai_health_score: scan.healthScore
                }
            });

            // If there are overdue tasks, create notification and log
            if (scan.overdueTasks.length > 0) {
                results.alerts++;

                // Create notification
                const notification = await createDelayNotification(
                    project,
                    scan.overdueTasks,
                    scan.riskLevel
                );

                // Log the agent action
                await agentLogger.logSuccess(
                    AGENT_NAME,
                    'flag_delay',
                    'project',
                    project.id,
                    `Flagged ${scan.overdueTasks.length} overdue tasks in "${project.name}". Risk level: ${scan.riskLevel.toUpperCase()}. Health score: ${scan.healthScore}/100`,
                    scan.riskLevel === 'critical' ? 0.95 : scan.riskLevel === 'high' ? 0.85 : 0.75,
                    {
                        inputContext: {
                            projectId: project.id,
                            projectName: project.name,
                            ownerId: project.user_id
                        },
                        outputData: {
                            overdueTasks: scan.overdueTasks.map(t => ({
                                id: t.id,
                                title: t.title,
                                dueDate: t.due_date
                            })),
                            riskLevel: scan.riskLevel,
                            healthScore: scan.healthScore,
                            notificationId: notification.id
                        },
                        executionTime: Date.now() - startTime
                    }
                );
            }
        }

        const executionTime = Date.now() - startTime;

        // Log summary
        await agentLogger.logSuccess(
            AGENT_NAME,
            'scan_complete',
            'system',
            null,
            `Completed risk scan of ${results.scanned} projects. Found ${results.alerts} projects with delays. Critical: ${results.critical}, High: ${results.high}, Medium: ${results.medium}`,
            0.95,
            {
                outputData: results,
                executionTime
            }
        );

        console.log(`[RiskGuardian] Scan complete in ${executionTime}ms. Alerts: ${results.alerts}`);
        return results;

    } catch (error) {
        const executionTime = Date.now() - startTime;

        await agentLogger.logFailure(
            AGENT_NAME,
            'scan_complete',
            'system',
            'Risk scan failed',
            error.message,
            { executionTime }
        );

        console.error('[RiskGuardian] Scan failed:', error.message);
        throw error;
    }
};

/**
 * Scan a single project on-demand
 */
const scanProject = async (projectId) => {
    const startTime = Date.now();

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { user: { select: { id: true, email: true } } }
        });

        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }

        const scan = await scanProjectForRisks(project);

        // Update project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                last_ai_check: new Date(),
                ai_risk_level: scan.riskLevel,
                ai_health_score: scan.healthScore
            }
        });

        // Log the scan
        await agentLogger.logSuccess(
            AGENT_NAME,
            'scan_project',
            'project',
            projectId,
            `Scanned "${project.name}". Risk: ${scan.riskLevel.toUpperCase()}, Health: ${scan.healthScore}/100, Overdue: ${scan.overdueTasks.length} tasks`,
            0.9,
            {
                inputContext: { projectId },
                outputData: {
                    riskLevel: scan.riskLevel,
                    healthScore: scan.healthScore,
                    overdueCount: scan.overdueTasks.length,
                    totalActive: scan.totalActiveTasks
                },
                executionTime: Date.now() - startTime
            }
        );

        return scan;

    } catch (error) {
        await agentLogger.logFailure(
            AGENT_NAME,
            'scan_project',
            'project',
            `Failed to scan project ${projectId}`,
            error.message
        );
        throw error;
    }
};

/**
 * Get risk summary for dashboard
 */
const getRiskSummary = async (userId) => {
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { user_id: userId },
                { members: { some: { user_id: userId } } }
            ],
            archived: false
        },
        select: {
            id: true,
            name: true,
            ai_risk_level: true,
            ai_health_score: true,
            last_ai_check: true
        }
    });

    const summary = {
        total: projects.length,
        critical: projects.filter(p => p.ai_risk_level === 'critical').length,
        high: projects.filter(p => p.ai_risk_level === 'high').length,
        medium: projects.filter(p => p.ai_risk_level === 'medium').length,
        low: projects.filter(p => p.ai_risk_level === 'low' || !p.ai_risk_level).length,
        avgHealthScore: projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + (p.ai_health_score || 100), 0) / projects.length)
            : 100,
        projects: projects.map(p => ({
            id: p.id,
            name: p.name,
            riskLevel: p.ai_risk_level || 'unknown',
            healthScore: p.ai_health_score || null,
            lastChecked: p.last_ai_check
        }))
    };

    return summary;
};

module.exports = {
    scanAllProjects,
    scanProject,
    scanProjectForRisks,
    getRiskSummary,
    AGENT_NAME
};
