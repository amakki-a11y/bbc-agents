const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * Meeting notes - the meeting agent's "brain".
 *
 * Sends the transcript (plus a few screenshots of what was on screen) to
 * Claude and gets back bilingual (English + Arabic) notes and action items.
 */

const DEFAULT_MODEL = 'claude-opus-5';
const MAX_SCREENSHOTS = 12;
const MAX_EMPLOYEES = 300;

let client = null;
const getClient = () => {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set on the server');
    }
    if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return client;
};

const bilingual = {
    type: 'object',
    properties: {
        en: { type: 'string' },
        ar: { type: 'string' }
    },
    required: ['en', 'ar'],
    additionalProperties: false
};

const NOTES_SCHEMA = {
    type: 'object',
    properties: {
        title: { type: 'string', description: 'Short meeting title in English' },
        summary_en: { type: 'string' },
        summary_ar: { type: 'string' },
        key_points: { type: 'array', items: bilingual },
        decisions: { type: 'array', items: bilingual },
        screen_highlights: {
            type: 'array',
            items: bilingual,
            description: 'Important things that were shown on screen (slides, documents, numbers)'
        },
        action_items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title_en: { type: 'string' },
                    title_ar: { type: 'string' },
                    description: { type: 'string' },
                    owner_name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    assignee_employee_id: {
                        anyOf: [{ type: 'string' }, { type: 'null' }],
                        description: 'id from the employee list, only when the owner clearly matches one employee'
                    },
                    due_date: {
                        anyOf: [{ type: 'string', format: 'date' }, { type: 'null' }],
                        description: 'YYYY-MM-DD, only if a deadline was said or clearly implied'
                    },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'] }
                },
                required: ['title_en', 'title_ar', 'description', 'owner_name', 'assignee_employee_id', 'due_date', 'priority'],
                additionalProperties: false
            }
        }
    },
    required: ['title', 'summary_en', 'summary_ar', 'key_points', 'decisions', 'screen_highlights', 'action_items'],
    additionalProperties: false
};

const SYSTEM_PROMPT = `You are the BBC meeting agent. You turn a raw meeting transcript into clear notes for a company that works in Arabic and English.

The transcript comes from automatic speech recognition, so expect mistakes, missing punctuation, and speakers switching between Arabic and English mid-sentence. Fix obvious recognition errors from context, but never invent facts that were not said.

Write every note in both languages:
- English: plain, short business English.
- Arabic: Modern Standard Arabic (فصحى) that reads naturally, not a word-for-word translation. Keep names, product names and numbers as spoken.

Action items are concrete follow-ups someone agreed to or was asked to do. Skip vague ideas. For each one:
- owner_name: the person as named in the meeting, or null if nobody was named.
- assignee_employee_id: only when owner_name clearly matches exactly one person in the employee list; otherwise null.
- due_date: resolve relative dates ("next Sunday", "by end of month") against the meeting date; null if no deadline was mentioned.

Screenshots show what was on screen during the meeting. Use them to understand the discussion and list the important visible content under screen_highlights.`;

const formatOffset = (ms) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return h ? `${h}:${mmss}` : mmss;
};

const buildTranscript = (segments) => segments
    .filter(s => s.kind === 'speech' && s.text)
    .map(s => `[${formatOffset(s.offset_ms)}] ${s.speaker ? `${s.speaker}: ` : ''}${s.text}`)
    .join('\n');

// Evenly pick up to MAX_SCREENSHOTS screenshots across the meeting
const pickScreenshots = (segments) => {
    const shots = segments.filter(s => s.kind === 'screen' && s.image_path && fs.existsSync(s.image_path));
    if (shots.length <= MAX_SCREENSHOTS) return shots;
    const step = shots.length / MAX_SCREENSHOTS;
    return Array.from({ length: MAX_SCREENSHOTS }, (_, i) => shots[Math.floor(i * step)]);
};

/**
 * @param {object} params
 * @param {object} params.session   MeetingSession row
 * @param {Array}  params.segments  MeetingTranscriptSegment rows, ordered by offset
 * @param {Array}  params.employees [{ id, name, email, jobTitle }]
 */
const generateMeetingNotes = async ({ session, segments, employees }) => {
    const transcript = buildTranscript(segments);
    if (!transcript.trim()) {
        throw new Error('No speech was captured in this meeting');
    }

    const content = [];
    for (const shot of pickScreenshots(segments)) {
        content.push({ type: 'text', text: `Screenshot at [${formatOffset(shot.offset_ms)}]:` });
        content.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: fs.readFileSync(shot.image_path).toString('base64')
            }
        });
    }

    const employeeList = employees
        .slice(0, MAX_EMPLOYEES)
        .map(e => `${e.id} | ${e.name} | ${e.email}${e.jobTitle ? ` | ${e.jobTitle}` : ''}`)
        .join('\n');

    content.push({
        type: 'text',
        text: [
            `Meeting: ${session.title}`,
            `Meeting date: ${new Date(session.started_at).toISOString().slice(0, 10)}`,
            '',
            '<employees>',
            'id | name | email | job title',
            employeeList || '(none)',
            '</employees>',
            '',
            '<transcript>',
            transcript,
            '</transcript>',
            '',
            'Write the meeting notes.'
        ].join('\n')
    });

    const stream = getClient().beta.messages.stream({
        model: process.env.MEETING_NOTES_MODEL || DEFAULT_MODEL,
        max_tokens: 64000,
        thinking: { type: 'adaptive' },
        output_config: {
            effort: 'high',
            format: { type: 'json_schema', schema: NOTES_SCHEMA }
        },
        // If Claude declines, the API retries on Anthropic's recommended fallback model
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }]
    });

    const response = await stream.finalMessage();

    if (response.stop_reason === 'refusal') {
        throw new Error('Claude declined to write notes for this meeting');
    }
    if (response.stop_reason === 'max_tokens') {
        throw new Error('Meeting notes were cut off (too long)');
    }

    const text = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
    return JSON.parse(text);
};

module.exports = { generateMeetingNotes, NOTES_SCHEMA, buildTranscript, formatOffset };
