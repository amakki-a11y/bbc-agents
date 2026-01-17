import { CheckCircle2, Circle } from 'lucide-react';

const StatusField = ({ status, onUpdate }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Status</div>
            <div
                onClick={() => onUpdate(status === 'done' ? 'TO DO' : 'done')}
                style={{
                    background: status === 'done' ? '#10b981' : '#d1d5db',
                    color: 'white', padding: '4px 12px', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
            >
                {status === 'done' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {status}
            </div>
        </div>
    );
};

export default StatusField;
