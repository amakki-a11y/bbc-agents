import { Calendar, ArrowRight } from 'lucide-react';

const DatesField = ({ startDate, dueDate, onUpdate }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Dates</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="date-pill">
                    {startDate ? new Date(startDate).toLocaleDateString() : 'Start date'}
                </div>
                <ArrowRight size={12} color="#999" />
                <div style={{ position: 'relative' }}>
                    <input
                        type="date"
                        value={dueDate ? dueDate.split('T')[0] : ''}
                        onChange={(e) => onUpdate('due_date', e.target.value)}
                        style={{
                            position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer'
                        }}
                    />
                    <div className="date-pill" style={{ color: dueDate ? '#333' : '#9ca3af' }}>
                        {dueDate ? new Date(dueDate).toLocaleDateString() : 'Due date'}
                    </div>
                </div>
            </div>
            <style>{`
                .date-pill {
                    border: 1px dashed #d1d5db; border-radius: 4px; padding: 4px 8px;
                    font-size: 0.8rem; color: #9ca3af; cursor: pointer;
                    display: flex; alignItems: center; gap: 6px;
                }
                .date-pill:hover { border-color: #9ca3af; background: #f9fafb; }
            `}</style>
        </div>
    );
};

export default DatesField;
