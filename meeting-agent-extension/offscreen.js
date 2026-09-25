// BBC Meeting Agent - offscreen document.
// Captures the Meet tab (audio + picture) and your microphone, then streams
// them to the BBC server:  0x01 + PCM16 audio,  0x02 + JPEG screenshot.

const FRAME_AUDIO = 1;
const FRAME_SCREEN = 2;
const SCREENSHOT_EVERY_MS = 5000;
const SCREEN_CHANGE_THRESHOLD = 12; // average pixel difference (0-255) that counts as "new slide"
const MAX_SCREENSHOT_WIDTH = 1280;

let ctx = null;         // 16 kHz context that feeds Gemini
let playback = null;    // normal-rate context so you still hear the meeting
let tabStream = null;
let micStream = null;
let ws = null;
let shotTimer = null;
let lastThumb = null;
let config = null;
let stopping = false;
let reconnectDelay = 1000;

const toBackground = (msg) => chrome.runtime.sendMessage({ target: 'background', ...msg }).catch(() => {});

const send = (kind, bytes) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const frame = new Uint8Array(bytes.byteLength + 1);
    frame[0] = kind;
    frame.set(new Uint8Array(bytes), 1);
    ws.send(frame);
};

const connect = () => {
    const url = `${config.wsUrl}?sessionId=${encodeURIComponent(config.sessionId)}&token=${encodeURIComponent(config.token)}&role=capture`;
    ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        reconnectDelay = 1000;
        lastThumb = null; // send the current screen again after a reconnect
    };
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'status') toBackground({ type: 'status', status: msg.status, error: msg.message });
        else if (msg.type === 'interim') toBackground({ type: 'interim', text: msg.text });
        else if (msg.type === 'segment') toBackground({ type: 'segment', text: msg.segment.text });
        else if (msg.type === 'error') toBackground({ type: 'status', status: 'error', error: msg.message });
    };
    ws.onclose = (event) => {
        ws = null;
        if (stopping) return;
        // 44xx = rejected (bad login, not your meeting...) -> don't retry
        if (event.code >= 4400 && event.code < 4500) {
            toBackground({ type: 'status', status: 'error', error: event.reason || 'Connection rejected' });
            return;
        }
        if (event.code === 1000) return; // meeting finished on the server
        toBackground({ type: 'status', status: 'reconnecting' });
        setTimeout(() => !stopping && connect(), reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15000);
    };
};

const startAudio = async () => {
    ctx = new AudioContext({ sampleRate: 16000 });
    await ctx.audioWorklet.addModule('pcm-worklet.js');
    const worklet = new AudioWorkletNode(ctx, 'pcm-worklet', {
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers'
    });
    worklet.port.onmessage = (event) => send(FRAME_AUDIO, event.data);

    // Other people (the Meet tab's sound)
    ctx.createMediaStreamSource(tabStream).connect(worklet);

    // Capturing a tab mutes it - play it back so you keep hearing the meeting
    playback = new AudioContext();
    playback.createMediaStreamSource(tabStream).connect(playback.destination);

    // You (your microphone) - Meet never plays your own voice back in the tab
    if (config.includeMic) {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true }
            });
            ctx.createMediaStreamSource(micStream).connect(worklet);
        } catch (error) {
            toBackground({
                type: 'status',
                status: 'live',
                error: 'Microphone not allowed - only other people will be heard. Open the extension and click "Allow microphone".'
            });
        }
    }
};

// Grab the Meet picture every few seconds; send it only when it changed
const startScreenshots = async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const thumb = document.getElementById('thumb');
    video.srcObject = new MediaStream(tabStream.getVideoTracks());
    await video.play();

    const tctx = thumb.getContext('2d', { willReadFrequently: true });
    shotTimer = setInterval(() => {
        if (!video.videoWidth) return;

        tctx.drawImage(video, 0, 0, thumb.width, thumb.height);
        const pixels = tctx.getImageData(0, 0, thumb.width, thumb.height).data;
        const gray = new Uint8Array(thumb.width * thumb.height);
        for (let i = 0; i < gray.length; i++) {
            gray[i] = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3;
        }
        if (lastThumb) {
            let diff = 0;
            for (let i = 0; i < gray.length; i++) diff += Math.abs(gray[i] - lastThumb[i]);
            if (diff / gray.length < SCREEN_CHANGE_THRESHOLD) return;
        }
        lastThumb = gray;

        const scale = Math.min(1, MAX_SCREENSHOT_WIDTH / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
            if (blob) send(FRAME_SCREEN, await blob.arrayBuffer());
        }, 'image/jpeg', 0.7);
    }, SCREENSHOT_EVERY_MS);
};

const start = async (msg) => {
    config = msg;
    stopping = false;
    try {
        tabStream = await navigator.mediaDevices.getUserMedia({
            audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: msg.streamId } },
            video: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: msg.streamId,
                    maxWidth: 1920,
                    maxHeight: 1080,
                    maxFrameRate: 2
                }
            }
        });
        // Tab capture ends if the tab navigates away or closes
        tabStream.getTracks().forEach(t => t.addEventListener('ended', () => toBackground({ type: 'captureEnded' })));

        connect();
        await startAudio();
        await startScreenshots();
    } catch (error) {
        toBackground({ type: 'status', status: 'error', error: `Could not capture the meeting: ${error.message}` });
        cleanup();
    }
};

const cleanup = () => {
    clearInterval(shotTimer);
    shotTimer = null;
    [tabStream, micStream].forEach(s => s?.getTracks().forEach(t => t.stop()));
    tabStream = micStream = null;
    ctx?.close();
    playback?.close();
    ctx = playback = null;
};

const stop = () => {
    stopping = true;
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop' }));
    }
    cleanup();
    setTimeout(() => ws?.close(), 1000);
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.target !== 'offscreen') return;
    if (msg.type === 'start') start(msg);
    else if (msg.type === 'stop') stop();
    sendResponse({ ok: true });
});
