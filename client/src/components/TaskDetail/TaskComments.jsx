import React from 'react';

const TaskComments = ({ activity, onAddComment }) => {
    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {[...(activity || [])].reverse().map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '0.8rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: log.user === 'MT' ? '#8b5cf6' : '#ccc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
                            {log.user}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{log.user === 'MT' ? 'You' : log.user}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>
                                {log.type === 'comment' ? (
                                    <div style={{ background: '#f3f4f6', padding: '0.8rem', borderRadius: '8px', borderTopLeftRadius: '0' }}>
                                        {log.message.replace('MT commented: ', '')}
                                    </div>
                                ) : (
                                    log.message
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {(!activity || activity.length === 0) && (
                    <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>No activity yet.</div>
                )}
            </div>

            {/* Comment Input */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>MT</div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        placeholder="Write a comment..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                onAddComment(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        style={{
                            width: '100%', padding: '0.8rem 1rem', borderRadius: '8px',
                            border: '1px solid #e5e7eb', outline: 'none', fontSize: '0.9rem',
                            transition: 'box-shadow 0.2s'
                        }}
                        onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #ddd'}
                        onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#aaa' }}>Press Enter</div>
                </div>
            </div>
        </div>
    );
};

export default TaskComments;
