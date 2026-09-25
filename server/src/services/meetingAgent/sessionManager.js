const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../../lib/prisma');
const { LiveTranscriber } = require('./geminiLive');
const { generateMeetingNotes } = require('./notes');

/**
 * Keeps one live Gemini transcriber per recording meeting session and
 * fans transcript updates out to every connected socket (extension, web page).
 */

// Dot-folder: express.static ignores dotfiles, so screenshots are only
// reachable through the authenticated API, never through /uploads.
const UPLOAD_BASE = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '../../../uploads');
const SCREENSHOT_DIR = path.join(UPLOAD_BASE, '.meeting-agent');

const MAX_SCREENSHOTS = 300;
const MIN_SCREENSHOT_GAP_MS = 4000;
const MIN_PRESENTATION_GAP_MS = 1500;   // shared screens change often (slides, scrolling)
const MAX_SCREENSHOT_BYTES = 1.9 * 1024 * 1024;

const live = new Map(); // sessionId -> { transcriber, sockets, startedAt, screenshots, lastShotAt, status }

const broadcast = (entry, message) => {
    const data = JSON.stringify(message);
    for (const ws of entry.sockets) {
        if (ws.readyState === 1) ws.send(data);
    }
};

const offsetFor = (entry) => Math.max(0, Date.now() - entry.startedAt);

const MAX_NAMES = 100;
const MAX_SPEAKER_EVENTS = 2000;

/**
 * Who spoke during [start, end]? `log` is [{ t, name }] (ms offsets, oldest first);
 * each name counts from its event until the next one. Returns the main speaker,
 * or "A / B" when a second person spoke for at least a quarter of the time.
 */
