const { LiveTranscriber } = require('../services/meetingAgent/geminiLive');
const { buildTranscript, formatOffset } = require('../services/meetingAgent/notes');

describe('Meeting agent - LiveTranscriber', () => {
    const collect = (t) => {
        const segments = [];
        const interims = [];
        t.on('segment', s => segments.push(s));
        t.on('interim', i => interims.push(i.text));
        return { segments, interims };
    };

    test('emits interim text and one final segment per utterance', () => {
        const t = new LiveTranscriber({ apiKey: 'x' });
        const { segments, interims } = collect(t);

        t._onMessage({ serverContent: { interimInputTranscription: { text: 'صباح الخير' } } });
        t._onMessage({ serverContent: { interimInputTranscription: { text: 'صباح الخير يا جماعة. Good morning' } } });
        t._onMessage({ serverContent: { inputTranscription: { text: 'صباح الخير يا جماعة. Good morning.' } } });
        t._onMessage({ serverContent: { generationComplete: true } });

        expect(interims).toHaveLength(2);
        expect(segments).toEqual([{ text: 'صباح الخير يا جماعة. Good morning.', speaker: null, language: null }]);
    });

    test('starts a new segment when the speaker changes', () => {
        const t = new LiveTranscriber({ apiKey: 'x' });
        const { segments } = collect(t);

        t._onMessage({ serverContent: { inputTranscription: { text: 'Hello ', speakerLabel: 'spk_1' } } });
        t._onMessage({ serverContent: { inputTranscription: { text: 'Hi there', speakerLabel: 'spk_2' } } });
        t._onMessage({ serverContent: { turnComplete: true } });

        expect(segments.map(s => [s.speaker, s.text])).toEqual([['spk_1', 'Hello'], ['spk_2', 'Hi there']]);
        clearTimeout(t.flushTimer);
    });

    test('keeps the latest resumption handle for reconnects', () => {
        const t = new LiveTranscriber({ apiKey: 'x' });
        t._onMessage({ sessionResumptionUpdate: { resumable: true, newHandle: 'h1' } });
        t._onMessage({ sessionResumptionUpdate: { resumable: false, newHandle: '' } });
        expect(t.resumeHandle).toBe('h1');
    });

    test('buffers audio while not connected', () => {
        const t = new LiveTranscriber({ apiKey: 'x' });
        t.sendAudio(Buffer.alloc(3200));
        expect(t.queue).toHaveLength(1);
    });

    test('defaults to Arabic + English transcription', () => {
        const prev = process.env.MEETING_AGENT_LANGUAGES;
        delete process.env.MEETING_AGENT_LANGUAGES;
        const t = new LiveTranscriber({ apiKey: 'x' });
        expect(t.languageCodes).toEqual(['ar', 'en']);
        if (prev !== undefined) process.env.MEETING_AGENT_LANGUAGES = prev;
    });
});

describe('Meeting agent - notes transcript', () => {
    test('formats offsets', () => {
        expect(formatOffset(65000)).toBe('01:05');
        expect(formatOffset(3725000)).toBe('1:02:05');
    });

    test('builds a timestamped transcript from speech segments only', () => {
        const text = buildTranscript([
            { kind: 'speech', text: 'مرحبا', offset_ms: 1000 },
            { kind: 'screen', image_path: '/tmp/x.jpg', offset_ms: 2000 },
            { kind: 'speech', text: 'Hello', speaker: 'Sara', offset_ms: 3000 }
        ]);
        expect(text).toBe('[00:01] مرحبا\n[00:03] Sara: Hello');
    });
});
