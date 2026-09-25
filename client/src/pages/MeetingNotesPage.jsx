import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { http, API_BASE, getAuthToken } from '../api/http';
import Dashboard from './Dashboard';
import {
    Mic, ArrowLeft, CheckCircle2, ListChecks, Lightbulb, Monitor, FileText,
    RefreshCw, Trash2, Square, Loader2, AlertTriangle, X, Undo2
} from 'lucide-react';

const STATUS = {
    recording: { label: 'Listening', color: '#dc2626', bg: '#fef2f2' },
    processing: { label: 'Writing notes…', color: '#d97706', bg: '#fffbeb' },
    ready: { label: 'Ready', color: '#059669', bg: '#ecfdf5' },
    failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2' }
};

const formatOffset = (ms) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return h ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const splitSentences = (text = '') => text.split(/(?<=[.!?؟])\s+/).filter(Boolean);

const formatDuration = (start, end) => {
    if (!end) return '';
    const mins = Math.max(1, Math.round((new Date(end) - new Date(start)) / 60000));
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
};

const StatusBadge = ({ status }) => {
    const s = STATUS[status] || STATUS.ready;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
            color: s.color, background: s.bg
        }}>
            {status === 'recording' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />}
            {status === 'processing' && <Loader2 size={12} className="animate-spin" />}
            {s.label}
        </span>
    );
};

const Section = ({ icon: Icon, title, children, right }) => (
    <div className="card-modern" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Icon size={18} color="var(--primary)" /> {title}
            </h3>
            {right}
        </div>
        {children}
    </div>
);

// English and Arabic side by side (stacks on narrow screens)
const Bilingual = ({ en, ar }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem 1.5rem' }}>
        <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{en}</div>
        <div dir="rtl" lang="ar" style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>{ar}</div>
    </div>
);

const BilingualList = ({ items }) => (
    <ul style={{ margin: 0, paddingInlineStart: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
            <li key={i} style={{ paddingBottom: 10, borderBottom: i < items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <Bilingual en={item.en} ar={item.ar} />
            </li>
        ))}
    </ul>
);

// Screenshots need the auth header, so load them as blobs
const Screenshot = ({ sessionId, segmentId }) => {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let url;
        http.get(`/meeting-agent/sessions/${sessionId}/screenshots/${segmentId}`, { responseType: 'blob' })
            .then(res => { url = URL.createObjectURL(res.data); setSrc(url); })
            .catch(() => {});
        return () => url && URL.revokeObjectURL(url);
    }, [sessionId, segmentId]);
    if (!src) return <div style={{ width: 200, height: 112, background: 'var(--bg-tertiary)', borderRadius: 8 }} />;
    return (
        <a href={src} target="_blank" rel="noreferrer">
            <img src={src} alt="Meeting screen" style={{ width: 200, borderRadius: 8, border: '1px solid var(--border-color)', display: 'block' }} />
        </a>
    );
};

