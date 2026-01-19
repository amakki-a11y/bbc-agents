import { useState } from 'react';
import { Clock, X } from 'lucide-react';

const TimeEstimateField = ({ estimate, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localEstimate, setLocalEstimate] = useState(estimate || '');

    const handleSave = () => {
        setIsEditing(false);
        if (localEstimate !== estimate) {
            onUpdate(localEstimate || null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
        if (e.key === 'Escape') {
            setLocalEstimate(estimate || '');
            setIsEditing(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#6b7280',
                minWidth: '90px'
            }}>
                Estimate
            </div>

            {isEditing ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <input
                        type="text"
                        value={localEstimate}
                        onChange={(e) => setLocalEstimate(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., 2h, 30m"
                        autoFocus
                        style={{
                            width: '100px',
                            padding: '6px 10px',
                            border: '1px solid #6366f1',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            outline: 'none'
                        }}
                    />
                </div>
            ) : estimate ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#eff6ff',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                }}>
                    <Clock size={14} style={{ color: '#3b82f6' }} />
                    <span style={{
                        fontSize: '0.8rem',
                        color: '#1e40af',
                        fontWeight: 500
                    }}>
                        {estimate}
                    </span>
                    <button
                        onClick={() => onUpdate(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            padding: '2px',
                            borderRadius: '50%',
                            color: '#93c5fd',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f9fafb',
                        border: '1px dashed #d1d5db',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#9ca3af';
                        e.currentTarget.style.color = '#6b7280';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.color = '#9ca3af';
                    }}
                >
                    <Clock size={14} />
                    Add estimate
                </button>
            )}
        </div>
    );
};

export default TimeEstimateField;
