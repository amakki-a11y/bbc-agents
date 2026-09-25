// BBC Meeting Agent - popup UI

const DEFAULT_SERVER = 'http://localhost:3000';

const $ = (id) => document.getElementById(id);
const show = (id, visible) => $(id).classList.toggle('hidden', !visible);

const STATUS_TEXT = {
    starting: 'Starting…',
    connecting: 'Connecting…',
    live: 'Listening',
    reconnecting: 'Reconnecting…',
    waiting_for_extension: 'Reconnecting…',
    processing: 'Writing notes…',
    error: 'Problem'
};

const toBackground = (msg) => chrome.runtime.sendMessage({ target: 'background', ...msg });

// Local test: the web app runs on Vite (5173); elsewhere it is served next to the API
const appUrlFor = (serverUrl) => (/localhost|127\.0\.0\.1/.test(serverUrl || '') ? 'http://localhost:5173' : serverUrl);

const showError = (message) => {
    $('error').textContent = message || '';
    show('error', !!message);
};

const render = async () => {
    const settings = await chrome.storage.local.get(['serverUrl', 'email', 'accessToken', 'includeMic']);
    const state = await chrome.storage.session.get(null);

    const loggedIn = !!settings.accessToken;
    show('login', !loggedIn);
    show('main', loggedIn);
    if (!loggedIn) {
        // Fill the form once; never overwrite what the user typed
        if (!$('serverUrl').value) $('serverUrl').value = settings.serverUrl || DEFAULT_SERVER;
        if (!$('email').value) $('email').value = settings.email || '';
        return;
    }

    $('who').textContent = settings.email ? `(${settings.email})` : '';
    $('includeMic').checked = settings.includeMic !== false;

    const finished = !state.recording && state.sessionId && state.status === 'processing';
    show('idle', !state.recording && !finished);
    show('recording', !!state.recording);
    show('done', !!finished);

    if (state.recording) {
        $('statusText').textContent = STATUS_TEXT[state.status] || state.status || '';
        $('dot').classList.toggle('live', state.status === 'live');
        const box = $('transcript');
        const line = (text, className = '') => {
            const p = document.createElement('p');
            p.textContent = text;
            p.className = className;
            return p;
        };
        const items = (state.lines || []).map(t => line(t));
        if (state.interim) items.push(line(state.interim, 'interim'));
        if (!items.length) items.push(line('Waiting for someone to speak…', 'muted'));
        box.replaceChildren(...items);
        box.scrollTop = box.scrollHeight;
    }
    if (state.error) showError(state.error);

    if (!state.recording && !finished) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const onMeet = tab?.url?.startsWith('https://meet.google.com/');
        $('startBtn').disabled = !onMeet;
        show('notMeet', !onMeet);
    }
};

$('loginBtn').addEventListener('click', async () => {
    const btn = $('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    showError('');
    const serverUrl = ($('serverUrl').value.trim() || DEFAULT_SERVER).replace(/\/+$/, '');
    try {
        // Servers other than localhost/Meet need the user's OK once (optional host permission)
        if (!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(serverUrl)) {
            const granted = await chrome.permissions.request({ origins: [`${new URL(serverUrl).origin}/*`] });
            if (!granted) throw new Error('Chrome did not allow the extension to reach this server.');
        }
        const res = await toBackground({
            type: 'login',
            serverUrl,
            email: $('email').value.trim(),
            password: $('password').value
        });
        if (!res?.ok) throw new Error(res?.error || 'Login failed');
        $('password').value = '';
    } catch (error) {
        showError(error.message);
    }
    btn.disabled = false;
    btn.textContent = 'Log in';
    render();
});

$('logoutBtn').addEventListener('click', async () => {
    await toBackground({ type: 'logout' });
    render();
});

$('includeMic').addEventListener('change', (e) => chrome.storage.local.set({ includeMic: e.target.checked }));

$('micBtn').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('mic.html') }));

$('startBtn').addEventListener('click', async () => {
    $('startBtn').disabled = true;
    showError('');
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // Must be called from this click (user gesture) to capture the tab
        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
        const meetUrl = tab.url.split('?')[0];
        const res = await toBackground({
            type: 'start',
            tabId: tab.id,
            streamId,
            title: $('title').value.trim() || tab.title?.replace(/^Meet\s*[-–]\s*/, '') || '',
            meetUrl
        });
        if (!res?.ok) throw new Error(res?.error || 'Could not start');
    } catch (error) {
        showError(error.message);
    }
    $('startBtn').disabled = false;
    render();
});

$('stopBtn').addEventListener('click', async () => {
    $('stopBtn').disabled = true;
    await toBackground({ type: 'stop' });
    $('stopBtn').disabled = false;
    render();
});

$('openNotesBtn').addEventListener('click', async () => {
    const { serverUrl } = await chrome.storage.local.get('serverUrl');
    const { sessionId } = await chrome.storage.session.get('sessionId');
    chrome.tabs.create({ url: `${appUrlFor(serverUrl)}/meetings/${sessionId}` });
});

$('newBtn').addEventListener('click', async () => {
    await chrome.storage.session.clear();
    render();
});

chrome.storage.onChanged.addListener(() => render());
render();
