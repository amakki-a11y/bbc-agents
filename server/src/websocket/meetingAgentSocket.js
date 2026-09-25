const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const manager = require('../services/meetingAgent/sessionManager');

/**
 * WebSocket endpoint for the meeting agent.
 *
 *   /ws/meeting-agent?sessionId=...&token=...&role=capture|viewer
 *
 * capture (Chrome extension) sends binary frames:
 *   0x01 + PCM16 mono 16 kHz audio
 *   0x02 + JPEG screenshot
 *   0x03 + JPEG of a shared screen (cropped)
 * and JSON text frames: { "type": "stop" }
 *
 * The server sends JSON: status | segment | screenshot | warning | error
 */

const PATH = '/ws/meeting-agent';
const FRAME_AUDIO = 0x01;
const FRAME_SCREEN = 0x02;
const FRAME_PRESENTATION = 0x03; // screenshot cropped to a shared screen
const IDLE_STOP_MS = 2 * 60 * 1000; // pause Gemini if the extension is gone this long
const MAX_FRAME_BYTES = 2 * 1024 * 1024;

const captureCount = new Map(); // sessionId -> open capture sockets
const idleTimers = new Map();

const fail = (ws, code, message) => {
    try {
        ws.send(JSON.stringify({ type: 'error', message }));
    } catch { /* ignore */ }
    ws.close(code, message);
};

const authenticate = async (token, sessionId) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await prisma.employee.findUnique({ where: { user_id: payload.userId } });
    if (!employee) return { error: 'Employee profile required' };

    const session = await prisma.meetingSession.findUnique({ where: { id: sessionId } });
    if (!session) return { error: 'Meeting session not found' };
    if (session.owner_id !== employee.id) return { error: 'Not your meeting session' };
    return { session };
};

const handleConnection = async (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const sessionId = url.searchParams.get('sessionId');
    const token = url.searchParams.get('token');
    const isCapture = url.searchParams.get('role') === 'capture';

    // Frames that arrive while we authenticate are dropped
    let ready = false;
    ws.on('message', async (data, isBinary) => {
        if (!ready) return;
        try {
            if (isBinary) {
                if (!isCapture || data.length < 2 || data.length > MAX_FRAME_BYTES) return;
                const kind = data[0];
                const body = data.subarray(1);
                if (kind === FRAME_AUDIO) manager.pushAudio(sessionId, body);
                else if (kind === FRAME_SCREEN) await manager.pushScreenshot(sessionId, body);
                else if (kind === FRAME_PRESENTATION) await manager.pushScreenshot(sessionId, body, { presentation: true });
                return;
            }
            const msg = JSON.parse(data.toString());
            if (msg.type === 'stop' && isCapture) {
                manager.finishSession(sessionId);
            } else if (msg.type === 'meet-info' && isCapture) {
                await manager.updateMeetInfo(sessionId, msg);
            } else if (msg.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }
        } catch (error) {
            console.error('[MeetingAgent] socket message error:', error.message);
        }
    });

    let auth;
    try {
        if (!sessionId || !token) return fail(ws, 4400, 'sessionId and token are required');
        auth = await authenticate(token, sessionId);
    } catch {
        return fail(ws, 4401, 'Invalid or expired token');
    }
    if (auth.error) return fail(ws, 4403, auth.error);
    if (ws.readyState !== 1) return;

    const { session } = auth;
    if (session.status !== 'recording') {
        ws.send(JSON.stringify({ type: 'status', status: session.status }));
        if (isCapture) ws.close(1000, 'meeting already finished');
        return;
    }

    let entry;
    try {
        entry = isCapture || manager.isLive(sessionId)
            ? await manager.getOrStartLive(session)
            : null;
    } catch (error) {
        return fail(ws, 4500, error.message);
    }

    if (!entry) {
        // Viewer of a meeting whose extension is not connected right now
        ws.send(JSON.stringify({ type: 'status', status: 'waiting_for_extension' }));
    } else {
        manager.addSocket(entry, ws);
    }

    if (isCapture) {
        clearTimeout(idleTimers.get(sessionId));
        idleTimers.delete(sessionId);
        captureCount.set(sessionId, (captureCount.get(sessionId) || 0) + 1);
    }
    ready = true;

    ws.on('close', () => {
        manager.removeSocket(sessionId, ws);
        if (!isCapture) return;
        const left = (captureCount.get(sessionId) || 1) - 1;
        captureCount.set(sessionId, left);
        if (left > 0) return;
        captureCount.delete(sessionId);
        // Extension disconnected: keep the meeting open for a while in case it reconnects
        idleTimers.set(sessionId, setTimeout(async () => {
            idleTimers.delete(sessionId);
            if (!captureCount.get(sessionId)) {
                await manager.pauseLive(sessionId);
            }
        }, IDLE_STOP_MS));
    });
};

const attachMeetingAgentSocket = (server) => {
    const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_FRAME_BYTES });

    server.on('upgrade', (req, socket, head) => {
        if (!req.url.startsWith(PATH)) return; // socket.io handles its own path
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    });

    // Keep connections alive through proxies (Railway closes idle sockets)
    const interval = setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, 30000);
    wss.on('connection', (ws, req) => {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        handleConnection(ws, req).catch((error) => {
            console.error('[MeetingAgent] connection error:', error);
            fail(ws, 4500, 'Server error');
        });
    });
    wss.on('close', () => clearInterval(interval));

    return wss;
};

module.exports = { attachMeetingAgentSocket, PATH };
