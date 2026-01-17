import { Clock } from 'lucide-react';

const TimeEstimateField = ({ estimate }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Time Estimate</div>
            <div style={{
                border: '1px dashed #d1d5db', borderRadius: '4px', padding: '4px 8px',
                fontSize: '0.8rem', color: '#9ca3af', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <Clock size={14} />
                {estimate || 'Add estimate'}
            </div>
        </div>
    );
};

export default TimeEstimateField;
