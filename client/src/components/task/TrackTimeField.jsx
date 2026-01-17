import { Play } from 'lucide-react';

const TrackTimeField = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Track Time</div>
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Play size={12} fill="currentColor" /> Add time
            </div>
        </div>
    );
};

export default TrackTimeField;
