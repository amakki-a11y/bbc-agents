// BBC Meeting Agent - runs inside the Google Meet tab while listening.
// Reads (never changes) the Meet page to learn:
//   - who is in the meeting (names on the video tiles / people panel)
//   - who is speaking right now (speaker name on Meet's own captions, when CC is on)
// and sends them to the offscreen document, which forwards them to the server.
// Meet's page layout changes often, so every lookup has fallbacks and fails quietly.
(() => {
    if (window.__bbcMeetingAgent) return;
    window.__bbcMeetingAgent = true;

    const POLL_MS = 1000;
    const SPEAKER_REPEAT_MS = 3000;
    const PEOPLE_REPEAT_MS = 15000;   // resend even without changes (connection may have been down)

    // Words Meet shows on tiles that are not people
    const NOT_NAMES = /^(you|أنت|me|presentation|presenting|you are presenting|is presenting|meeting details|join now|mute|unmute|pin|more options|more_vert|keep|remove|captions|turn on captions|turn off captions|frame_person|mic_off|mic|videocam_off|visual_effects|\+\d+|\d+)$/i;

    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const looksLikeName = (s) => s.length >= 2 && s.length <= 60 && !NOT_NAMES.test(s) && !/[{}<>]|https?:/.test(s);

    const firstName = (el) => {
        if (!el) return null;
        // Preferred: Meet marks display names with the "notranslate" class
        for (const n of el.querySelectorAll('.notranslate, [data-self-name]')) {
            const t = clean(n.textContent);
            if (looksLikeName(t)) return t;
        }
        // Fallback: first reasonable line of the element's text
        for (const line of (el.innerText || '').split('\n')) {
            const t = clean(line);
            if (looksLikeName(t)) return t;
        }
        return null;
    };

    const participants = () => {
        const names = new Set();
        // Video tiles
        document.querySelectorAll('[data-participant-id], [data-requested-participant-id]').forEach((tile) => {
            const n = firstName(tile);
            if (n) names.add(n);
        });
        // People panel, when it is open
        document.querySelectorAll('[role="listitem"][aria-label]').forEach((item) => {
            const n = clean(item.getAttribute('aria-label'));
            if (looksLikeName(n)) names.add(n);
        });
        return [...names].sort();
    };

    // Meet's captions area: "<name>\n<what they said>" blocks, newest last
    const captionsRegion = () =>
        document.querySelector('[role="region"][aria-label*="aption" i], [role="region"][aria-label*="ترجم"], [role="region"][aria-label*="شرح"]');

    const currentSpeaker = () => {
        const region = captionsRegion();
        if (!region) return null;
        const blocks = [...region.children].filter((b) => clean(b.innerText));
        const last = blocks[blocks.length - 1];
        if (!last) return null;
        const lines = (last.innerText || '').split('\n').map(clean).filter(Boolean);
        return lines.length > 1 && looksLikeName(lines[0]) ? lines[0] : null;
    };

    // Screen sharing: the shared screen is the biggest video on the page and much
    // larger than a camera tile; Meet also labels the presenter "(Presenting)".
    const PRESENTING_TEXT = /presenting|is presenting|يعرض|يقدّم|يقدم|présente/i;
    const presentation = () => {
        let best = null;
        for (const v of document.querySelectorAll('video')) {
            const r = v.getBoundingClientRect();
            const area = r.width * r.height;
            if (r.width > 0 && r.height > 0 && (!best || area > best.area)) best = { r, area };
        }
        if (!best) return null;
        const share = best.area / (window.innerWidth * window.innerHeight);
        const labelled = PRESENTING_TEXT.test(document.body.innerText.slice(0, 20000));
        if (share < 0.2 || (!labelled && share < 0.35)) return null;
        const clip = (v, max) => Math.max(0, Math.min(max, v));
        return {
            x: clip(best.r.left, window.innerWidth),
            y: clip(best.r.top, window.innerHeight),
            width: clip(best.r.width, window.innerWidth - Math.max(0, best.r.left)),
            height: clip(best.r.height, window.innerHeight - Math.max(0, best.r.top)),
            viewWidth: window.innerWidth,
            viewHeight: window.innerHeight
        };
    };

    let lastPresentation = '';
    let lastPresentationSentAt = 0;
    let lastPeople = '';
    let lastPeopleSentAt = 0;
    let lastSpeaker = null;
    let lastSpeakerSentAt = 0;

    const send = (payload) => {
        try {
            chrome.runtime.sendMessage({ target: 'offscreen', type: 'meet-info', ...payload }).catch(() => {});
        } catch {
            clearInterval(timer); // extension was reloaded; this copy of the script is orphaned
        }
    };

    const tick = () => {
        const people = participants();
        const key = people.join('|');
        const now = Date.now();
        if (people.length && (key !== lastPeople || now - lastPeopleSentAt > PEOPLE_REPEAT_MS)) {
            lastPeople = key;
            lastPeopleSentAt = now;
            send({ participants: people });
        }
        const pres = presentation();
        const presKey = pres ? [pres.x, pres.y, pres.width, pres.height].map(Math.round).join(',') : 'none';
        if (presKey !== lastPresentation || now - lastPresentationSentAt > 5000) {
            lastPresentation = presKey;
            lastPresentationSentAt = now;
            send({ presentation: pres });   // null = nobody is sharing
        }

        const speaker = currentSpeaker();
        if (speaker && (speaker !== lastSpeaker || now - lastSpeakerSentAt > SPEAKER_REPEAT_MS)) {
            lastSpeaker = speaker;
            lastSpeakerSentAt = now;
            send({ speaker });
        }
    };

    const timer = setInterval(tick, POLL_MS);
    tick();
})();
