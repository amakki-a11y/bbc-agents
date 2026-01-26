const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Anthropic = require('@anthropic-ai/sdk');
const { createNotification } = require('./notificationService');

/**
 * Project Automation Service
 * Handles automatic project creation and management based on triggers
 */

// Templates for common project types
const PROJECT_TEMPLATES = {
    EMPLOYEE_ONBOARDING: {
        name: 'Employee Onboarding: {employeeName}',
        description: 'Onboarding tasks and documentation for new employee {employeeName}',
        priority: 'HIGH',
        color: '#10b981',
        tasks: [
            { title: 'Set up workstation and equipment', priority: 'HIGH', order: 1 },
            { title: 'Create user accounts (email, systems)', priority: 'HIGH', order: 2 },
            { title: 'Provide access credentials and badges', priority: 'HIGH', order: 3 },
            { title: 'Schedule orientation meeting', priority: 'MEDIUM', order: 4 },
            { title: 'Assign mentor/buddy', priority: 'MEDIUM', order: 5 },
            { title: 'Review company policies and handbook', priority: 'MEDIUM', order: 6 },
            { title: 'Complete HR paperwork', priority: 'HIGH', order: 7 },
            { title: 'Department introduction and tour', priority: 'LOW', order: 8 },
            { title: 'First week check-in', priority: 'MEDIUM', order: 9 },
            { title: '30-day review meeting', priority: 'MEDIUM', order: 10 }
        ]
    },
    EMPLOYEE_OFFBOARDING: {
        name: 'Employee Offboarding: {employeeName}',
        description: 'Offboarding tasks and handover for departing employee {employeeName}',
        priority: 'HIGH',
        color: '#ef4444',
        tasks: [
            { title: 'Conduct exit interview', priority: 'HIGH', order: 1 },
            { title: 'Collect company equipment', priority: 'HIGH', order: 2 },
            { title: 'Revoke system access and credentials', priority: 'HIGH', order: 3 },
            { title: 'Knowledge transfer sessions', priority: 'HIGH', order: 4 },
            { title: 'Update documentation', priority: 'MEDIUM', order: 5 },
            { title: 'Reassign ongoing tasks', priority: 'HIGH', order: 6 },
            { title: 'Process final payroll', priority: 'HIGH', order: 7 },
            { title: 'Archive employee records', priority: 'LOW', order: 8 }
        ]
    },
    DEPARTMENT_QUARTERLY_REVIEW: {
        name: 'Q{quarter} {year} Review: {departmentName}',
        description: 'Quarterly performance review and planning for {departmentName}',
        priority: 'MEDIUM',
        color: '#6366f1',
        tasks: [
            { title: 'Gather performance metrics', priority: 'HIGH', order: 1 },
            { title: 'Review team goals progress', priority: 'HIGH', order: 2 },
            { title: 'Individual performance reviews', priority: 'HIGH', order: 3 },
            { title: 'Budget review and planning', priority: 'MEDIUM', order: 4 },
            { title: 'Identify training needs', priority: 'MEDIUM', order: 5 },
            { title: 'Set goals for next quarter', priority: 'HIGH', order: 6 },
            { title: 'Prepare executive summary', priority: 'MEDIUM', order: 7 }
        ]
    }
};

/**
 * Create a project from a template
 */
