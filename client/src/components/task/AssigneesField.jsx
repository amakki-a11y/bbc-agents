import { useState } from 'react';
import { UserPlus, Plus, X } from 'lucide-react';

const getAvatarColor = (name) => {
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const AssigneesField = ({ assignee, onUpdate }) => {
    const [isHovered, setIsHovered] = useState(false);

    const hasAssignee = assignee && assignee.length > 0;
    const assigneeInitials = hasAssignee
        ? (typeof assignee === 'string' ? assignee.substring(0, 2) : String(assignee).substring(0, 2))
        : null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#6b7280',
                minWidth: '90px'
            }}>
                Assignee
            </div>

            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                {hasAssignee ? (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f9fafb',
                            padding: '4px 10px 4px 4px',
                            borderRadius: '20px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: getAvatarColor(assignee),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}>
                                {assigneeInitials}
                            </div>
                            <span style={{
                                fontSize: '0.85rem',
                                color: '#374151',
                                fontWeight: 500
                            }}>
                                {assignee}
                            </span>
                            <button
                                onClick={() => onUpdate(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '2px',
                                    borderRadius: '50%',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    opacity: isHovered ? 1 : 0,
                                    transition: 'opacity 0.15s'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                background: 'transparent',
                                border: '2px dashed #d1d5db',
                                borderRadius: '50%',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                opacity: isHovered ? 1 : 0,
                                transition: 'opacity 0.15s'
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    </>
                ) : (
                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
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
                        <UserPlus size={14} />
                        Click to assign
                    </button>
                )}
            </div>
        </div>
    );
};

export default AssigneesField;