const ActionItemRow = ({ item, assignees, onChange }) => {
    const locked = item.status === 'created';
    const dismissed = item.status === 'dismissed';
    const update = (patch) => onChange(item.id, patch);

    return (
        <div style={{
            padding: '0.875rem', borderRadius: 10, border: '1px solid var(--border-color)',
            background: locked ? 'var(--success-bg)' : 'var(--bg-card)', opacity: dismissed ? 0.5 : 1
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: dismissed ? 'line-through' : 'none' }}>{item.title}</div>
                    {item.title_ar && <div dir="rtl" lang="ar" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{item.title_ar}</div>}
                    {item.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{item.description}</div>}
                </div>
                {locked ? (
                    <Link to={`/tasks/${item.task_id}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success-text)', whiteSpace: 'nowrap' }}>
                        <CheckCircle2 size={14} style={{ verticalAlign: -2 }} /> Task created{item.assignee ? ` · ${item.assignee.name}` : ''}
                    </Link>
                ) : (
                    <button
                        className="btn-modern btn-modern-ghost"
                        title={dismissed ? 'Keep' : 'Skip this one'}
                        onClick={() => update({ status: dismissed ? 'draft' : 'dismissed' })}
                        style={{ padding: 6 }}
                    >
                        {dismissed ? <Undo2 size={16} /> : <X size={16} />}
                    </button>
                )}
            </div>
            {!locked && !dismissed && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <select
                        className="input-modern"
                        value={item.assignee_employee_id || ''}
                        onChange={e => update({ assignee_employee_id: e.target.value || null })}
                        style={{ flex: '1 1 180px', padding: '6px 8px' }}
                        aria-label="Assignee"
                    >
                        <option value="">{item.owner_name ? `Unassigned (said: ${item.owner_name})` : 'Unassigned (goes to me)'}</option>
                        {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <input
                        type="date"
                        className="input-modern"
                        value={item.due_date ? item.due_date.slice(0, 10) : ''}
                        onChange={e => update({ due_date: e.target.value || null })}
                        style={{ flex: '0 1 150px', padding: '6px 8px' }}
                        aria-label="Due date"
                    />
                    <select
                        className="input-modern"
                        value={item.priority}
                        onChange={e => update({ priority: e.target.value })}
                        style={{ flex: '0 1 110px', padding: '6px 8px' }}
                        aria-label="Priority"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------

const MeetingList = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        http.get('/meeting-agent/sessions')
            .then(res => setSessions(res.data || []))
            .catch(err => console.error('Failed to load meetings:', err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mic size={26} color="var(--primary)" /> Meeting Notes
                </h1>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)' }}>
                    The BBC Meeting Agent listens to your Google Meet and writes notes in English and Arabic.
                    Start it from the Chrome extension while you are in a meeting.
                </p>
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
            ) : sessions.length === 0 ? (
                <div className="card-modern" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No meetings yet. Open a Google Meet, click the <b>BBC Meeting Agent</b> extension, then <b>Start listening</b>.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sessions.map(s => (
                        <Link key={s.id} to={`/meetings/${s.id}`} className="card-modern hover-lift" style={{ padding: '1rem 1.25rem', textDecoration: 'none', display: 'block' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</div>
                                <StatusBadge status={s.status} />
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                                {new Date(s.started_at).toLocaleString()}
                                {s.ended_at && ` · ${formatDuration(s.started_at, s.ended_at)}`}
                                {s._count?.actionItems ? ` · ${s._count.actionItems} action items` : ''}
                            </div>
                            {s.summary_en && (
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {s.summary_en}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
};

// ---------------------------------------------------------------------------

const MeetingDetail = ({ id }) => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [assignees, setAssignees] = useState([]);
    const [interim, setInterim] = useState('');
    const [liveStatus, setLiveStatus] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [tab, setTab] = useState('notes');
    const transcriptEnd = useRef(null);

    const load = useCallback(async () => {
        try {
            const res = await http.get(`/meeting-agent/sessions/${id}`);
            setSession(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Could not load this meeting' });
        }
    }, [id]);

    useEffect(() => {
        load();
        http.get('/meeting-agent/assignees').then(res => setAssignees(res.data || [])).catch(() => {});
    }, [load]);

    // Live transcript while the meeting is being recorded
    const status = session?.status;
    useEffect(() => {
        if (status !== 'recording') return undefined;
        const wsBase = API_BASE.replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsBase}/ws/meeting-agent?sessionId=${id}&token=${encodeURIComponent(getAuthToken())}&role=viewer`);
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'interim') setInterim(msg.text);
            if (msg.type === 'status') {
                setLiveStatus(msg.status);
                if (['processing', 'ready', 'failed'].includes(msg.status)) load();
            }
            if (msg.type === 'segment') {
                setInterim('');
                setSession(prev => prev && ({ ...prev, segments: [...prev.segments, msg.segment] }));
            }
        };
        return () => ws.close();
    }, [status, id, load]);

    // Poll while Claude writes the notes
    useEffect(() => {
        if (status !== 'processing') return undefined;
        const timer = setInterval(load, 4000);
        return () => clearInterval(timer);
    }, [status, load]);

    useEffect(() => {
        if (status === 'recording') transcriptEnd.current?.scrollIntoView({ block: 'nearest' });
    }, [session?.segments?.length, interim, status]);

    const act = async (fn, successText) => {
        setBusy(true);
        setMessage(null);
        try {
            await fn();
            if (successText) setMessage({ type: 'success', text: successText });
            await load();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || err.message });
        } finally {
            setBusy(false);
        }
    };

    const updateItem = async (itemId, patch) => {
        // Optimistic update so the form feels instant
        setSession(prev => ({
            ...prev,
            actionItems: prev.actionItems.map(i => (i.id === itemId ? { ...i, ...patch } : i))
        }));
        try {
            const res = await http.patch(`/meeting-agent/action-items/${itemId}`, patch);
            setSession(prev => ({ ...prev, actionItems: prev.actionItems.map(i => (i.id === itemId ? res.data : i)) }));
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Could not save' });
            load();
        }
    };

    if (!session) {
        return message ? <div style={{ color: '#dc2626' }}>{message.text}</div> : <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;
    }

    const notes = session.notes || {};
    const drafts = session.actionItems.filter(i => i.status === 'draft');
    const speech = session.segments.filter(s => s.kind === 'speech');
    const screens = session.segments.filter(s => s.kind === 'screen');

    const tabs = [
        { key: 'notes', label: 'Notes' },
        { key: 'transcript', label: `Transcript (${speech.length})` },
        { key: 'screens', label: `Screens (${screens.length})` }
    ];
    const activeTab = status === 'recording' ? 'transcript' : tab;

    return (
        <>
            <button className="btn-modern btn-modern-ghost" onClick={() => navigate('/meetings')} style={{ marginBottom: '1rem', padding: '6px 10px' }}>
                <ArrowLeft size={16} /> All meetings
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{session.title}</h1>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <StatusBadge status={status} />
                        {new Date(session.started_at).toLocaleString()}
                        {session.ended_at && ` · ${formatDuration(session.started_at, session.ended_at)}`}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {status === 'recording' && (
                        <button className="btn-modern btn-modern-primary" disabled={busy} style={{ background: '#dc2626' }}
                            onClick={() => act(() => http.post(`/meeting-agent/sessions/${id}/stop`))}>
                            <Square size={14} /> Stop &amp; write notes
                        </button>
                    )}
                    {['ready', 'failed'].includes(status) && (
                        <button className="btn-modern btn-modern-secondary" disabled={busy}
                            onClick={() => act(() => http.post(`/meeting-agent/sessions/${id}/regenerate`))}>
                            <RefreshCw size={14} /> Rewrite notes
                        </button>
                    )}
                    {['ready', 'failed'].includes(status) && (
                        <button className="btn-modern btn-modern-ghost" disabled={busy} title="Delete meeting"
                            onClick={() => window.confirm('Delete this meeting, its transcript and screenshots?')
                                && act(async () => { await http.delete(`/meeting-agent/sessions/${id}`); navigate('/meetings'); })}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.9rem',
                    background: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
                    color: message.type === 'error' ? '#dc2626' : '#059669'
                }}>
                    {message.text}
                </div>
            )}
            {status === 'failed' && session.error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', background: '#fef2f2', color: '#dc2626', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={18} /> {session.error}
                </div>
            )}
            {status === 'processing' && (
                <div className="card-modern" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Loader2 size={18} className="animate-spin" /> Claude is writing the notes in English and Arabic. This usually takes about a minute.
                </div>
            )}

            {status !== 'recording' && (
                <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', whiteSpace: 'nowrap',
                            fontWeight: 600, fontSize: '0.9rem',
                            color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: `2px solid ${activeTab === t.key ? 'var(--primary)' : 'transparent'}`
                        }}>{t.label}</button>
                    ))}
                </div>
            )}

            {activeTab === 'notes' && status === 'ready' && (
                <>
                    <Section icon={FileText} title="Summary · الملخص">
                        <Bilingual en={session.summary_en} ar={session.summary_ar} />
                    </Section>

                    <Section
                        icon={ListChecks}
                        title="Action items · المهام"
                        right={drafts.length > 0 && (
                            <button className="btn-modern btn-modern-primary" disabled={busy}
                                onClick={() => act(async () => {
                                    const res = await http.post(`/meeting-agent/sessions/${id}/create-tasks`, {});
                                    return res;
                                }, `Created ${drafts.length} task${drafts.length === 1 ? '' : 's'}`)}>
                                <CheckCircle2 size={14} /> Create {drafts.length} task{drafts.length === 1 ? '' : 's'}
                            </button>
                        )}
                    >
                        {session.actionItems.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)' }}>No action items in this meeting.</div>
                        ) : (
                            <>
                                <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Check who does what, then create the tasks. Click ✕ to skip an item.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {session.actionItems.map(item => (
                                        <ActionItemRow key={item.id} item={item} assignees={assignees} onChange={updateItem} />
                                    ))}
                                </div>
                            </>
                        )}
                    </Section>

                    {notes.decisions?.length > 0 && (
                        <Section icon={CheckCircle2} title="Decisions · القرارات">
                            <BilingualList items={notes.decisions} />
                        </Section>
                    )}
                    {notes.key_points?.length > 0 && (
                        <Section icon={Lightbulb} title="Key points · أهم النقاط">
                            <BilingualList items={notes.key_points} />
                        </Section>
                    )}
                    {notes.screen_highlights?.length > 0 && (
                        <Section icon={Monitor} title="On screen · ما عُرض على الشاشة">
                            <BilingualList items={notes.screen_highlights} />
                        </Section>
                    )}
                </>
            )}
            {activeTab === 'notes' && status !== 'ready' && status !== 'recording' && (
                <div style={{ color: 'var(--text-muted)' }}>Notes are not ready yet.</div>
            )}

            {activeTab === 'transcript' && (
                <Section icon={Mic} title={status === 'recording' ? `Live transcript${liveStatus === 'waiting_for_extension' ? ' (extension disconnected)' : ''}` : 'Transcript'}>
                    {speech.length === 0 && !interim ? (
                        <div style={{ color: 'var(--text-muted)' }}>
                            {status === 'recording' ? 'Waiting for someone to speak…' : 'No speech was captured.'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: status === 'recording' ? '60vh' : 'none', overflowY: 'auto' }}>
                            {speech.map(s => (
                                <div key={s.id} style={{ display: 'flex', gap: 12 }}>
                                    <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', paddingTop: 2, minWidth: 44 }}>{formatOffset(s.offset_ms)}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {s.speaker && <b style={{ color: 'var(--text-primary)' }}>{s.speaker}</b>}
                                        {/* One sentence per line so Arabic and English each read in their own direction */}
                                        {splitSentences(s.text).map((sentence, i) => (
                                            <div key={i} dir="auto" style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>{sentence}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {interim && (
                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', paddingInlineStart: 56 }}>
                                    {splitSentences(interim).map((sentence, i) => <div key={i} dir="auto">{sentence}</div>)}
                                </div>
                            )}
                            <div ref={transcriptEnd} />
                        </div>
                    )}
                </Section>
            )}

            {activeTab === 'screens' && (
                <Section icon={Monitor} title="Screens">
                    {screens.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No screenshots.</div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {screens.map(s => (
                                <div key={s.id}>
                                    <Screenshot sessionId={id} segmentId={s.id} />
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>{formatOffset(s.offset_ms)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}
        </>
    );
};

const MeetingNotesPage = () => {
    const { id } = useParams();
    return (
        <Dashboard>
            <div className="scrollbar-modern" style={{ padding: 'clamp(1rem, 3vw, 2rem)', height: '100%', overflow: 'auto', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    {id ? <MeetingDetail id={id} /> : <MeetingList />}
                </div>
            </div>
        </Dashboard>
    );
};

export default MeetingNotesPage;
