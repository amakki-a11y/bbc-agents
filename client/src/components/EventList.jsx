import { Calendar as CalendarIcon } from 'lucide-react';

const EventList = ({ events }) => {
    if (!events.length) {
        return <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No upcoming events.</div>;
    }

    return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {events.map(event => (
                <li key={event.id} style={{
                    marginBottom: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--primary)'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{event.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CalendarIcon size={14} />
                        {new Date(event.start_time).toLocaleString()}
                    </div>
                    {event.description && (
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{event.description}</div>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default EventList;
