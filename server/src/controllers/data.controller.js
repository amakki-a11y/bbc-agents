const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tasks
const cache = require('../utils/cache');

// Tasks
const getTasks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : undefined;
        // Search filters
        const { status, project_id, search } = req.query;

        // Cache key based on user and query params
        const cacheKey = `tasks:${req.user.userId}:${JSON.stringify(req.query)}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            // Restore headers if saved, or just send data
            // Since we might have pagination headers, we should cache those too effectively
            // But for now, let's cache the simple response body. 
            // Cursor pagination headers: 'X-Next-Cursor'
            // If we cache the result, we need to know the cursor state. 
            // Let's store object { data: tasks, nextCursor: ... } in cache
            if (cachedData.nextCursor) {
                res.set('X-Next-Cursor', cachedData.nextCursor);
            }
            return res.json(cachedData.data);
        }

        const where = {
            user_id: req.user.userId,
            ...(status && { status }),
            ...(project_id && { project_id: parseInt(project_id) }),
            ...(search && {
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } }
                ]
            })
        };

        const tasks = await prisma.task.findMany({
            where,
            take: limit + 1, // Fetch one extra to check for next page
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'desc' }, // or created_at, but id is unique and good for cursor
            include: {
                blockedBy: { select: { id: true, title: true, status: true } },
                blocking: { select: { id: true, title: true, status: true } }
            }
        });

        let nextCursor = undefined;
        if (tasks.length > limit) {
            const nextItem = tasks.pop();
            nextCursor = nextItem.id;
        }

        if (nextCursor) {
            res.set('X-Next-Cursor', nextCursor.toString());
        }

        // Cache for 30 seconds
        cache.set(cacheKey, { data: tasks, nextCursor }, 30);

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

const createTask = async (req, res) => {
    try {
        const {
            title, due_date, description, priority, tags, project_id,
            recurrenceType, recurrenceInterval, recurrenceEndDate,
            blockedBy // array of task IDs
        } = req.body;

        const taskData = {
            title,
            description,
            priority,
            tags,
            due_date: due_date ? new Date(due_date) : null,
            user_id: req.user.userId,
            project_id: project_id ? parseInt(project_id) : null,
            recurrenceType,
            recurrenceInterval,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null
        };

        // Handle dependencies
        if (blockedBy && Array.isArray(blockedBy)) {
            taskData.blockedBy = {
                connect: blockedBy.map(id => ({ id: parseInt(id) }))
            };
        }

        const task = await prisma.task.create({
            data: taskData,
            include: {
                blockedBy: true
            }
        });

        cache.delByPrefix(`tasks:${req.user.userId}`);

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, status, due_date, description, priority, tags, project_id,
            recurrenceType, recurrenceInterval, recurrenceEndDate,
            blockedBy, // IDs to SET as blockedBy
            addBlockedBy, // IDs to ADD
            removeBlockedBy // IDs to REMOVE
        } = req.body;

        const updateData = {
            title,
            status,
            description,
            priority,
            tags,
            due_date: due_date ? new Date(due_date) : undefined,
            project_id: project_id ? parseInt(project_id) : undefined,
            recurrenceType,
            recurrenceInterval,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
        };

        // Handle Dependencies
        // Strategy: We can use 'set', 'connect', 'disconnect'
        if (blockedBy) {
            updateData.blockedBy = {
                set: blockedBy.map(tid => ({ id: parseInt(tid) }))
            };
        } else if (addBlockedBy || removeBlockedBy) {
            updateData.blockedBy = {};
            if (addBlockedBy) {
                updateData.blockedBy.connect = addBlockedBy.map(tid => ({ id: parseInt(tid) }));
            }
            if (removeBlockedBy) {
                updateData.blockedBy.disconnect = removeBlockedBy.map(tid => ({ id: parseInt(tid) }));
            }
        }

        // Circular dependency check could be done here if strictly required
        // simplistic check: ensure we don't start blocking something that blocks us (recursive check needed for full graph)
        // For now, relying on basic logic, but a robust system needs graph cycle detection.

        const task = await prisma.task.update({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: updateData,
            include: { blockedBy: true, blocking: true }
        });

        // Recurrence Logic: If task completed and is recurring, create next instance
        // This is a simplified version. A robust one would check previous state.
        if (status === 'done' && task.recurrenceType) {
            // Logic to spawn next task could go here or in a separate service
            // For simplicity, we might implement a 'checkRecurring' utility later
        }

        cache.delByPrefix(`tasks:${req.user.userId}`);

        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id: parseInt(id), user_id: req.user.userId } });

        cache.delByPrefix(`tasks:${req.user.userId}`);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

// Bulk Operations
const bulkUpdateTasks = async (req, res) => {
    try {
        const { taskIds, updates } = req.body; // taskIds: [], updates: { status: 'done', ... }

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ error: 'No task IDs provided' });
        }

        const allowedUpdates = ['status', 'priority', 'project_id', 'due_date', 'tags'];
        const cleanUpdates = {};

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                if (key === 'project_id') cleanUpdates[key] = updates[key] ? parseInt(updates[key]) : null;
                else if (key === 'due_date') cleanUpdates[key] = updates[key] ? new Date(updates[key]) : null;
                else cleanUpdates[key] = updates[key];
            }
        });

        const result = await prisma.task.updateMany({
            where: {
                id: { in: taskIds.map(id => parseInt(id)) },
                user_id: req.user.userId
            },
            data: cleanUpdates
        });

        cache.delByPrefix(`tasks:${req.user.userId}`);

        res.json({ message: 'Tasks updated', count: result.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to bulk update tasks' });
    }
};

const bulkDeleteTasks = async (req, res) => {
    try {
        const { taskIds } = req.body;

        if (!taskIds || !Array.isArray(taskIds)) {
            return res.status(400).json({ error: 'No task IDs provided' });
        }

        const result = await prisma.task.deleteMany({
            where: {
                id: { in: taskIds.map(id => parseInt(id)) },
                user_id: req.user.userId
            }
        });

        cache.delByPrefix(`tasks:${req.user.userId}`);

        res.json({ message: 'Tasks deleted', count: result.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to bulk delete tasks' });
    }
};

// Events
const getEvents = async (req, res) => {
    try {
        const cacheKey = `events:${req.user.userId}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            res.set('X-Cache', 'HIT');
            return res.json(cachedData);
        }

        const events = await prisma.event.findMany({ where: { user_id: req.user.userId } });

        cache.set(cacheKey, events, 60); // Cache for 1 minute
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

const createEvent = async (req, res) => {
    try {
        const { title, start_time, end_time, description } = req.body;
        const event = await prisma.event.create({
            data: {
                title,
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                description,
                user_id: req.user.userId,
            },
        });

        cache.delByPrefix(`events:${req.user.userId}`);

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create event' });
    }
};

const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start_time, end_time, description } = req.body;
        const event = await prisma.event.update({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: {
                title,
                start_time: start_time ? new Date(start_time) : undefined,
                end_time: end_time ? new Date(end_time) : undefined,
                description,
            },
        });

        cache.delByPrefix(`events:${req.user.userId}`);

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id: parseInt(id), user_id: req.user.userId } });

        cache.delByPrefix(`events:${req.user.userId}`);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    bulkDeleteTasks,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
};
