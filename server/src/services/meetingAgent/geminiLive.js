const { EventEmitter } = require('events');

/**
 * LiveTranscriber - the meeting agent's "ears".
 *
 * Streams 16 kHz PCM audio to the Gemini Live API and emits finished
 * transcript segments. Handles Gemini's connection limits by resuming the
 * session (goAway / unexpected close) with the latest resumption handle.
 *
 * Events:
 *   'segment' { text, speaker, language }   finished utterance (saved)
 *   'interim' { text }                      words still being spoken (live view only)
 *   'status'  'connecting' | 'live' | 'reconnecting' | 'closed'
 *   'error'   Error
 */

// Transcription-only Live model: hears Arabic and English, never talks back
const DEFAULT_MODEL = 'gemini-3.5-transcribe-live';
// Without both codes, English sentences were dropped from mixed Arabic/English speech
const DEFAULT_LANGUAGES = ['ar', 'en'];
const FLUSH_IDLE_MS = 2500;       // flush a segment after this much silence
const MAX_SEGMENT_CHARS = 600;    // flush long monologues at a sentence end
const MAX_QUEUED_CHUNKS = 400;    // ~12s of audio buffered while reconnecting
const MAX_RECONNECTS = 20;

const SYSTEM_INSTRUCTION = [
    'You are a silent meeting note-taker listening to a business meeting.',
    'People speak Arabic, English, or both.',
    'Never answer questions or join the conversation.',
    'Always reply with a single "." and nothing else.'
].join(' ');

