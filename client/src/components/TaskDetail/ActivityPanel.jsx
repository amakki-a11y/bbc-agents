import { useState, useEffect } from 'react';
import { Send, Paperclip, Smile, Bell } from 'lucide-react';
import axios from 'axios';

const ActivityPanel = ({ taskId, activities: initialActivities }) => {
    const [activities, setActivities] = useState([]);

    // Use passed activities prop as source of truth when available
    useEffect(() => {
        if (initialActivities) {
            setActivities(initialActivities.map(a => ({
                id: a.id,
                text: a.content || a.text, // handle API vs Mock format
                time: new Date(a.timestamp || Date.now()).toLocaleString(),
                type: a.type
            })));
        }
    }, [initialActivities]);

    const [comment, setComment] = useState("");

    const handleSend = async () => {
        if (!comment.trim()) return;
        // Optimistic update
        const newActivity = {
            id: Date.now(),
            text: "You commented: " + comment,
            time: "Just now",
            type: "comment",
            user: "Me"
        };
        setActivities([newActivity, ...activities]); // Prepend logic
        setComment("");

        // API call
        try {
            await axios.post(`http://localhost:3000/api/tasks/details/${taskId}/comments`, { content: comment });
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{
            flex: '0 0 350px',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            background: '#181825',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#eee' }}>Activity</h3>
                <button className="icon-btn"><Bell size={16} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {activities.map(act => (
                    <div key={act.id} style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#aaa', paddingLeft: '1rem', borderLeft: '2px solid #333' }}>
                        <div style={{ color: '#ccc', marginBottom: '2px' }}>{act.text}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555' }}>{act.time}</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#1E1E2E' }}>
                <div style={{
                    background: '#2A2A3A', borderRadius: '8px', padding: '0.5rem',
                    border: '1px solid #333'
                }}>
                    <textarea
                        placeholder="Write a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{
                            width: '100%', background: 'transparent', border: 'none',
                            color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none', minHeight: '60px'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', color: '#888' }}>
                            <Paperclip size={16} style={{ cursor: 'pointer' }} />
                            <Smile size={16} style={{ cursor: 'pointer' }} />
                        </div>
                        <button
                            onClick={handleSend}
                            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityPanel;
