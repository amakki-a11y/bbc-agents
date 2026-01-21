import { useState, useEffect } from 'react';
import { X, Bot, ChevronDown, Share2, MoreHorizontal, Copy, Trash2, ArrowRight, CheckSquare, FolderKanban, Loader2 } from 'lucide-react';

// Using centralized API_URL from http.js

const STATUS_CONFIG = {
    'TO DO': { color: '#6b7280', bgColor: '#f3f4f6', label: 'To Do' },
    'todo': { color: '#6b7280', bgColor: '#f3f4f6', label: 'To Do' },
    'IN PROGRESS': { color: '#3b82f6', bgColor: '#eff6ff', label: 'In Progress' },
    'in_progress': { color: '#3b82f6', bgColor: '#eff6ff', label: 'In Progress' },
    'DONE': { color: '#10b981', bgColor: '#ecfdf5', label: 'Done' },
    'done': { color: '#10b981', bgColor: '#ecfdf5', label: 'Done' }
};

const MoveToProjectModal = ({ isOpen, onClose, currentProjectId, onMove }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProjects(data.filter(p => p.id !== currentProjectId));
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} onClick={onClose} />
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                width: '360px',
                zIndex: 101,
                overflow: 'hidden'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                        Move to Project
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '4px'
                    }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : projects.length > 0 ? (
                        projects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => onMove(project.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '12px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <FolderKanban size={16} style={{ color: '#6b7280' }} />
                                <span style={{ fontSize: '0.9rem', color: '#374151' }}>{project.name}</span>
                            </button>
                        ))
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                            No other projects available
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

const TaskDetailsHeader = ({ task, project, onClose, onDuplicate, onMove, onDelete }) => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG['TO DO'];

    const handleDuplicate = async () => {
        if (!task?.id) return;

        setIsDuplicating(true);
        setShowMoreMenu(false);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/details/${task.id}/duplicate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const duplicatedTask = await response.json();
                if (onDuplicate) {
                    onDuplicate(duplicatedTask);
                }
            } else {
                alert('Failed to duplicate task');
            }
        } catch (error) {
            console.error('Duplicate error:', error);
            alert('Failed to duplicate task');
        } finally {
            setIsDuplicating(false);
        }
    };

    const handleMove = async (projectId) => {
        if (!task?.id) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/details/${task.id}/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ project_id: projectId })
            });

            if (response.ok) {
                setShowMoveModal(false);
                if (onMove) {
                    onMove(projectId);
                }
                onClose(); // Close task details since task moved to different project
            } else {
                alert('Failed to move task');
            }
        } catch (error) {
            console.error('Move error:', error);
            alert('Failed to move task');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (onDelete) {
                    onDelete(task.id);
                }
                onClose();
            } else {
                alert('Failed to delete task');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete task');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            background: 'white',
            flexShrink: 0
        }}>
            {/* Left Side: Breadcrumb, Type Badge, Task ID, Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Breadcrumb */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: '#6b7280'
                }}>
                    <FolderKanban size={14} style={{ color: '#9ca3af' }} />
                    <span style={{ color: '#9ca3af' }}>{project?.name || 'Project'}</span>
                    <ChevronDown size={14} style={{ color: '#d1d5db', transform: 'rotate(-90deg)' }} />
                    <span style={{ color: '#4b5563', fontWeight: 500 }}>Task #{task.id}</span>
                </div>

                <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />

                {/* Task Type Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f5f3ff',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#7c3aed',
                    cursor: 'pointer',
                    border: '1px solid #e9d5ff',
                    transition: 'all 0.15s'
                }}>
                    <CheckSquare size={12} />
                    TASK
                    <ChevronDown size={12} />
                </div>

                {/* Status Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: statusConfig.bgColor,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: statusConfig.color,
                    border: `1px solid ${statusConfig.color}30`
                }}>
                    <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: statusConfig.color
                    }} />
                    {statusConfig.label}
                </div>

                <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />

                {/* Ask AI Button */}
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.15s'
                }}>
                    <Bot size={14} />
                    Ask AI
                </button>
            </div>

            {/* Right Side: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Share Button */}
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: '1px solid #e5e7eb',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                }}
                >
                    <Share2 size={14} />
                    Share
                </button>

                {/* More Options */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showMoreMenu && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                onClick={() => setShowMoreMenu(false)}
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
                                <button
                                    onClick={handleDuplicate}
                                    disabled={isDuplicating}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        color: isDuplicating ? '#9ca3af' : '#374151',
                                        cursor: isDuplicating ? 'wait' : 'pointer',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => !isDuplicating && (e.currentTarget.style.background = '#f9fafb')}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {isDuplicating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Copy size={14} />}
                                    {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        setShowMoveModal(true);
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
                                        color: '#374151',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <ArrowRight size={14} /> Move to...
                                </button>
                                <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ width: '1px', height: '24px', background: '#e5e7eb', margin: '0 4px' }} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.color = '#6b7280';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Move to Project Modal */}
            <MoveToProjectModal
                isOpen={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                currentProjectId={task?.project_id || task?.projectId}
                onMove={handleMove}
            />
        </div>
    );
};

export default TaskDetailsHeader;
