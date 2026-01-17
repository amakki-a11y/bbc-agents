const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('../services/notificationService');
const prisma = new PrismaClient();

// Helper to log activity
const logActivity = async (taskId, userId, type, content) => {
    try {
        await prisma.activity.create({
            data: {
                task_id: parseInt(taskId),
                user_id: userId,
                type,
                content
            }
        });
    } catch (e) {
        console.error("Failed to log activity", e);
    }
};

const getTaskDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: parseInt(id) },
            include: {
                subtasks: true,
                actionItems: true,
                customFields: true,
                attachments: true,
                activities: {
                    take: 50,
                    include: { user: { select: { email: true, avatar_url: true } } },
                    orderBy: { timestamp: 'desc' }
                },
                timeEntries: true,
                user: { select: { email: true, id: true } }
            }
        });
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch task details" });
    }
};

const updateTaskAdvanced = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, priority, description, due_date, start_date, time_estimate, tags } = req.body;

        // Get old task for comparison
        const oldTask = await prisma.task.findUnique({ where: { id: parseInt(id) } });

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: {
                title, status, priority, description,
                due_date: due_date ? new Date(due_date) : undefined,
                start_date: start_date ? new Date(start_date) : undefined,
                time_estimate: time_estimate ? parseInt(time_estimate) : undefined,
                tags
            }
        });

        // Semantic logging
        if (status && status !== oldTask.status) {
            await logActivity(id, req.user.userId, 'status_change', `changed status from ${oldTask.status} to ${status}`);
        }
        if (priority && priority !== oldTask.priority) {
            await logActivity(id, req.user.userId, 'field_update', `changed priority to ${priority}`);
        }
        // ... add more checks

        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update task" });
    }
};

const addSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title } = req.body;
        const subtask = await prisma.subtask.create({
            data: { title, task_id: parseInt(taskId) }
        });
        await logActivity(taskId, req.user.userId, 'subtask_add', `added subtask: ${title}`);
        res.status(201).json(subtask);
    } catch (error) {
        res.status(500).json({ error: "Failed to add subtask" });
    }
};

const toggleSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_complete } = req.body;
        const subtask = await prisma.subtask.update({
            where: { id: parseInt(id) },
            data: { is_complete }
        });
        // await logActivity(subtask.task_id, req.user.userId, 'subtask_update', `marked subtask ${subtask.title} as ${is_complete ? 'complete' : 'incomplete'}`);
        res.json(subtask);
    } catch (error) {
        res.status(500).json({ error: "Failed to update subtask" });
    }
};

const addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content } = req.body;
        const activity = await prisma.activity.create({
            data: {
                task_id: parseInt(taskId),
                user_id: req.user.userId,
                type: 'comment',
                content
            },
            include: { user: { select: { email: true } } }
        });

        // Notify Task Owner
        const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
        if (task && task.user_id !== req.user.userId) {
            await createNotification({
                userId: task.user_id,
                type: 'comment',
                message: `New comment on task "${task.title}"`,
                taskId: task.id,
                projectId: task.project_id
            });
        }

        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ error: "Failed to add comment" });
    }
};

const addActionItem = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content, assignee_id } = req.body;

        // Map 'content' to 'title' as per schema
        const actionItem = await prisma.actionItem.create({
            data: {
                title: content,
                task_id: parseInt(taskId),
                assignee_id: assignee_id ? parseInt(assignee_id) : undefined
            }
        });

        // Notify Assignee
        if (assignee_id && parseInt(assignee_id) !== req.user.userId) {
            const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
            await createNotification({
                userId: parseInt(assignee_id),
                type: 'assigned_task', // Using this type for action item assignment as well
                message: `You were assigned an action item "${content}" on task "${task ? task.title : 'Unknown'}"`,
                taskId: parseInt(taskId),
                projectId: task ? task.project_id : null
            });
        }

        await logActivity(taskId, req.user.userId, 'action_item_create', `added action item '${content}'`);

        // Return with 'content' alias to match frontend expectation if needed, 
        // but standard is usually to return DB field. User asked for specific response format.
        // Let's return consistent object.
        res.status(201).json({
            ...actionItem,
            content: actionItem.title // Alias for frontend compatibility
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add action item" });
    }
};

const updateActionItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, is_complete, assignee_id } = req.body;

        const oldItem = await prisma.actionItem.findUnique({ where: { id: parseInt(id) } });

        const updatedItem = await prisma.actionItem.update({
            where: { id: parseInt(id) },
            data: {
                title: content !== undefined ? content : undefined,
                is_complete: is_complete !== undefined ? is_complete : undefined,
                assignee_id: assignee_id !== undefined ? parseInt(assignee_id) : undefined
            }
        });

        // Logging
        if (is_complete !== undefined && is_complete !== oldItem.is_complete && is_complete === true) {
            await logActivity(oldItem.task_id, req.user.userId, 'action_item_update', `marked action item '${updatedItem.title}' as complete`);

            // Notify Task Owner if someone else completed it
            const task = await prisma.task.findUnique({ where: { id: parseInt(oldItem.task_id) } });
            if (task && task.user_id !== req.user.userId) {
                await createNotification({
                    userId: task.user_id,
                    type: 'task_completed', // reusing type or adding new
                    message: `Action item "${updatedItem.title}" completed by user`,
                    taskId: task.id,
                    projectId: task.project_id
                });
            }
        } else if (is_complete !== undefined && is_complete !== oldItem.is_complete) {
            await logActivity(oldItem.task_id, req.user.userId, 'action_item_update', `marked action item '${updatedItem.title}' as incomplete`);
        }

        if (content && content !== oldItem.title) {
            await logActivity(oldItem.task_id, req.user.userId, 'action_item_update', `updated action item from '${oldItem.title}' to '${content}'`);
        }

        res.json({ ...updatedItem, content: updatedItem.title });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update action item" });
    }
};

const deleteActionItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.actionItem.findUnique({ where: { id: parseInt(id) } });

        if (item) {
            await prisma.actionItem.delete({ where: { id: parseInt(id) } });
            await logActivity(item.task_id, req.user.userId, 'action_item_delete', `deleted action item '${item.title}'`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete action item" });
    }
};

module.exports = {
    getTaskDetails,
    updateTaskAdvanced,
    addSubtask,
    toggleSubtask,
    addComment,
    addComment,
    logActivity,
    addActionItem,
    updateActionItem,
    deleteActionItem
};
