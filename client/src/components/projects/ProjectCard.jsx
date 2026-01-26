import { useState } from 'react';
import { Calendar, Users, CheckCircle, Clock, Sparkles } from 'lucide-react';

const statusColors = {
    DRAFT: { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
    PENDING_APPROVAL: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
    ACTIVE: { bg: '#d1fae5', text: '#059669', border: '#6ee7b7' },
    ON_HOLD: { bg: '#fef9c3', text: '#ca8a04', border: '#fde047' },
    COMPLETED: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
    ARCHIVED: { bg: '#f3f4f6', text: '#9ca3af', border: '#e5e7eb' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' }
};

const priorityColors = {
    LOW: { bg: '#f3f4f6', text: '#6b7280' },
    MEDIUM: { bg: '#dbeafe', text: '#2563eb' },
    HIGH: { bg: '#ffedd5', text: '#ea580c' },
    URGENT: { bg: '#fee2e2', text: '#dc2626' }
};

function ProjectCard({
    project,
    onClick,
    showApprovalActions = false,
    onApprove,
    onReject
}) {
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    const taskCount = project._count?.tasks || project.taskCount || 0;
    const completedCount = project.completedCount || 0;
    const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    const statusStyle = statusColors[project.status] || statusColors.ACTIVE;
    const priorityStyle = priorityColors[project.priority] || priorityColors.MEDIUM;

    const handleReject = (e) => {
        e.stopPropagation();
        if (showRejectInput) {
            onReject(rejectReason);
            setShowRejectInput(false);
            setRejectReason('');
        } else {
            setShowRejectInput(true);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                transform: isHovered ? 'translateY(-2px)' : 'none'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <div
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '4px',
                            backgroundColor: project.color || '#6366f1',
                            flexShrink: 0
                        }}
                    />
                    <h3 style={{
                        fontWeight: 600,
                        color: '#1f2937',
                        fontSize: '1rem',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {project.name}
                    </h3>
                </div>
                {project.isAIGenerated && (
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        background: '#f3e8ff',
                        color: '#7c3aed',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontWeight: 500
                    }}>
                        <Sparkles size={12} /> AI
                    </span>
                )}
            </div>

            {/* Description */}
            {project.description && (
                <p style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    marginBottom: '0.75rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5
                }}>
                    {project.description}
                </p>
            )}

            {/* Status & Priority Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                }}>
                    {project.status?.replace('_', ' ')}
                </span>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: priorityStyle.bg,
                    color: priorityStyle.text,
                    fontWeight: 500
                }}>
                    {project.priority}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '0.75rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '4px'
                }}>
                    <span>{taskCount} tasks</span>
                    <span>{progress}%</span>
                </div>
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: '#f3f4f6',
                    borderRadius: '9999px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: progress === 100 ? '#10b981' : '#6366f1',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#9ca3af'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} />
                    <span>{project.creator?.name || 'Unknown'}</span>
                </div>
                {project.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        <span>Due {formatDate(project.dueDate)}</span>
                    </div>
                )}
            </div>

            {/* Approval Actions */}
            {showApprovalActions && (
                <div
                    style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e5e7eb'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {showRejectInput ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.85rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handleReject}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        background: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Confirm Reject
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowRejectInput(false); }}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    background: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <CheckCircle size={16} /> Approve
                            </button>
                            <button
                                onClick={handleReject}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProjectCard;
