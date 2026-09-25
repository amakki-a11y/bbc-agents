const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const manager = require('../services/meetingAgent/sessionManager');
const { createNotification } = require('../services/notificationService');

const PRIORITIES = ['low', 'medium', 'high'];

const parseNotes = (notes) => {
    try {
        return notes ? JSON.parse(notes) : null;
    } catch {
        return null;
    }
};

// Loads a session the current employee owns, or sends 403/404
const loadOwnSession = async (req, res, id = req.params.id) => {
    if (!req.employee) {
        res.status(403).json({ error: 'Employee profile required' });
        return null;
    }
    const session = await prisma.meetingSession.findUnique({ where: { id } });
    if (!session) {
        res.status(404).json({ error: 'Meeting session not found' });
        return null;
    }
    if (session.owner_id !== req.employee.id) {
        res.status(403).json({ error: 'Not your meeting session' });
        return null;
    }
    return session;
};

// POST /meeting-agent/sessions
const startSession = async (req, res) => {
    try {
        if (!req.employee) return res.status(403).json({ error: 'Employee profile required' });
        const title = (req.body.title || '').trim().slice(0, 200) || 'Untitled meeting';
        const meetUrl = (req.body.meet_url || '').trim().slice(0, 500) || null;

        // Re-use an open session for the same Meet link (e.g. extension restarted)
        if (meetUrl) {
            const open = await prisma.meetingSession.findFirst({
                where: { owner_id: req.employee.id, meet_url: meetUrl, status: 'recording' },
                orderBy: { started_at: 'desc' }
            });
            if (open) return res.json(open);
        }

        const session = await prisma.meetingSession.create({
            data: { title, meet_url: meetUrl, owner_id: req.employee.id }
        });
        res.status(201).json(session);
    } catch (error) {
        console.error('startSession error:', error);
        res.status(500).json({ error: 'Failed to start meeting session' });
    }
};

// GET /meeting-agent/sessions
const listSessions = async (req, res) => {
    try {
        if (!req.employee) return res.status(403).json({ error: 'Employee profile required' });
        const sessions = await prisma.meetingSession.findMany({
            where: { owner_id: req.employee.id },
            orderBy: { started_at: 'desc' },
            take: 100,
            select: {
                id: true, title: true, meet_url: true, status: true,
                started_at: true, ended_at: true, summary_en: true, error: true,
                _count: { select: { actionItems: true, segments: true } }
            }
        });
        res.json(sessions);
    } catch (error) {
        console.error('listSessions error:', error);
        res.status(500).json({ error: 'Failed to load meeting sessions' });
    }
};

// GET /meeting-agent/sessions/:id
const getSession = async (req, res) => {
    try {
        const session = await loadOwnSession(req, res);
        if (!session) return;

        const [segments, actionItems] = await Promise.all([
            prisma.meetingTranscriptSegment.findMany({
                where: { session_id: session.id },
                orderBy: { offset_ms: 'asc' },
                select: { id: true, kind: true, text: true, speaker: true, language: true, offset_ms: true }
            }),
            prisma.meetingActionItem.findMany({
                where: { session_id: session.id },
                orderBy: { created_at: 'asc' },
                include: { assignee: { select: { id: true, name: true } } }
            })
        ]);

        res.json({
            ...session,
            notes: parseNotes(session.notes),
            live: manager.isLive(session.id),
            segments,
            actionItems
        });
    } catch (error) {
        console.error('getSession error:', error);
        res.status(500).json({ error: 'Failed to load meeting session' });
    }
};

// GET /meeting-agent/sessions/:id/screenshots/:segmentId
const getScreenshot = async (req, res) => {
    try {
        const session = await loadOwnSession(req, res);
        if (!session) return;
        const segment = await prisma.meetingTranscriptSegment.findFirst({
            where: { id: req.params.segmentId, session_id: session.id, kind: 'screen' }
        });
        if (!segment?.image_path || !fs.existsSync(segment.image_path)) {
            return res.status(404).json({ error: 'Screenshot not found' });
        }
        res.type('jpeg').sendFile(path.resolve(segment.image_path));
    } catch (error) {
        console.error('getScreenshot error:', error);
        res.status(500).json({ error: 'Failed to load screenshot' });
    }
};

// POST /meeting-agent/sessions/:id/stop
const stopSession = async (req, res) => {
    try {
        const session = await loadOwnSession(req, res);
        if (!session) return;
        if (session.status !== 'recording') {
            return res.status(409).json({ error: `Meeting is already ${session.status}` });
        }
        manager.finishSession(session.id); // background: notes take ~1 minute
        res.status(202).json({ id: session.id, status: 'processing' });
    } catch (error) {
        console.error('stopSession error:', error);
        res.status(500).json({ error: 'Failed to stop meeting session' });
    }
};

// POST /meeting-agent/sessions/:id/regenerate
const regenerateNotes = async (req, res) => {
    try {
        const session = await loadOwnSession(req, res);
        if (!session) return;
        if (!['ready', 'failed'].includes(session.status)) {
            return res.status(409).json({ error: `Meeting is ${session.status}` });
        }
        await prisma.meetingSession.update({
            where: { id: session.id },
            data: { status: 'processing', error: null }
        });
        manager.buildNotes(session.id).catch(async (error) => {
            console.error('regenerateNotes error:', error.message);
            await prisma.meetingSession.update({
                where: { id: session.id },
                data: { status: 'failed', error: error.message }
            });
        });
        res.status(202).json({ id: session.id, status: 'processing' });
    } catch (error) {
        console.error('regenerateNotes error:', error);
        res.status(500).json({ error: 'Failed to regenerate notes' });
    }
};