const pickSpeaker = (log, start, end) => {
    const time = new Map();
    for (let i = 0; i < log.length; i++) {
        const from = Math.max(log[i].t, start);
        const to = Math.min(i + 1 < log.length ? log[i + 1].t : end, end);
        if (to > from) time.set(log[i].name, (time.get(log[i].name) || 0) + (to - from));
    }
    const ranked = [...time.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return null;
    const total = ranked.reduce((sum, [, ms]) => sum + ms, 0);
    const names = ranked.filter(([, ms], i) => i === 0 || ms / total >= 0.25).slice(0, 2).map(([n]) => n);
    return names.join(' / ');
};

// No real title yet: empty, the default, or just the Meet code (e.g. "fji-cjdg-yxh")
const needsTitle = (title) => !title || title === 'Untitled meeting' || /^[a-z]{3,4}-[a-z]{4}-[a-z]{3,4}$/i.test(title.trim());

const cleanName = (n) => (typeof n === 'string' ? n.replace(/\s+/g, ' ').trim().slice(0, 80) : '');

const getOrStartLive = async (session) => {
    let entry = live.get(session.id);
    if (entry) return entry;

    const transcriber = new LiveTranscriber();
    entry = {
        transcriber,
        sockets: new Set(),
        startedAt: new Date(session.started_at).getTime(),
        screenshots: await prisma.meetingTranscriptSegment.count({ where: { session_id: session.id, kind: 'screen' } }),
        lastShotAt: 0,
        status: 'connecting',
        participants: new Set(JSON.parse(session.participants || '[]')),
        speakerLog: [],          // [{ t, name }] from Meet's captions
        utteranceStart: null    // when the words of the next segment started
    };
    live.set(session.id, entry);

    transcriber.on('segment', async ({ text, speaker, language }) => {
        const end = offsetFor(entry);
        // Gemini gives no names; use who Meet showed as speaking while these words were said
        const start = entry.utteranceStart ?? end - 5000;
        entry.utteranceStart = null;
        speaker = speaker || pickSpeaker(entry.speakerLog, start - 1500, end);
        try {
            const segment = await prisma.meetingTranscriptSegment.create({
                data: {
                    session_id: session.id,
                    kind: 'speech',
                    text,
                    speaker,
                    language,
                    offset_ms: Math.max(0, start)
                }
            });
            broadcast(entry, { type: 'segment', segment });
        } catch (error) {
            console.error('[MeetingAgent] failed to save segment:', error.message);
        }
    });
    transcriber.on('interim', ({ text }) => {
        if (entry.utteranceStart === null) entry.utteranceStart = offsetFor(entry);
        broadcast(entry, { type: 'interim', text });
    });
    transcriber.on('status', (status) => {
        entry.status = status;
        broadcast(entry, { type: 'status', status });
    });
    transcriber.on('error', (error) => {
        console.error(`[MeetingAgent] Gemini (${session.id}):`, error.message);
        broadcast(entry, { type: 'warning', message: error.message });
    });

    try {
        await transcriber.start();
    } catch (error) {
        live.delete(session.id);
        throw error;
    }
    return entry;
};

const addSocket = (entry, ws) => {
    entry.sockets.add(ws);
    ws.send(JSON.stringify({ type: 'status', status: entry.status }));
};

const removeSocket = (sessionId, ws) => {
    live.get(sessionId)?.sockets.delete(ws);
};

const pushAudio = (sessionId, pcm) => {
    live.get(sessionId)?.transcriber.sendAudio(pcm);
};

const pushScreenshot = async (sessionId, jpeg, { presentation = false } = {}) => {
    const entry = live.get(sessionId);
    if (!entry) return;
    const now = Date.now();
    if (entry.screenshots >= MAX_SCREENSHOTS) return;
    if (now - entry.lastShotAt < (presentation ? MIN_PRESENTATION_GAP_MS : MIN_SCREENSHOT_GAP_MS)) return;
    if (jpeg.length > MAX_SCREENSHOT_BYTES) return;
    // JPEG files start with FF D8 FF
    if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8 || jpeg[2] !== 0xff) return;

    entry.lastShotAt = now;
    entry.screenshots += 1;

    const dir = path.join(SCREENSHOT_DIR, sessionId);
    await fs.promises.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${crypto.randomBytes(12).toString('hex')}.jpg`);
    await fs.promises.writeFile(file, jpeg);

    const segment = await prisma.meetingTranscriptSegment.create({
        data: {
            session_id: sessionId,
            kind: 'screen',
            text: presentation ? 'presentation' : null,   // marks a cropped shared screen
            image_path: file,
            offset_ms: offsetFor(entry)
        }
    });
    broadcast(entry, { type: 'screenshot', segment: { id: segment.id, offset_ms: segment.offset_ms, text: segment.text } });
};

const stopLive = async (sessionId) => {
    const entry = live.get(sessionId);
    if (!entry) return;
    live.delete(sessionId);
    await entry.transcriber.stop();
    // Give the last transcript segment a moment to be written
    await new Promise(r => setTimeout(r, 300));
    return entry;
};

/**
 * Stop recording and ask Claude for the notes. Runs in the background;
 * status goes processing -> ready | failed.
 */
const finishSession = async (sessionId) => {
    // Only the first stop request wins (extension and web page can both send one)
    const { count } = await prisma.meetingSession.updateMany({
        where: { id: sessionId, status: 'recording' },
        data: { status: 'processing', ended_at: new Date(), error: null }
    });
    if (count === 0) return;

    const entry = await stopLive(sessionId);
    if (entry) broadcast(entry, { type: 'status', status: 'processing' });

    try {
        await buildNotes(sessionId);
        if (entry) broadcast(entry, { type: 'status', status: 'ready' });
    } catch (error) {
        console.error(`[MeetingAgent] notes failed (${sessionId}):`, error.message);
        await prisma.meetingSession.update({
            where: { id: sessionId },
            data: { status: 'failed', error: error.message }
        });
        if (entry) broadcast(entry, { type: 'status', status: 'failed', message: error.message });
    }
    if (entry) {
        for (const ws of entry.sockets) ws.close(1000, 'meeting finished');
    }
};

const buildNotes = async (sessionId) => {
    const session = await prisma.meetingSession.findUnique({ where: { id: sessionId } });
    const segments = await prisma.meetingTranscriptSegment.findMany({
        where: { session_id: sessionId },
        orderBy: { offset_ms: 'asc' }
    });
    const employees = await prisma.employee.findMany({
        where: { status: { notIn: ['terminated', 'resigned'] } },
        select: { id: true, name: true, email: true, jobTitle: true },
        orderBy: { name: 'asc' }
    });

    const notes = await generateMeetingNotes({ session, segments, employees });
    const employeeIds = new Set(employees.map(e => e.id));

    await prisma.$transaction([
        // Regenerating replaces drafts but keeps items that already became tasks
        prisma.meetingActionItem.deleteMany({ where: { session_id: sessionId, status: 'draft' } }),
        prisma.meetingActionItem.createMany({
            data: notes.action_items.map(item => ({
                session_id: sessionId,
                title: item.title_en,
                title_ar: item.title_ar,
                description: item.description,
                owner_name: item.owner_name,
                assignee_employee_id: employeeIds.has(item.assignee_employee_id) ? item.assignee_employee_id : null,
                due_date: item.due_date ? new Date(`${item.due_date}T12:00:00Z`) : null,
                priority: item.priority
            }))
        }),
        prisma.meetingSession.update({
            where: { id: sessionId },
            data: {
                status: 'ready',
                title: needsTitle(session.title) ? notes.title : session.title,
                summary_en: notes.summary_en,
                summary_ar: notes.summary_ar,
                notes: JSON.stringify({
                    key_points: notes.key_points,
                    decisions: notes.decisions,
                    screen_highlights: notes.screen_highlights
                }),
                error: null
            }
        })
    ]);
};

const isLive = (sessionId) => live.has(sessionId);

/** Attendees and current speaker read from the Meet page by the extension. */
const updateMeetInfo = async (sessionId, { participants, speaker }) => {
    const entry = live.get(sessionId);
    if (!entry) return;
    const before = entry.participants.size;

    const name = cleanName(speaker);
    if (name) {
        const last = entry.speakerLog[entry.speakerLog.length - 1];
        if (!last || last.name !== name) {
            entry.speakerLog.push({ t: offsetFor(entry), name });
            if (entry.speakerLog.length > MAX_SPEAKER_EVENTS) entry.speakerLog.shift();
        }
        if (entry.participants.size < MAX_NAMES) entry.participants.add(name);
    }

    // Keep everyone who was there at any point (people who left still attended)
    if (Array.isArray(participants)) {
        for (const p of participants.slice(0, MAX_NAMES)) {
            const n = cleanName(p);
            if (n && entry.participants.size < MAX_NAMES) entry.participants.add(n);
        }
    }
    if (entry.participants.size !== before) {
        const list = [...entry.participants].sort();
        await prisma.meetingSession.update({
            where: { id: sessionId },
            data: { participants: JSON.stringify(list) }
        });
        broadcast(entry, { type: 'participants', participants: list });
    }
};

/** Stop streaming to Gemini but keep the session open (extension went away). */
const pauseLive = async (sessionId) => {
    const entry = await stopLive(sessionId);
    if (entry) broadcast(entry, { type: 'status', status: 'waiting_for_extension' });
};

module.exports = {
    getOrStartLive,
    addSocket,
    removeSocket,
    pushAudio,
    pushScreenshot,
    finishSession,
    buildNotes,
    isLive,
    pauseLive,
    updateMeetInfo,
    pickSpeaker,
    needsTitle
};
