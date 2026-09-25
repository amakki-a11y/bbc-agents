/**
 * Try the meeting agent's Gemini Live transcription with an audio file.
 *
 *   GEMINI_API_KEY=... node scripts/testMeetingAgentLive.js meeting.pcm
 *
 * The file must be raw 16-bit mono PCM at 16 kHz, e.g. from ffmpeg:
 *   ffmpeg -i meeting.mp3 -f s16le -ac 1 -ar 16000 meeting.pcm
 *
 * Model and options come from the same env vars the server uses
 * (GEMINI_LIVE_MODEL, GEMINI_LIVE_RESPONSE_MODALITY, MEETING_AGENT_LANGUAGES,
 * MEETING_AGENT_DIARIZATION).
 */
require('dotenv').config();
const fs = require('fs');
const { LiveTranscriber } = require('../src/services/meetingAgent/geminiLive');

const CHUNK_MS = 100;
const BYTES_PER_MS = 32; // 16 kHz * 2 bytes

const file = process.argv[2];
if (!file) {
    console.error('Usage: node scripts/testMeetingAgentLive.js <file.pcm>');
    process.exit(1);
}

const main = async () => {
    const audio = fs.readFileSync(file);
    const t = new LiveTranscriber();
    console.log(`Model: ${t.model} (${t.responseModality})`);

    t.on('status', s => console.log(`[status] ${s}`));
    t.on('error', e => console.log(`[error] ${e.message}`));
    t.on('segment', s => console.log(`[${s.language || '?'}]${s.speaker ? ` ${s.speaker}:` : ''} ${s.text}`));

    await t.start();

    // Stream in real time, like a live meeting
    const chunk = CHUNK_MS * BYTES_PER_MS;
    for (let i = 0; i < audio.length; i += chunk) {
        t.sendAudio(audio.subarray(i, i + chunk));
        await new Promise(r => setTimeout(r, CHUNK_MS));
    }
    // A little silence so the last words are finalized
    const silence = Buffer.alloc(chunk);
    for (let i = 0; i < 30; i++) {
        t.sendAudio(silence);
        await new Promise(r => setTimeout(r, CHUNK_MS));
    }
    await t.stop();
    process.exit(0);
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
