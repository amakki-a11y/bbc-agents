import { Flag } from 'lucide-react';

const PriorityField = ({ priority, onUpdate }) => {
    const getFlagColor = (p) => {
        if (!p) return '#d1d5db';
        switch (p.toLowerCase()) {
            case 'urgent': return '#ef4444';
            case 'high': return '#eab308';
            case 'normal': return '#3b82f6';
            case 'low': return '#9ca3af';
            default: return '#d1d5db';
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Priority</div>
            <div style={{ position: 'relative' }}>
                <select
                    value={priority || ''}
                    onChange={(e) => onUpdate(e.target.value)}
                    style={{
                        position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', zIndex: 10
                    }}
                >
                    <option value="">None</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flag size={16} fill={getFlagColor(priority)} color={getFlagColor(priority)} />
                    <span style={{ fontSize: '0.85rem', color: priority ? '#374151' : '#9ca3af', textTransform: 'capitalize' }}>
                        {priority || 'Empty'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PriorityField;