async function createProjectFromTemplate(templateKey, variables, creatorId, options = {}) {
    const template = PROJECT_TEMPLATES[templateKey];
    if (!template) {
        throw new Error(`Unknown template: ${templateKey}`);
    }

    // Replace variables in template
    let projectName = template.name;
    let projectDescription = template.description;

    Object.entries(variables).forEach(([key, value]) => {
        projectName = projectName.replace(`{${key}}`, value);
        projectDescription = projectDescription.replace(`{${key}}`, value);
    });

    // Calculate due date if not provided
    const dueDate = options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // Create the project
    const project = await prisma.project.create({
        data: {
            name: projectName,
            description: projectDescription,
            priority: template.priority,
            color: template.color,
            status: 'ACTIVE',
            creatorId: creatorId,
            dueDate: dueDate,
            isAIGenerated: options.isAIGenerated || false,
            aiGeneratedBy: options.aiGeneratedBy || null,
            departmentId: options.departmentId || null,
            tasks: {
                create: template.tasks.map((task, index) => ({
                    title: task.title.replace(/\{(\w+)\}/g, (_, key) => variables[key] || ''),
                    priority: task.priority,
                    status: 'TODO',
                    order: task.order || index + 1,
                    creatorId: creatorId
                }))
            }
        },
        include: {
            tasks: true,
            creator: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    // Log the automation
    await prisma.projectActivity.create({
        data: {
            projectId: project.id,
            userId: creatorId,
            action: 'created',
            details: `Project automatically created from ${templateKey} template`
        }
    });

    return project;
}

/**
 * Trigger: New Employee Onboarding
 */
async function triggerOnboarding(employeeId, triggeredById) {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            department: true,
            manager: true
        }
    });

    if (!employee) {
        throw new Error('Employee not found');
    }

    const project = await createProjectFromTemplate(
        'EMPLOYEE_ONBOARDING',
        {
            employeeName: employee.name
        },
        triggeredById,
        {
            departmentId: employee.departmentId,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }
    );

    // Assign tasks to relevant people
    const hrRole = await prisma.role.findFirst({
        where: { name: { contains: 'HR', mode: 'insensitive' } }
    });

    if (hrRole) {
        const hrEmployees = await prisma.employee.findMany({
            where: { roleId: hrRole.id },
            take: 1
        });

        if (hrEmployees.length > 0) {
            // Assign HR-related tasks to HR
            await prisma.task.updateMany({
                where: {
                    projectId: project.id,
                    title: { contains: 'HR', mode: 'insensitive' }
                },
                data: { assigneeId: hrEmployees[0].id }
            });
        }
    }

    // Assign manager tasks
    if (employee.managerId) {
        await prisma.task.updateMany({
            where: {
                projectId: project.id,
                title: { in: ['Schedule orientation meeting', 'Assign mentor/buddy', 'First week check-in', '30-day review meeting'] }
            },
            data: { assigneeId: employee.managerId }
        });
    }

    // Notify relevant people
    if (employee.managerId) {
        await createNotification({
            userId: employee.managerId,
            type: 'PROJECT_CREATED',
            title: 'New Onboarding Project',
            message: `An onboarding project has been created for ${employee.name}`,
            referenceId: project.id,
            referenceType: 'PROJECT'
        });
    }

    return project;
}

/**
 * Trigger: Employee Offboarding
 */
async function triggerOffboarding(employeeId, triggeredById) {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            department: true,
            manager: true
        }
    });

    if (!employee) {
        throw new Error('Employee not found');
    }

    const project = await createProjectFromTemplate(
        'EMPLOYEE_OFFBOARDING',
        {
            employeeName: employee.name
        },
        triggeredById,
        {
            departmentId: employee.departmentId,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
    );

    // Notify HR and manager
    if (employee.managerId) {
        await createNotification({
            userId: employee.managerId,
            type: 'PROJECT_CREATED',
            title: 'Offboarding Project Created',
            message: `An offboarding project has been created for ${employee.name}`,
            referenceId: project.id,
            referenceType: 'PROJECT'
        });
    }

    return project;
}

/**
 * Trigger: Quarterly Review
 */
async function triggerQuarterlyReview(departmentId, triggeredById) {
    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { manager: true }
    });

    if (!department) {
        throw new Error('Department not found');
    }

    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const year = now.getFullYear();

    const project = await createProjectFromTemplate(
        'DEPARTMENT_QUARTERLY_REVIEW',
        {
            quarter: quarter.toString(),
            year: year.toString(),
            departmentName: department.name
        },
        triggeredById,
        {
            departmentId: departmentId,
            dueDate: new Date(now.getFullYear(), quarter * 3, 0) // End of quarter
        }
    );

    // Assign to department manager
    if (department.managerId) {
        await prisma.task.updateMany({
            where: { projectId: project.id },
            data: { assigneeId: department.managerId }
        });

        await createNotification({
            userId: department.managerId,
            type: 'PROJECT_CREATED',
            title: 'Quarterly Review Project',
            message: `Q${quarter} ${year} review project created for ${department.name}`,
            referenceId: project.id,
            referenceType: 'PROJECT'
        });
    }

    return project;
}

/**
 * Check and send deadline reminders
 */
