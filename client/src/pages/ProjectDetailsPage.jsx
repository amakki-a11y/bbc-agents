import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Share2, Clock, Calendar,
    CheckCircle2, Circle, Loader2, AlertCircle,
    Sparkles, MoreVertical, Trash2, Play, Pause
} from 'lucide-react';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import ShareModal from '../components/projects/ShareModal';

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

function ProjectDetailsPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('tasks');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const isManagerOrAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);

    useEffect(() => {
        fetchProject();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            setError('');

            const [projectRes, activitiesRes] = await Promise.all([
                http.get(`/projects/${projectId}`),
                http.get(`/projects/${projectId}/activities`).catch(() => ({ data: [] }))
            ]);

            setProject(projectRes.data);
            setTasks(projectRes.data.tasks || []);
            setActivities(activitiesRes.data || []);
        } catch (err) {
            console.error('Error fetching project:', err);
            setError(err.response?.data?.error || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await http.put(`/projects/${projectId}`, { status: newStatus });
            setProject(prev => ({ ...prev, status: newStatus }));
            setShowMenu(false);
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.error || 'Failed to update status');
        }
    };

    const handleApprove = async () => {
        try {
            await http.post(`/projects/${projectId}/approve`);
            fetchProject();
        } catch (err) {
            console.error('Error approving project:', err);
            alert(err.response?.data?.error || 'Failed to approve project');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        try {
            await http.delete(`/projects/${projectId}`);
            navigate('/projects');
        } catch (err) {
            console.error('Error deleting project:', err);
            alert(err.response?.data?.error || 'Failed to delete project');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatActivityDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const statusStyle = project ? statusColors[project.status] || statusColors.ACTIVE : {};
    const priorityStyle = project ? priorityColors[project.priority] || priorityColors.MEDIUM : {};

    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    if (loading) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#6b7280'
                }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    gap: '1rem'
                }}>
                    <AlertCircle size={48} color="#dc2626" />
                    <p style={{ color: '#dc2626', fontSize: '1.1rem' }}>{error}</p>
                    <button
                        onClick={() => navigate('/projects')}
                        style={{
                            padding: '10px 20px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Projects
                    </button>
                </div>
            </Dashboard>
        );
    }

    if (!project) return <Dashboard><div /></Dashboard>;

    return (
        <Dashboard>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', height: '100%', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/projects')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: 'transparent',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        marginBottom: '1rem'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Projects
                </button>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '4px',
                                    background: project.color || '#6366f1'
                                }}
                            />
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: '#1f2937',
                                margin: 0
                            }}>
                                {project.name}
                            </h1>
                            {project.isAIGenerated && (
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    background: '#f3e8ff',
                                    color: '#7c3aed',
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontWeight: 500
                                }}>
                                    <Sparkles size={14} /> AI Generated
                                </span>
                            )}
                        </div>
                        {project.description && (
                            <p style={{
                                color: '#6b7280',
                                margin: '0.5rem 0 0 0',
                                fontSize: '0.95rem',
                                maxWidth: '600px'
                            }}>
                                {project.description}
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {project.status === 'PENDING_APPROVAL' && isManagerOrAdmin && (
                            <button
                                onClick={handleApprove}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 18px',
                                    background: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <CheckCircle2 size={18} />
                                Approve
                            </button>
                        )}
                        <button
                            onClick={() => setShowShareModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 18px',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <Share2 size={18} />
                            Share
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <MoreVertical size={18} />
                            </button>
                            {showMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '4px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    border: '1px solid #e5e7eb',
                                    minWidth: '180px',
                                    zIndex: 100
                                }}>
                                    <button
                                        onClick={() => handleStatusChange('ACTIVE')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#374151'
                                        }}
                                    >
                                        <Play size={16} /> Set Active
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('ON_HOLD')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#374151'
                                        }}
                                    >
                                        <Pause size={16} /> Put On Hold
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('COMPLETED')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#374151'
                                        }}
                                    >
                                        <CheckCircle2 size={16} /> Mark Complete
                                    </button>
                                    <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
                                    <button
                                        onClick={handleDelete}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: '#dc2626'
                                        }}
                                    >
                                        <Trash2 size={16} /> Delete Project
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Meta */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    padding: '1rem 1.25rem',
                    background: '#f9fafb',
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0' }}>Status</p>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500
                    }}>
                        {project.status?.replace('_', ' ')}
                    </span>
                </div>

                <div style={{
                    padding: '1rem 1.25rem',
                    background: '#f9fafb',
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0' }}>Priority</p>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: priorityStyle.bg,
                        color: priorityStyle.text,
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500
                    }}>
                        {project.priority}
                    </span>
                </div>

                <div style={{
                    padding: '1rem 1.25rem',
                    background: '#f9fafb',
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0' }}>Progress</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            flex: 1,
                            height: '8px',
                            background: '#e5e7eb',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: progress === 100 ? '#10b981' : '#6366f1',
                                borderRadius: '9999px'
                            }} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                            {progress}%
                        </span>
                    </div>
                </div>

                <div style={{
                    padding: '1rem 1.25rem',
                    background: '#f9fafb',
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0' }}>Due Date</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
                        <Calendar size={16} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {formatDate(project.dueDate)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '1.5rem'
            }}>
                {[
                    { id: 'tasks', label: `Tasks (${tasks.length})` },
                    { id: 'activity', label: 'Activity' },
                    { id: 'members', label: 'Members' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 1.25rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeTab === tab.id ? '#6366f1' : '#6b7280',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'tasks' && (
                <div>
                    {tasks.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            background: '#f9fafb',
                            borderRadius: '12px'
                        }}>
                            <Circle size={40} color="#d1d5db" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>No tasks yet</h3>
                            <p style={{ color: '#9ca3af', margin: 0 }}>Tasks will appear here when added</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem 1.25rem',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    {task.status === 'DONE' ? (
                                        <CheckCircle2 size={20} color="#10b981" />
                                    ) : (
                                        <Circle size={20} color="#d1d5db" />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <p style={{
                                            margin: 0,
                                            fontWeight: 500,
                                            color: task.status === 'DONE' ? '#9ca3af' : '#1f2937',
                                            textDecoration: task.status === 'DONE' ? 'line-through' : 'none'
                                        }}>
                                            {task.title}
                                        </p>
                                        {task.assignee && (
                                            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                                Assigned to {task.assignee.name}
                                            </p>
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 8px',
                                        background: task.status === 'DONE' ? '#d1fae5' : '#f3f4f6',
                                        color: task.status === 'DONE' ? '#059669' : '#6b7280',
                                        borderRadius: '4px',
                                        fontWeight: 500
                                    }}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'activity' && (
                <div>
                    {activities.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            background: '#f9fafb',
                            borderRadius: '12px'
                        }}>
                            <Clock size={40} color="#d1d5db" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>No activity yet</h3>
                            <p style={{ color: '#9ca3af', margin: 0 }}>Project activity will appear here</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {activities.map(activity => (
                                <div
                                    key={activity.id}
                                    style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: '#f9fafb',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#6366f1',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        flexShrink: 0
                                    }}>
                                        {activity.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>
                                            <strong>{activity.user?.name || 'Unknown'}</strong> {activity.action}
                                        </p>
                                        {activity.details && (
                                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                                                {activity.details}
                                            </p>
                                        )}
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                                            {formatActivityDate(activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'members' && (
                <div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        {/* Owner */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: '#f9fafb',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#6366f1',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem',
                                fontWeight: 600
                            }}>
                                {project.creator?.name?.charAt(0) || 'O'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>
                                    {project.creator?.name || 'Project Owner'}
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                    Owner
                                </p>
                            </div>
                        </div>

                        {/* Project Members */}
                        {project.members?.map(member => (
                            <div
                                key={member.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#e5e7eb',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 600
                                }}>
                                    {member.employee?.name?.charAt(0) || 'M'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>
                                        {member.employee?.name || 'Member'}
                                    </p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                        {member.role}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {(!project.members || project.members.length === 0) && (
                            <p style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                                No additional members. Use the Share button to add people.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                project={project}
                onShareUpdated={fetchProject}
            />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
        </Dashboard>
    );
}

export default ProjectDetailsPage;