// PATCH /meeting-agent/action-items/:itemId
const updateActionItem = async (req, res) => {
    try {
        const item = await prisma.meetingActionItem.findUnique({ where: { id: req.params.itemId } });
        if (!item) return res.status(404).json({ error: 'Action item not found' });
        const session = await loadOwnSession(req, res, item.session_id);
        if (!session) return;
        if (item.status === 'created') {
            return res.status(409).json({ error: 'This action item is already a task' });
        }

        const { title, title_ar, description, assignee_employee_id, due_date, priority, status } = req.body;
        const data = {};
        if (typeof title === 'string' && title.trim()) data.title = title.trim().slice(0, 300);
        if (typeof title_ar === 'string') data.title_ar = title_ar.trim().slice(0, 300);
        if (typeof description === 'string') data.description = description.slice(0, 5000);
        if (PRIORITIES.includes(priority)) data.priority = priority;
        if (['draft', 'dismissed'].includes(status)) data.status = status;
        if (due_date !== undefined) {
            const date = due_date ? new Date(due_date) : null;
            if (date && isNaN(date)) return res.status(400).json({ error: 'Invalid due date' });
            data.due_date = date;
        }
        if (assignee_employee_id !== undefined) {
            if (assignee_employee_id) {
                const exists = await prisma.employee.findUnique({ where: { id: assignee_employee_id }, select: { id: true } });
                if (!exists) return res.status(400).json({ error: 'Unknown employee' });
            }
            data.assignee_employee_id = assignee_employee_id || null;
        }

        const updated = await prisma.meetingActionItem.update({
            where: { id: item.id },
            data,
            include: { assignee: { select: { id: true, name: true } } }
        });
        res.json(updated);
    } catch (error) {
        console.error('updateActionItem error:', error);
        res.status(500).json({ error: 'Failed to update action item' });
    }
};

// POST /meeting-agent/sessions/:id/create-tasks  { itemIds?: string[] }
const createTasks = async (req, res) => {
    try {
        const session = await loadOwnSession(req, res);
        if (!session) return;

        const where = { session_id: session.id, status: 'draft' };
        if (Array.isArray(req.body.itemIds) && req.body.itemIds.length) {
            where.id = { in: req.body.itemIds };
        }
        const items = await prisma.meetingActionItem.findMany({
            where,
            include: { assignee: { select: { id: true, name: true, user_id: true } } }
        });

        const created = [];
        for (const item of items) {
            // Tasks belong to a user account; fall back to the organizer
            const userId = item.assignee?.user_id || req.user.userId;
            const description = [
                item.description,
                item.title_ar ? `\n${item.title_ar}` : '',
                `\nFrom meeting: ${session.title} (${new Date(session.started_at).toLocaleDateString()})`,
                item.owner_name && !item.assignee ? `Owner mentioned in meeting: ${item.owner_name}` : ''
            ].filter(Boolean).join('\n');

            const task = await prisma.task.create({
                data: {
                    title: item.title,
                    description,
                    status: 'todo',
                    priority: item.priority,
                    tags: 'meeting',
                    due_date: item.due_date,
                    user_id: userId,
                    isAIGenerated: true,
                    aiGeneratedBy: 'meeting-agent'
                }
            });
            await prisma.meetingActionItem.update({
                where: { id: item.id },
                data: { status: 'created', task_id: task.id }
            });

            if (userId !== req.user.userId) {
                await createNotification({
                    userId,
                    type: 'task_assigned',
                    message: `${req.employee.name} assigned you "${item.title}" from the meeting "${session.title}"`,
                    taskId: task.id
                }).catch(() => {});
            }
            created.push({ itemId: item.id, taskId: task.id, assignee: item.assignee?.name || null });
        }

        res.status(201).json({ created: created.length, tasks: created });
    } catch (error) {
        console.error('createTasks error:', error);
        res.status(500).json({ error: 'Failed to create tasks' });
    }
};

// DELETE /meeting-agent/sessions/:id
const deleteSession = async (req, res) => {
    try {
        const session = await loadOwnSession(req, res);
        if (!session) return;
        if (session.status === 'recording' || session.status === 'processing') {
            return res.status(409).json({ error: 'Stop the meeting before deleting it' });
        }
        const shots = await prisma.meetingTranscriptSegment.findMany({
            where: { session_id: session.id, kind: 'screen' },
            select: { image_path: true }
        });
        await prisma.meetingSession.delete({ where: { id: session.id } });
        for (const shot of shots) {
            if (shot.image_path) fs.promises.unlink(shot.image_path).catch(() => {});
        }
        res.json({ deleted: true });
    } catch (error) {
        console.error('deleteSession error:', error);
        res.status(500).json({ error: 'Failed to delete meeting session' });
    }
};

// GET /meeting-agent/assignees - people an action item can be given to
const listAssignees = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: { status: { notIn: ['terminated', 'resigned'] } },
            select: { id: true, name: true, jobTitle: true },
            orderBy: { name: 'asc' }
        });
        res.json(employees);
    } catch (error) {
        console.error('listAssignees error:', error);
        res.status(500).json({ error: 'Failed to load employees' });
    }
};

module.exports = {
    startSession,
    listSessions,
    getSession,
    getScreenshot,
    stopSession,
    regenerateNotes,
    updateActionItem,
    createTasks,
    deleteSession,
    listAssignees
};
