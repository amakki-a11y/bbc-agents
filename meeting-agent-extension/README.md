# BBC Meeting Agent

Listens to your Google Meet, writes notes in **English and Arabic**, and turns
action items into BBC tasks.

```
Google Meet tab ──audio + screenshots──► BBC server ──audio──► Gemini Live (hears)
                                             │
                                  meeting ends
                                             ▼
                                   Claude (notes AR/EN + tasks)
                                             ▼
                              Meeting Notes page → Create tasks
```

- **Hear:** Gemini Live (`gemini-3.5-transcribe-live`) turns speech into text live, including mixed Arabic and English.
- **See:** Every few seconds the extension checks the Meet screen, and sends a screenshot when a new slide or document appears.
- **Think:** When the meeting ends, Claude reads the transcript and screenshots, then writes a summary, decisions, key points and action items in both languages.
- **Act:** On the **Meeting Notes** page you check each action item, then click **Create tasks**.

## 1. Server setup

Add these to `server/.env` on the machine that runs the server:

| Variable | Needed | What it is |
|---|---|---|
| `GEMINI_API_KEY` | yes | Key from https://aistudio.google.com/apikey |
| `ANTHROPIC_API_KEY` | yes | Claude API key (already used by the AI assistant) |
| `GEMINI_LIVE_MODEL` | no | Default `gemini-3.5-transcribe-live` |
| `MEETING_AGENT_LANGUAGES` | no | Default `ar,en`. Keep both codes: without them, English sentences are dropped from mixed speech |
| `MEETING_NOTES_MODEL` | no | Default `claude-opus-5` |

Then update the database with the new tables (`MeetingSession`, `MeetingTranscriptSegment`, `MeetingActionItem`):

```bash
cd server && npm run build   # prisma generate + prisma db push
```

To check Gemini on its own with any recording:

```bash
ffmpeg -i meeting.mp3 -f s16le -ac 1 -ar 16000 meeting.pcm
GEMINI_API_KEY=... node scripts/testMeetingAgentLive.js meeting.pcm
```

## 2. Install the extension (Chrome)

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `meeting-agent-extension` folder.
4. Pin **BBC Meeting Agent** to the toolbar.
5. Click the icon and log in with your BBC email and password.
   **Server** is `http://localhost:3000` when Chrome runs on the same machine as the server; otherwise use that machine's address.
6. Click **Allow microphone** once. Meet doesn't play your own voice in the tab,
   so the agent needs your mic to hear you.

## 3. Use it

1. Join a Google Meet.
2. Click the extension icon, then **Start listening**. You'll see the live text.
3. At the end, click **Stop & write notes**. Closing the Meet tab also stops it.
4. Open **Meeting Notes** in BBC (or click **Open meeting notes**). After about a minute you'll see:
   - a summary, decisions and key points in English and Arabic
   - action items: pick the person, due date and priority, then click **Create tasks**
   - the full transcript and screenshots

## Good to know

- Tell attendees the meeting is being recorded.
- Use headphones: without them the mic also picks up other people from your speakers.
- Only you can see your meetings. Screenshots are private and never served from the public `/uploads` folder.
- If the internet drops, the extension reconnects and keeps the same meeting.
  If it's gone for more than 2 minutes, the server pauses listening until it comes back.
- Speaker names aren't detected from the audio yet. Claude works out who
  said what from context (for example "تمام يا سارة").
