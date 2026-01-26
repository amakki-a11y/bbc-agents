const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all tasks in a list
const getTasks = async (req, res) => {
    try {
        const { listId } = req.params;
        const { includeArchived, statusId, priority, assigneeId } = req.query;
        const employeeId = req.user.employeeId;

        // Verify list access
        const list = await prisma.list.findFirst({
            where: {
                id: parseInt(listId),
                space: {
                    OR: [
                        { isPrivate: false },
                        { members: { some: { employeeId } } },
                        { workspace: { ownerId: employeeId } },
                        { workspace: { members: { some: { employeeId } } } }
                    ]
                }
            }
        });

        if (!list) {
            return res.status(403).json({ error: 'Not authorized to access this list' });
        }

        const where = {
            listId: parseInt(listId),
            parentTaskId: null
        };

        if (includeArchived !== 'true') {
            where.isArchived = false;
        }

        if (statusId) {
            where.statusId = parseInt(statusId);
        }

        if (priority) {
            where.priority = priority;
        }

        if (assigneeId) {
            where.assignees = { some: { employeeId: assigneeId } };
        }

        const tasks = await prisma.listTask.findMany({
            where,
            include: {
                status: true,
                createdBy: { select: { id: true, name: true, photo: true } },
                assignees: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                tags: {
                    include: { tag: true }
                },
                subtasks: {
                    include: {
                        status: true,
                        assignees: {
                            include: {
                                employee: { select: { id: true, name: true, photo: true } }
                            }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                },
                _count: { select: { comments: true, attachments: true } }
            },
            orderBy: { sortOrder: 'asc' }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Get task by ID
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        const task = await prisma.listTask.findFirst({
            where: {
                id: parseInt(id),
                list: {
                    space: {
                        OR: [
                            { isPrivate: false },
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                }
            },
            include: {
                list: {
                    select: {
                        id: true,
                        name: true,
                        space: { select: { id: true, name: true, workspaceId: true } }
                    }
                },
                status: true,
                createdBy: { select: { id: true, name: true, photo: true } },
                assignees: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true, email: true } }
                    }
                },
                tags: {
                    include: { tag: true }
                },
                subtasks: {
                    include: {
                        status: true,
                        assignees: {
                            include: {
                                employee: { select: { id: true, name: true, photo: true } }
                            }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                },
                comments: {
                    include: {
                        author: { select: { id: true, name: true, photo: true } },
                        replies: {
                            include: {
                                author: { select: { id: true, name: true, photo: true } }
                            }
                        }
                    },
                    where: { parentId: null },
                    orderBy: { createdAt: 'desc' }
                },
                attachments: {
                    include: {
                        uploadedBy: { select: { id: true, name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                activities: {
                    include: {
                        user: { select: { id: true, name: true, photo: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
};

// Create task
const createTask = async (req, res) => {
    try {
        const { listId, title, description, priority, dueDate, startDate, timeEstimate, statusId, parentTaskId, assigneeIds } = req.body;
        const employeeId = req.user.employeeId;

        // Verify list access
        const list = await prisma.list.findFirst({
            where: {
                id: parseInt(listId),
                space: {
                    OR: [
                        { members: { some: { employeeId } } },
                        { workspace: { ownerId: employeeId } },
                        { workspace: { members: { some: { employeeId } } } }
                    ]
                }
            },
            include: {
                statuses: { where: { isDefault: true }, take: 1 }
            }
        });

        if (!list) {
            return res.status(403).json({ error: 'Not authorized to create tasks in this list' });
        }

        // Get max sort order
        const maxOrder = await prisma.listTask.aggregate({
            where: { listId: parseInt(listId), parentTaskId: parentTaskId ? parseInt(parentTaskId) : null },
            _max: { sortOrder: true }
        });

        const defaultStatusId = statusId || list.statuses[0]?.id;

        const task = await prisma.listTask.create({
            data: {
                listId: parseInt(listId),
                title,
                description,
                priority: priority || 'NONE',
                dueDate: dueDate ? new Date(dueDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                timeEstimate,
                statusId: defaultStatusId,
                parentTaskId: parentTaskId ? parseInt(parentTaskId) : null,
                createdById: employeeId,
                sortOrder: (maxOrder._max.sortOrder || 0) + 1,
                assignees: assigneeIds?.length > 0 ? {
                    create: assigneeIds.map(id => ({ employeeId: id }))
                } : undefined,
                activities: {
                    create: {
                        userId: employeeId,
                        action: 'created',
                        newValue: title
                    }
                }
            },
            include: {
                status: true,
                createdBy: { select: { id: true, name: true, photo: true } },
                assignees: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                _count: { select: { subtasks: true, comments: true } }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

// Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, dueDate, startDate, timeEstimate, statusId, sortOrder, isArchived, listId } = req.body;
        const employeeId = req.user.employeeId;

        // Get existing task for comparison
        const existing = await prisma.listTask.findFirst({
            where: {
                id: parseInt(id),
                list: {
                    space: {
                        OR: [
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                }
            },
            include: { status: true }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }

        // Track changes for activity log
        const activities = [];

        if (title !== undefined && title !== existing.title) {
            activities.push({ userId: employeeId, action: 'updated', field: 'title', oldValue: existing.title, newValue: title });
        }
        if (statusId !== undefined && statusId !== existing.statusId) {
            activities.push({ userId: employeeId, action: 'status_changed', field: 'status', oldValue: existing.status?.name, newValue: statusId.toString() });
        }
        if (priority !== undefined && priority !== existing.priority) {
            activities.push({ userId: employeeId, action: 'updated', field: 'priority', oldValue: existing.priority, newValue: priority });
        }

        const task = await prisma.listTask.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                priority,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
                startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
                timeEstimate,
                statusId,
                sortOrder,
                isArchived,
                listId: listId ? parseInt(listId) : undefined,
                activities: activities.length > 0 ? {
                    create: activities
                } : undefined
            },
            include: {
                status: true,
                createdBy: { select: { id: true, name: true, photo: true } },
                assignees: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                tags: {
                    include: { tag: true }
                },
                _count: { select: { subtasks: true, comments: true } }
            }
        });

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        // Verify access
        const existing = await prisma.listTask.findFirst({
            where: {
                id: parseInt(id),
                list: {
                    space: {
                        OR: [
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                }
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to delete this task' });
        }

        await prisma.listTask.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

// Add assignee to task
const addTaskAssignee = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId: assigneeId } = req.body;
        const employeeId = req.user.employeeId;

        // Verify access
        const task = await prisma.listTask.findFirst({
            where: {
                id: parseInt(id),
                list: {
                    space: {
                        OR: [
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                }
            }
        });

        if (!task) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const assignee = await prisma.listTaskAssignee.create({
            data: {
                taskId: parseInt(id),
                employeeId: assigneeId
            },
            include: {
                employee: { select: { id: true, name: true, photo: true } }
            }
        });

        // Log activity
        await prisma.taskActivity.create({
            data: {
                taskId: parseInt(id),
                userId: employeeId,
                action: 'assigned',
                newValue: assigneeId
            }
        });

        res.status(201).json(assignee);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Assignee already added' });
        }
        console.error('Error adding assignee:', error);
        res.status(500).json({ error: 'Failed to add assignee' });
    }
};

// Remove assignee from task
const removeTaskAssignee = async (req, res) => {
    try {
        const { id, assigneeId } = req.params;
        const employeeId = req.user.employeeId;

        // Verify access
        const task = await prisma.listTask.findFirst({
            where: {
                id: parseInt(id),
                list: {
                    space: {
                        OR: [
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                }
            }
        });

        if (!task) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.listTaskAssignee.delete({
            where: { id: parseInt(assigneeId) }
        });

        res.json({ message: 'Assignee removed successfully' });
    } catch (error) {
        console.error('Error removing assignee:', error);
        res.status(500).json({ error: 'Failed to remove assignee' });
    }
};

// Add comment to task
const addTaskComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;
        const employeeId = req.user.employeeId;

        // Verify access
        const task = await prisma.listTask.findFirst({
            where: {
                id: parseInt(id),
                list: {
                    space: {
                        OR: [
                            { isPrivate: false },
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                }
            }
        });

        if (!task) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const comment = await prisma.taskComment.create({
            data: {
                taskId: parseInt(id),
                authorId: employeeId,
                content,
                parentId: parentId ? parseInt(parentId) : null
            },
            include: {
                author: { select: { id: true, name: true, photo: true } }
            }
        });

        // Log activity
        await prisma.taskActivity.create({
            data: {
                taskId: parseInt(id),
                userId: employeeId,
                action: 'commented',
                newValue: content.substring(0, 100)
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

// Update comment
const updateTaskComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const employeeId = req.user.employeeId;

        // Verify ownership
        const existing = await prisma.taskComment.findFirst({
            where: {
                id: parseInt(commentId),
                authorId: employeeId
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Can only edit your own comments' });
        }

        const comment = await prisma.taskComment.update({
            where: { id: parseInt(commentId) },
            data: { content, isEdited: true },
            include: {
                author: { select: { id: true, name: true, photo: true } }
            }
        });

        res.json(comment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
};

// Delete comment
const deleteTaskComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const employeeId = req.user.employeeId;

        // Verify ownership
        const existing = await prisma.taskComment.findFirst({
            where: {
                id: parseInt(commentId),
                authorId: employeeId
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Can only delete your own comments' });
        }

        await prisma.taskComment.delete({
            where: { id: parseInt(commentId) }
        });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

// Reorder tasks
const reorderTasks = async (req, res) => {
    try {
        const { listId } = req.params;
        const { taskIds, statusId } = req.body;
        const employeeId = req.user.employeeId;

        // Verify list access
        const list = await prisma.list.findFirst({
            where: {
                id: parseInt(listId),
                space: {
                    OR: [
                        { members: { some: { employeeId } } },
                        { workspace: { ownerId: employeeId } },
                        { workspace: { members: { some: { employeeId } } } }
                    ]
                }
            }
        });

        if (!list) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Promise.all(
            taskIds.map((taskId, index) =>
                prisma.listTask.update({
                    where: { id: taskId },
                    data: {
                        sortOrder: index,
                        statusId: statusId ? parseInt(statusId) : undefined
                    }
                })
            )
        );

        res.json({ message: 'Tasks reordered successfully' });
    } catch (error) {
        console.error('Error reordering tasks:', error);
        res.status(500).json({ error: 'Failed to reorder tasks' });
    }
};

// Move task to different list
const moveTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { listId, statusId } = req.body;
        const employeeId = req.user.employeeId;

        // Verify access to both source and destination lists
        const [sourceTask, destList] = await Promise.all([
            prisma.listTask.findFirst({
                where: {
                    id: parseInt(id),
                    list: {
                        space: {
                            OR: [
                                { members: { some: { employeeId } } },
                                { workspace: { ownerId: employeeId } },
                                { workspace: { members: { some: { employeeId } } } }
                            ]
                        }
                    }
                }
            }),
            prisma.list.findFirst({
                where: {
                    id: parseInt(listId),
                    space: {
                        OR: [
                            { members: { some: { employeeId } } },
                            { workspace: { ownerId: employeeId } },
                            { workspace: { members: { some: { employeeId } } } }
                        ]
                    }
                },
                include: {
                    statuses: { where: { isDefault: true }, take: 1 }
                }
            })
        ]);

        if (!sourceTask || !destList) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const task = await prisma.listTask.update({
            where: { id: parseInt(id) },
            data: {
                listId: parseInt(listId),
                statusId: statusId ? parseInt(statusId) : destList.statuses[0]?.id,
                activities: {
                    create: {
                        userId: employeeId,
                        action: 'moved',
                        field: 'list',
                        oldValue: sourceTask.listId.toString(),
                        newValue: listId.toString()
                    }
                }
            },
            include: {
                status: true,
                list: { select: { id: true, name: true } }
            }
        });

        res.json(task);
    } catch (error) {
        console.error('Error moving task:', error);
        res.status(500).json({ error: 'Failed to move task' });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    addTaskAssignee,
    removeTaskAssignee,
    addTaskComment,
    updateTaskComment,
    deleteTaskComment,
    reorderTasks,
    moveTask
};
