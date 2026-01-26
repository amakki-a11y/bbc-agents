const prisma = require('../lib/prisma');
const { createNotification } = require('../services/notificationService');

// Helper to log activity with optional metadata
const logActivity = async (taskId, userId, type, content, metadata = null) => {
    try {
        await prisma.activity.create({
            data: {
                task_id: parseInt(taskId),
                user_id: userId,
                type,
                content,
                metadata: metadata ? JSON.stringify(metadata) : null
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
                timeEntries: {
                    orderBy: { start_time: 'desc' }
                },
                user: { select: { email: true, id: true } },
                blockedBy: { select: { id: true, title: true, status: true } },
                blocking: { select: { id: true, title: true, status: true } }
            }
        });
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch task details" });
    }
};

const updateTaskAdvanced = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, priority, description, due_date, start_date, time_estimate, tags } = req.body;

        // Get old task for comparison
        const oldTask = await prisma.task.findUnique({ where: { id: parseInt(id) } });

        if (!oldTask) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Build update data - only include fields that are provided
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (description !== undefined) updateData.description = description;
        if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
        if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null;
        if (time_estimate !== undefined) updateData.time_estimate = time_estimate ? parseInt(time_estimate) : null;
        if (tags !== undefined) updateData.tags = tags;

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Helper to format status
        const formatStatus = (status) => {
            const statusMap = {
                'todo': 'To Do',
                'in_progress': 'In Progress',
                'in_review': 'In Review',
                'done': 'Done',
                'blocked': 'Blocked'
            };
            return statusMap[status] || status;
        };

        // Helper to format priority
        const formatPriority = (priority) => {
            const priorityMap = {
                'urgent': 'Urgent',
                'high': 'High',
                'normal': 'Normal',
                'low': 'Low'
            };
            return priorityMap[priority] || priority || 'None';
        };

        // Helper to format date
        const formatDate = (date) => {
            if (!date) return 'none';
            return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        // Helper to format time estimate
        const formatTimeEstimate = (minutes) => {
            if (!minutes) return 'none';
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours && mins) return `${hours}h ${mins}m`;
            if (hours) return `${hours}h`;
            return `${mins}m`;
        };

        // Log all field changes
        const userId = req.user.userId;

        // Title change
        if (title !== undefined && title !== oldTask.title) {
            await logActivity(id, userId, 'field_update', `changed title from "${oldTask.title}" to "${title}"`);
        }

        // Status change
        if (status !== undefined && status !== oldTask.status) {
            await logActivity(id, userId, 'status_change', `changed status from ${formatStatus(oldTask.status)} to ${formatStatus(status)}`);
        }

        // Priority change
        if (priority !== undefined && priority !== oldTask.priority) {
            const oldPriority = formatPriority(oldTask.priority);
            const newPriority = formatPriority(priority);
            await logActivity(id, userId, 'priority_change', `changed priority from ${oldPriority} to ${newPriority}`);
        }

        // Description change - log with old/new values for diff view
        if (description !== undefined && description !== oldTask.description) {
            const oldDesc = oldTask.description || '';
            const newDesc = description || '';
            const metadata = {
                old_value: oldDesc.substring(0, 500), // Truncate for storage
                new_value: newDesc.substring(0, 500)
            };

            if (!oldTask.description && description) {
                await logActivity(id, userId, 'description_change', 'added description', metadata);
            } else if (oldTask.description && !description) {
                await logActivity(id, userId, 'description_change', 'removed description', metadata);
            } else {
                await logActivity(id, userId, 'description_change', 'updated description', metadata);
            }
        }

        // Due date change
        const oldDueDate = oldTask.due_date ? new Date(oldTask.due_date).toISOString().split('T')[0] : null;
        const newDueDate = due_date ? new Date(due_date).toISOString().split('T')[0] : null;
        if (due_date !== undefined && oldDueDate !== newDueDate) {
            if (!oldDueDate && newDueDate) {
                await logActivity(id, userId, 'date_change', `set due date to ${formatDate(due_date)}`);
            } else if (oldDueDate && !newDueDate) {
                await logActivity(id, userId, 'date_change', 'removed due date');
            } else {
                await logActivity(id, userId, 'date_change', `changed due date from ${formatDate(oldTask.due_date)} to ${formatDate(due_date)}`);
            }
        }

        // Start date change
        const oldStartDate = oldTask.start_date ? new Date(oldTask.start_date).toISOString().split('T')[0] : null;
        const newStartDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;
        if (start_date !== undefined && oldStartDate !== newStartDate) {
            if (!oldStartDate && newStartDate) {
                await logActivity(id, userId, 'date_change', `set start date to ${formatDate(start_date)}`);
            } else if (oldStartDate && !newStartDate) {
                await logActivity(id, userId, 'date_change', 'removed start date');
            } else {
                await logActivity(id, userId, 'date_change', `changed start date from ${formatDate(oldTask.start_date)} to ${formatDate(start_date)}`);
            }
        }

        // Time estimate change
        if (time_estimate !== undefined && time_estimate !== oldTask.time_estimate) {
            if (!oldTask.time_estimate && time_estimate) {
                await logActivity(id, userId, 'field_update', `set time estimate to ${formatTimeEstimate(time_estimate)}`);
            } else if (oldTask.time_estimate && !time_estimate) {
                await logActivity(id, userId, 'field_update', 'removed time estimate');
            } else {
                await logActivity(id, userId, 'field_update', `changed time estimate from ${formatTimeEstimate(oldTask.time_estimate)} to ${formatTimeEstimate(time_estimate)}`);
            }
        }

        // Tags change
        if (tags !== undefined && tags !== oldTask.tags) {
            const oldTags = oldTask.tags ? oldTask.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            const newTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            // Find added tags
            const addedTags = newTags.filter(t => !oldTags.includes(t));
            // Find removed tags
            const removedTags = oldTags.filter(t => !newTags.includes(t));

            for (const tag of addedTags) {
                await logActivity(id, userId, 'tag_change', `added tag: ${tag}`);
            }
            for (const tag of removedTags) {
                await logActivity(id, userId, 'tag_change', `removed tag: ${tag}`);
            }
        }

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

        // Get the subtask first to know the task_id for logging
        const existingSubtask = await prisma.subtask.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingSubtask) {
            return res.status(404).json({ error: "Subtask not found" });
        }

        const subtask = await prisma.subtask.update({
            where: { id: parseInt(id) },
            data: { is_complete }
        });

        // Log activity
        if (is_complete !== existingSubtask.is_complete) {
            await logActivity(
                subtask.task_id,
                req.user.userId,
                'subtask_update',
                is_complete ? `completed subtask: ${subtask.title}` : `uncompleted subtask: ${subtask.title}`
            );
        }

        res.json(subtask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update subtask" });
    }
};

const addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content } = req.body;

        const taskIdNum = parseInt(taskId);

        // Check if task ID is valid (not a temp ID)
        if (taskIdNum > 1000000000000) {
            return res.status(400).json({ error: "Invalid task ID. Please save the task first." });
        }

        // Verify task exists
        const task = await prisma.task.findUnique({ where: { id: taskIdNum } });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const activity = await prisma.activity.create({
            data: {
                task_id: taskIdNum,
                user_id: req.user.userId,
                type: 'comment',
                content
            },
            include: { user: { select: { email: true } } }
        });

        // Notify Task Owner
        if (task.user_id !== req.user.userId) {
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
        console.error('Error adding comment:', error);
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

// Delete subtask
const deleteSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const subtask = await prisma.subtask.findUnique({ where: { id: parseInt(id) } });

        if (!subtask) {
            return res.status(404).json({ error: "Subtask not found" });
        }

        await prisma.subtask.delete({ where: { id: parseInt(id) } });
        await logActivity(subtask.task_id, req.user.userId, 'subtask_delete', `deleted subtask: ${subtask.title}`);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete subtask" });
    }
};

// Update subtask (title and is_complete)
const updateSubtaskFull = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, is_complete } = req.body;

        // Get existing subtask
        const existingSubtask = await prisma.subtask.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingSubtask) {
            return res.status(404).json({ error: "Subtask not found" });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (is_complete !== undefined) updateData.is_complete = is_complete;

        const subtask = await prisma.subtask.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Log activity for changes
        if (title !== undefined && title !== existingSubtask.title) {
            await logActivity(
                subtask.task_id,
                req.user.userId,
                'subtask_update',
                `renamed subtask from "${existingSubtask.title}" to "${title}"`
            );
        }

        if (is_complete !== undefined && is_complete !== existingSubtask.is_complete) {
            await logActivity(
                subtask.task_id,
                req.user.userId,
                'subtask_update',
                is_complete ? `completed subtask: ${subtask.title}` : `uncompleted subtask: ${subtask.title}`
            );
        }

        res.json(subtask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update subtask" });
    }
};

// Attachments
const addAttachment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { filename, file_url, size } = req.body;

        const attachment = await prisma.attachment.create({
            data: {
                filename,
                file_url,
                size: parseInt(size) || 0,
                task_id: parseInt(taskId),
                uploaded_by_id: req.user.userId
            }
        });

        // Log attachment upload with metadata
        await logActivity(taskId, req.user.userId, 'attachment_upload', `uploaded file: ${filename}`, {
            filename: filename,
            filesize: parseInt(size) || 0,
            file_url: file_url
        });
        res.status(201).json(attachment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add attachment" });
    }
};

const deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await prisma.attachment.findUnique({ where: { id: parseInt(id) } });

        if (!attachment) {
            return res.status(404).json({ error: "Attachment not found" });
        }

        await prisma.attachment.delete({ where: { id: parseInt(id) } });

        // Log attachment deletion with metadata
        await logActivity(attachment.task_id, req.user.userId, 'attachment_delete', `removed file: ${attachment.filename}`, {
            filename: attachment.filename,
            filesize: attachment.size
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete attachment" });
    }
};

// Time Entries
const addTimeEntry = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { start_time, end_time, duration, is_manual } = req.body;

        const timeEntry = await prisma.timeEntry.create({
            data: {
                task_id: parseInt(taskId),
                user_id: req.user.userId,
                start_time: new Date(start_time),
                end_time: end_time ? new Date(end_time) : null,
                duration: duration ? parseInt(duration) : null,
                is_manual: is_manual || false
            }
        });

        const formattedDuration = duration ? `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m` : 'started';
        await logActivity(taskId, req.user.userId, 'time_tracking', `logged time: ${formattedDuration}`);

        res.status(201).json(timeEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add time entry" });
    }
};

const updateTimeEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { end_time, duration } = req.body;

        const timeEntry = await prisma.timeEntry.update({
            where: { id: parseInt(id) },
            data: {
                end_time: end_time ? new Date(end_time) : undefined,
                duration: duration !== undefined ? parseInt(duration) : undefined
            }
        });

        res.json(timeEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update time entry" });
    }
};

const getTimeEntries = async (req, res) => {
    try {
        const { taskId } = req.params;
        const entries = await prisma.timeEntry.findMany({
            where: { task_id: parseInt(taskId) },
            orderBy: { start_time: 'desc' }
        });
        res.json(entries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch time entries" });
    }
};

// Delete Activity (comment)
const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.activity.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete activity" });
    }
};

// Task Dependencies
const addDependency = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { depends_on_id } = req.body;

        // Check for circular dependency
        if (parseInt(taskId) === parseInt(depends_on_id)) {
            return res.status(400).json({ error: "A task cannot depend on itself" });
        }

        const task = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: {
                blockedBy: {
                    connect: { id: parseInt(depends_on_id) }
                }
            },
            include: {
                blockedBy: { select: { id: true, title: true } },
                blocking: { select: { id: true, title: true } }
            }
        });

        await logActivity(taskId, req.user.userId, 'dependency_add', `added dependency on task #${depends_on_id}`);
        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add dependency" });
    }
};

const removeDependency = async (req, res) => {
    try {
        const { taskId, dependsOnId } = req.params;

        const task = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: {
                blockedBy: {
                    disconnect: { id: parseInt(dependsOnId) }
                }
            },
            include: {
                blockedBy: { select: { id: true, title: true } },
                blocking: { select: { id: true, title: true } }
            }
        });

        await logActivity(taskId, req.user.userId, 'dependency_remove', `removed dependency on task #${dependsOnId}`);
        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to remove dependency" });
    }
};

// Duplicate Task
const duplicateTask = async (req, res) => {
    try {
        const { id } = req.params;

        const originalTask = await prisma.task.findUnique({
            where: { id: parseInt(id) },
            include: {
                subtasks: true
            }
        });

        if (!originalTask) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Create duplicate with "(Copy)" suffix
        const duplicatedTask = await prisma.task.create({
            data: {
                title: `${originalTask.title} (Copy)`,
                description: originalTask.description,
                status: 'todo',
                priority: originalTask.priority,
                tags: originalTask.tags,
                due_date: originalTask.due_date,
                start_date: originalTask.start_date,
                time_estimate: originalTask.time_estimate,
                user_id: req.user.userId,
                project_id: originalTask.project_id,
                subtasks: {
                    create: originalTask.subtasks.map(st => ({
                        title: st.title,
                        is_complete: false
                    }))
                }
            },
            include: {
                subtasks: true
            }
        });

        res.status(201).json(duplicatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to duplicate task" });
    }
};

// Move Task to Different Project
const moveTaskToProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id } = req.body;

        // Verify the target project exists and belongs to user
        const targetProject = await prisma.project.findUnique({
            where: { id: parseInt(project_id) }
        });

        if (!targetProject || targetProject.user_id !== req.user.userId) {
            return res.status(400).json({ error: "Invalid target project" });
        }

        const task = await prisma.task.update({
            where: { id: parseInt(id) },
            data: { project_id: parseInt(project_id) }
        });

        await logActivity(id, req.user.userId, 'move', `moved task to project "${targetProject.name}"`);
        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to move task" });
    }
};

module.exports = {
    getTaskDetails,
    updateTaskAdvanced,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtaskFull,
    addComment,
    logActivity,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addAttachment,
    deleteAttachment,
    addTimeEntry,
    updateTimeEntry,
    getTimeEntries,
    deleteActivity,
    addDependency,
    removeDependency,
    duplicateTask,
    moveTaskToProject
};