const envList = (value) => (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

class LiveTranscriber extends EventEmitter {
    constructor(options = {}) {
        super();
        this.apiKey = options.apiKey || process.env.GEMINI_API_KEY;
        this.model = options.model || process.env.GEMINI_LIVE_MODEL || DEFAULT_MODEL;
        this.responseModality = (options.responseModality || process.env.GEMINI_LIVE_RESPONSE_MODALITY || 'TEXT').toUpperCase();
        this.languageCodes = options.languageCodes
            || (process.env.MEETING_AGENT_LANGUAGES !== undefined ? envList(process.env.MEETING_AGENT_LANGUAGES) : DEFAULT_LANGUAGES);
        this.diarization = options.diarization ?? process.env.MEETING_AGENT_DIARIZATION === 'true';

        this.session = null;
        this.generation = 0;
        this.resumeHandle = null;
        this.stopped = false;
        this.connecting = false;
        this.reconnects = 0;
        this.queue = [];

        this.buffer = '';
        this.bufferSpeaker = null;
        this.bufferLanguage = null;
        this.flushTimer = null;
    }

    async start() {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is not set on the server');
        }
        await this._connect();
    }

    _buildConfig(Modality) {
        const transcription = {};
        if (this.languageCodes.length) transcription.languageCodes = this.languageCodes;
        if (this.diarization) transcription.diarization = true;

        const config = {
            responseModalities: [Modality[this.responseModality] || Modality.TEXT],
            inputAudioTranscription: transcription,
            // Keep long meetings inside the context window
            contextWindowCompression: { slidingWindow: {} },
            sessionResumption: this.resumeHandle ? { handle: this.resumeHandle } : {}
        };
        // Conversational Live models would answer the meeting; tell them not to.
        // (No maxOutputTokens: on transcribe models it also cuts the transcript.)
        if (!/transcribe/.test(this.model)) config.systemInstruction = SYSTEM_INSTRUCTION;
        return config;
    }

    async _connect() {
        if (this.stopped || this.connecting) return;
        this.connecting = true;
        this.emit('status', this.resumeHandle ? 'reconnecting' : 'connecting');

        // Callbacks from an older (replaced) connection are ignored
        const gen = ++this.generation;
        const current = () => gen === this.generation;

        try {
            const { GoogleGenAI, Modality } = require('@google/genai');
            const ai = new GoogleGenAI({ apiKey: this.apiKey });

            const session = await ai.live.connect({
                model: this.model,
                config: this._buildConfig(Modality),
                callbacks: {
                    onmessage: (msg) => current() && this._onMessage(msg),
                    onerror: (e) => current() && this.emit('error', new Error(e?.message || 'Gemini Live error')),
                    onclose: (e) => current() && this._onClose(e)
                }
            });
            if (!current() || this.stopped) {
                try { session.close(); } catch { /* ignore */ }
                this.connecting = false;
                return;
            }
            this.session = session;

            this.connecting = false;
            this.reconnects = 0;
            this.emit('status', 'live');
            this._drainQueue();
        } catch (error) {
            this.connecting = false;
            this.session = null;
            this.emit('error', error);
            this._scheduleReconnect();
        }
    }

    _onMessage(msg) {
        if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
            this.resumeHandle = msg.sessionResumptionUpdate.newHandle;
        }

        if (msg.goAway) {
            // Server will drop this connection soon; move to a fresh one now
            this._reconnectNow();
            return;
        }

        const content = msg.serverContent;
        if (!content) return;

        if (content.interimInputTranscription?.text) {
            this.emit('interim', { text: content.interimInputTranscription.text });
        }

        const t = content.inputTranscription;
        if (t?.text) {
            const speaker = t.speakerLabel || null;
            if (this.buffer && speaker && speaker !== this.bufferSpeaker) {
                this._flush();
            }
            this.buffer += t.text;
            this.bufferSpeaker = speaker || this.bufferSpeaker;
            this.bufferLanguage = t.languageCode || this.bufferLanguage;

            const atSentenceEnd = /[.!?؟。]\s*$/.test(this.buffer);
            if (t.finished || (this.buffer.length > MAX_SEGMENT_CHARS && atSentenceEnd)) {
                this._flush();
            } else {
                this._armFlushTimer();
            }
        }

        if (content.turnComplete || content.generationComplete) this._flush();
    }

    _onClose(e) {
        this.session = null;
        if (this.stopped) {
            this.emit('status', 'closed');
            return;
        }
        // Closed while we still want audio -> resume with the latest handle
        if (e?.reason) this.emit('error', new Error(`Gemini Live closed: ${e.reason}`));
        this._scheduleReconnect();
    }

    _reconnectNow() {
        const old = this.session;
        this.session = null;
        this.generation += 1; // silence the old connection's close event
        try { old?.close(); } catch { /* ignore */ }
        this._connect();
    }

    _scheduleReconnect() {
        if (this.stopped) return;
        if (this.reconnects >= MAX_RECONNECTS) {
            this.emit('error', new Error('Gemini Live: too many reconnect attempts'));
            this.emit('status', 'closed');
            return;
        }
        const delay = Math.min(1000 * 2 ** this.reconnects, 15000);
        this.reconnects += 1;
        setTimeout(() => this._connect(), delay);
    }

    _armFlushTimer() {
        clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => this._flush(), FLUSH_IDLE_MS);
    }

    _flush() {
        clearTimeout(this.flushTimer);
        const text = this.buffer.trim();
        if (text) {
            this.emit('segment', {
                text,
                speaker: this.bufferSpeaker,
                language: this.bufferLanguage
            });
        }
        this.buffer = '';
        this.bufferSpeaker = null;
        this.bufferLanguage = null;
    }

    /** @param {Buffer} pcm 16-bit little-endian mono PCM at 16 kHz */
    sendAudio(pcm) {
        if (this.stopped) return;
        const data = pcm.toString('base64');
        if (!this.session) {
            this.queue.push(data);
            if (this.queue.length > MAX_QUEUED_CHUNKS) this.queue.shift();
            return;
        }
        this._send(data);
    }

    _send(data) {
        try {
            this.session.sendRealtimeInput({
                audio: { data, mimeType: 'audio/pcm;rate=16000' }
            });
        } catch (error) {
            this.queue.push(data);
            this.emit('error', error);
        }
    }

    _drainQueue() {
        while (this.session && this.queue.length) {
            this._send(this.queue.shift());
        }
    }

    async stop() {
        this.stopped = true;
        this.generation += 1;
        clearTimeout(this.flushTimer);
        this._flush();
        try {
            this.session?.sendRealtimeInput({ audioStreamEnd: true });
        } catch { /* ignore */ }
        try { this.session?.close(); } catch { /* ignore */ }
        this.session = null;
        this.queue = [];
    }
}

module.exports = { LiveTranscriber };
