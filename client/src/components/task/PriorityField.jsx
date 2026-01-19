import { useState } from 'react';
import { Flag, ChevronDown } from 'lucide-react';

const PRIORITY_OPTIONS = [
    { value: 'urgent', label: 'Urgent', color: '#dc2626', bgColor: '#fef2f2' },
    { value: 'high', label: 'High', color: '#ea580c', bgColor: '#fff7ed' },
    { value: 'normal', label: 'Normal', color: '#2563eb', bgColor: '#eff6ff' },
    { value: 'low', label: 'Low', color: '#16a34a', bgColor: '#f0fdf4' }
];

const PriorityField = ({ priority, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);

    const currentPriority = PRIORITY_OPTIONS.find(p =>
        p.value === (priority || '').toLowerCase()
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#6b7280',
                minWidth: '90px'
            }}>
                Priority
            </div>

            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: currentPriority ? currentPriority.bgColor : '#f9fafb',
                        border: currentPriority ? `1px solid ${currentPriority.color}30` : '1px solid #e5e7eb',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: currentPriority ? currentPriority.color : '#9ca3af',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                    }}
                >
                    <Flag
                        size={14}
                        fill={currentPriority ? currentPriority.color : 'none'}
                        color={currentPriority ? currentPriority.color : '#9ca3af'}
                    />
                    {currentPriority ? currentPriority.label : 'Set priority'}
                    <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>

                {isOpen && (
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            border: '1px solid #e5e7eb',
                            minWidth: '140px',
                            zIndex: 20,
                            overflow: 'hidden'
                        }}>
                            {PRIORITY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onUpdate(option.value);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: priority === option.value ? option.bgColor : 'transparent',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        color: option.color,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontWeight: 500
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = option.bgColor}
                                    onMouseLeave={(e) => {
                                        if (priority !== option.value) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <Flag size={14} fill={option.color} color={option.color} />
                                    {option.label}
                                </button>
                            ))}
                            {priority && (
                                <>
                                    <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
                                    <button
                                        onClick={() => {
                                            onUpdate(null);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: '0.85rem',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Clear priority
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PriorityField;
