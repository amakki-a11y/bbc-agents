// BBC Meeting Agent - background service worker.
// Owns login + the meeting session; the offscreen document does the capture.

const DEFAULT_SERVER = 'https://back-end-production-bad8.up.railway.app';

const getSettings = async () => {
    const s = await chrome.storage.local.get(['serverUrl', 'accessToken', 'refreshToken', 'email', 'includeMic']);
    return { serverUrl: s.serverUrl || DEFAULT_SERVER, includeMic: s.includeMic !== false, ...s };
};

const setState = (patch) => chrome.storage.session.set(patch);
const getState = () => chrome.storage.session.get(null);

const refreshTokens = async () => {
    const { serverUrl, refreshToken } = await getSettings();
    if (!refreshToken) return false;
    const res = await fetch(`${serverUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) return false;
    const tokens = await res.json();
    await chrome.storage.local.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return true;
};

// fetch() against the BBC API with the saved token (refreshes once on 401/403)
const api = async (path, options = {}, retry = true) => {
    const { serverUrl, accessToken } = await getSettings();
    const res = await fetch(`${serverUrl}/api/v1${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            ...(options.headers || {})
        }
    });
    if ((res.status === 401 || res.status === 403) && retry && await refreshTokens()) {
        return api(path, options, false);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
};

const login = async ({ serverUrl, email, password }) => {
    const url = (serverUrl || DEFAULT_SERVER).replace(/\/+$/, '');
    const res = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || body.message || 'Login failed');
    await chrome.storage.local.set({
        serverUrl: url,
        email,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken
    });
};

const ensureOffscreen = async () => {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (contexts.length) return;
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Capture Google Meet audio and screen for meeting notes'
    });
};

const start = async ({ tabId, streamId, title, meetUrl }) => {
    const state = await getState();
    if (state.recording) throw new Error('Already recording a meeting');

    // Access token may be close to expiry; get a fresh one for the long socket
    await refreshTokens().catch(() => {});
    const session = await api('/meeting-agent/sessions', {
        method: 'POST',
        body: JSON.stringify({ title, meet_url: meetUrl })
    });

    const { serverUrl, accessToken, includeMic } = await getSettings();
    await ensureOffscreen();
    await setState({
        recording: true,
        sessionId: session.id,
        tabId,
        status: 'starting',
        interim: '',
        lines: [],
        error: null,
        startedAt: Date.now()
    });
    await chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'start',
        streamId,
        sessionId: session.id,
        token: accessToken,
        wsUrl: `${serverUrl.replace(/^http/, 'ws')}/ws/meeting-agent`,
        includeMic
    });
    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
    return session;
};

const stop = async () => {
    const state = await getState();
    if (!state.sessionId) return;
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
    // Also tell the API directly, in case the socket was already gone
    await api(`/meeting-agent/sessions/${state.sessionId}/stop`, { method: 'POST' }).catch(() => {});
    await setState({ recording: false, status: 'processing', interim: '' });
    chrome.action.setBadgeText({ text: '' });
    setTimeout(() => chrome.offscreen.closeDocument().catch(() => {}), 3000);
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.target !== 'background') return;

    const handlers = {
        login: () => login(msg),
        logout: () => chrome.storage.local.remove(['accessToken', 'refreshToken']),
        start: () => start(msg),
        stop: () => stop(),
        // Updates from the offscreen document
        status: () => setState({ status: msg.status, ...(msg.error ? { error: msg.error } : {}) }),
        interim: () => setState({ interim: msg.text }),
        segment: async () => {
            const { lines = [] } = await getState();
            await setState({ lines: [...lines, msg.text].slice(-30), interim: '' });
        },
        captureEnded: async () => {
            const state = await getState();
            if (state.recording) await stop();
        }
    };

    const handler = handlers[msg.type];
    if (!handler) return;
    Promise.resolve(handler())
        .then((result) => sendResponse({ ok: true, result }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true; // async response
});

// Meeting tab closed -> finish the meeting
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const state = await getState();
    if (state.recording && state.tabId === tabId) await stop();
});
