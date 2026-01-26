import { useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const DatesField = ({ startDate, dueDate, onUpdate }) => {
    const [_isHovered, setIsHovered] = useState(false);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#6b7280',
                minWidth: '90px'
            }}>
                Dates
            </div>

            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f9fafb',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}
            >
                {/* Start Date */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="date"
                        value={startDate ? startDate.split('T')[0] : ''}
                        onChange={(e) => onUpdate('start_date', e.target.value)}
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            inset: 0,
                            cursor: 'pointer',
                            width: '100%',
                            height: '100%'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        color: startDate ? '#374151' : '#9ca3af',
                        fontWeight: startDate ? 500 : 400,
                        cursor: 'pointer'
                    }}>
                        <Calendar size={14} style={{ color: '#9ca3af' }} />
                        {startDate ? formatDate(startDate) : 'Start'}
                    </div>
                </div>

                <ArrowRight size={14} style={{ color: '#d1d5db' }} />

                {/* Due Date */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="date"
                        value={dueDate ? dueDate.split('T')[0] : ''}
                        onChange={(e) => onUpdate('due_date', e.target.value)}
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            inset: 0,
                            cursor: 'pointer',
                            width: '100%',
                            height: '100%'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        color: dueDate ? '#374151' : '#9ca3af',
                        fontWeight: dueDate ? 500 : 400,
                        cursor: 'pointer'
                    }}>
                        <Calendar size={14} style={{ color: dueDate ? '#ef4444' : '#9ca3af' }} />
                        {dueDate ? formatDate(dueDate) : 'Due'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatesField;
