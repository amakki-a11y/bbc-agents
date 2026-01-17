const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tasks
const cache = require('../utils/cache');

// Helper function to parse tags from DB (string) to array
const parseTags = (tagsString) => {
    if (!tagsString) return [];
    try {
        return JSON.parse(tagsString);
    } catch {
        return [];
    }
};

// Helper function to stringify tags for DB storage
const stringifyTags = (tags) => {
    if (!tags || (Array.isArray(tags) && tags.length === 0)) return null;
    if (typeof tags === 'string') return tags; // Already a string
    return JSON.stringify(tags);
};

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
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'desc' },
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

        // Parse tags from JSON string to array for each task
        const tasksWithParsedTags = tasks.map(task => ({
            ...task,
            tags: parseTags(task.tags)
        }));

        // Cache for 30 seconds
        cache.set(cacheKey, { data: tasksWithParsedTags, nextCursor }, 30);

        res.json(tasksWithParsedTags);
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
            description: description || null,
            priority: priority || 'medium',
            tags: stringifyTags(tags), // Convert array to JSON string
            due_date: due_date ? new Date(due_date) : null,
            user_id: req.user.userId,
            project_id: project_id ? parseInt(project_id) : null,
            recurrenceType: recurrenceType || null,
            recurrenceInterval: recurrenceInterval || null,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null
        };

        // Handle dependencies
        if (blockedBy && Array.isArray(blockedBy) && blockedBy.length > 0) {
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

        // Return task with tags parsed back to array
        res.status(201).json({
            ...task,
            tags: parseTags(task.tags)
        });
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

        const updateData = {};
        
        // Only include fields that are actually provided
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;
        if (description !== undefined) updateData.description = description;
        if (priority !== undefined) updateData.priority = priority;
        if (tags !== undefined) updateData.tags = stringifyTags(tags); // Convert array to JSON string
        if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
        if (project_id !== undefined) updateData.project_id = project_id ? parseInt(project_id) : null;
        if (recurrenceType !== undefined) updateData.recurrenceType = recurrenceType;
        if (recurrenceInterval !== undefined) updateData.recurrenceInterval = recurrenceInterval;
        if (recurrenceEndDate !== undefined) updateData.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;

        // Handle Dependencies
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

        const task = await prisma.task.update({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: updateData,
            include: { blockedBy: true, blocking: true }
        });

        // Recurrence Logic placeholder
        if (status === 'done' && task.recurrenceType) {
            // Logic to spawn next task could go here
        }

        cache.delByPrefix(`tasks:${req.user.userId}`);

        // Return task with tags parsed back to array
        res.json({
            ...task,
            tags: parseTags(task.tags)
        });
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
        const { taskIds, updates } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ error: 'No task IDs provided' });
        }

        const allowedUpdates = ['status', 'priority', 'project_id', 'due_date', 'tags'];
        const cleanUpdates = {};

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                if (key === 'project_id') cleanUpdates[key] = updates[key] ? parseInt(updates[key]) : null;
                else if (key === 'due_date') cleanUpdates[key] = updates[key] ? new Date(updates[key]) : null;
                else if (key === 'tags') cleanUpdates[key] = stringifyTags(updates[key]); // Convert tags
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

        cache.set(cacheKey, events, 60);
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