async function checkDeadlineReminders() {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Find projects due within 3 days
    const upcomingProjects = await prisma.project.findMany({
        where: {
            status: 'ACTIVE',
            dueDate: {
                gte: now,
                lte: threeDaysFromNow
            }
        },
        include: {
            creator: true,
            members: {
                include: { employee: true }
            }
        }
    });

    for (const project of upcomingProjects) {
        const daysUntilDue = Math.ceil((project.dueDate - now) / (1000 * 60 * 60 * 24));
        const urgency = daysUntilDue <= 1 ? 'urgent' : 'upcoming';

        // Notify creator
        await createNotification({
            userId: project.creatorId,
            type: 'PROJECT_DEADLINE',
            title: urgency === 'urgent' ? 'Urgent: Project Due Tomorrow!' : 'Project Deadline Approaching',
            message: `"${project.name}" is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
            referenceId: project.id,
            referenceType: 'PROJECT'
        });

        // Notify members
        for (const member of project.members) {
            if (member.employeeId !== project.creatorId) {
                await createNotification({
                    userId: member.employeeId,
                    type: 'PROJECT_DEADLINE',
                    title: urgency === 'urgent' ? 'Urgent: Project Due Tomorrow!' : 'Project Deadline Approaching',
                    message: `"${project.name}" is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
                    referenceId: project.id,
                    referenceType: 'PROJECT'
                });
            }
        }
    }

    return upcomingProjects.length;
}

/**
 * Check for overdue tasks and escalate
 */
async function checkOverdueTasks() {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
        where: {
            status: { not: 'DONE' },
            dueDate: { lt: now }
        },
        include: {
            assignee: true,
            project: {
                include: { creator: true }
            }
        }
    });

    for (const task of overdueTasks) {
        // Notify assignee
        if (task.assigneeId) {
            await createNotification({
                userId: task.assigneeId,
                type: 'TASK_OVERDUE',
                title: 'Overdue Task',
                message: `Task "${task.title}" is overdue`,
                referenceId: task.id,
                referenceType: 'TASK'
            });
        }

        // Escalate to project owner if significantly overdue (> 2 days)
        const daysOverdue = Math.floor((now - task.dueDate) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 2 && task.project?.creatorId && task.project.creatorId !== task.assigneeId) {
            await createNotification({
                userId: task.project.creatorId,
                type: 'TASK_ESCALATION',
                title: 'Task Escalation',
                message: `Task "${task.title}" is ${daysOverdue} days overdue`,
                referenceId: task.id,
                referenceType: 'TASK'
            });
        }
    }

    return overdueTasks.length;
}

/**
 * Auto-complete projects when all tasks are done
 */
async function autoCompleteProjects() {
    // Find active projects where all tasks are done
    const projects = await prisma.project.findMany({
        where: {
            status: 'ACTIVE'
        },
        include: {
            tasks: true
        }
    });

    let completedCount = 0;

    for (const project of projects) {
        if (project.tasks.length > 0 && project.tasks.every(t => t.status === 'DONE')) {
            await prisma.project.update({
                where: { id: project.id },
                data: { status: 'COMPLETED' }
            });

            await prisma.projectActivity.create({
                data: {
                    projectId: project.id,
                    userId: project.creatorId,
                    action: 'completed',
                    details: 'Project automatically marked as completed - all tasks done'
                }
            });

            await createNotification({
                userId: project.creatorId,
                type: 'PROJECT_COMPLETED',
                title: 'Project Completed!',
                message: `"${project.name}" has been automatically completed`,
                referenceId: project.id,
                referenceType: 'PROJECT'
            });

            completedCount++;
        }
    }

    return completedCount;
}

/**
 * Generate AI-powered project suggestions based on patterns
 */
async function generateProjectSuggestions(userId) {
    const employee = await prisma.employee.findUnique({
        where: { id: userId },
        include: {
            department: true,
            role: true,
            assignedTasks: {
                take: 20,
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!employee) {
        return [];
    }

    const suggestions = [];

    // Check for patterns in recent work
    const taskTitles = employee.assignedTasks.map(t => t.title.toLowerCase());

    // Suggest documentation project if many tasks mention "document" or "update"
    const documentTasks = taskTitles.filter(t => t.includes('document') || t.includes('update'));
    if (documentTasks.length >= 3) {
        suggestions.push({
            type: 'DOCUMENTATION_CLEANUP',
            title: 'Documentation Update Project',
            description: 'Based on your recent tasks, consider creating a project to consolidate documentation updates',
            priority: 'MEDIUM'
        });
    }

    // Suggest training project for new role members
    const roleMembers = await prisma.employee.count({
        where: { roleId: employee.roleId }
    });
    if (roleMembers > 3) {
        suggestions.push({
            type: 'TEAM_TRAINING',
            title: `${employee.role?.name || 'Team'} Training Program`,
            description: 'Create a standardized training program for team members',
            priority: 'LOW'
        });
    }

    return suggestions;
}

module.exports = {
    createProjectFromTemplate,
    triggerOnboarding,
    triggerOffboarding,
    triggerQuarterlyReview,
    checkDeadlineReminders,
    checkOverdueTasks,
    autoCompleteProjects,
    generateProjectSuggestions,
    PROJECT_TEMPLATES
};
