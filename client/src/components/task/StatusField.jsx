import { useState } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'TO DO', label: 'To Do', color: '#6b7280', bgColor: '#f3f4f6', icon: Circle },
    { value: 'IN PROGRESS', label: 'In Progress', color: '#3b82f6', bgColor: '#eff6ff', icon: Clock },
    { value: 'DONE', label: 'Done', color: '#10b981', bgColor: '#ecfdf5', icon: CheckCircle2 }
];

// Normalize status to match STATUS_OPTIONS values
const normalizeStatus = (status) => {
    if (!status) return 'TO DO';
    const s = status.toLowerCase().replace(/[_\s]+/g, ' ').trim();

    if (s === 'todo' || s === 'to do') return 'TO DO';
    if (s === 'in progress' || s === 'inprogress' || s === 'in_progress') return 'IN PROGRESS';
    if (s === 'done' || s === 'complete' || s === 'completed') return 'DONE';

    return 'TO DO';
};

const StatusField = ({ status, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);

    const normalizedStatus = normalizeStatus(status);
    const currentStatus = STATUS_OPTIONS.find(s => s.value === normalizedStatus) || STATUS_OPTIONS[0];

    const Icon = currentStatus.icon;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#6b7280',
                minWidth: '90px'
            }}>
                Status
            </div>

            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: currentStatus.bgColor,
                        border: `1px solid ${currentStatus.color}30`,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: currentStatus.color,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                    }}
                >
                    <Icon size={14} />
                    {currentStatus.label}
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
                            minWidth: '160px',
                            zIndex: 20,
                            overflow: 'hidden'
                        }}>
                            {STATUS_OPTIONS.map((option) => {
                                const OptionIcon = option.icon;
                                const isSelected = normalizedStatus === option.value;
                                return (
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
                                            background: isSelected ? option.bgColor : 'transparent',
                                            border: 'none',
                                            fontSize: '0.85rem',
                                            color: option.color,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontWeight: 500
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = option.bgColor}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <OptionIcon size={14} />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StatusField;
