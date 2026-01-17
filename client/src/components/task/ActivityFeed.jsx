const ActivityFeed = ({ activity = [] }) => {
    // Reverse to show newest at bottom? Or newest at top? 
    // Usually clickup shows newest at bottom if it's a chat, or newest at top for history.
    // The screenshot shows a feed. Let's assume standard feed (newest bottom or top).
    // Let's stick to newest at top for now or follow the previous implementation (reversed).
    const entries = [...activity];

    if (entries.length === 0) {
        return <div style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No activity yet</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {entries.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '0.8rem' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: log.user === 'MT' ? '#8b5cf6' : '#ccc',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0
                    }}>
                        {log.user ? log.user.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>
                                {log.user === 'MT' ? 'You' : log.user}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>
                            {log.type === 'comment' ? (
                                <div style={{
                                    background: 'white', border: '1px solid #e5e7eb',
                                    padding: '0.8rem', borderRadius: '8px', borderTopLeftRadius: '0',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    {log.message.replace(/.*? commented: /, '')}
                                </div>
                            ) : (
                                log.message
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityFeed;
