import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClients } from '../context/ClientsContext';
import Dashboard from './Dashboard';
import {
    ArrowLeft, Phone, Mail, Building2, MapPin, Globe, Edit2, Trash2,
    MessageSquare, Calendar, Clock, User, Plus, Send, Pin, MoreHorizontal,
    CheckCircle, Circle, Flame, Thermometer, Snowflake, Activity, FileText, Tag
} from 'lucide-react';

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        currentClient,
        loading,
        fetchClient,
        updateClient,
        deleteClient,
        addInteraction,
        addNote,
        addTask,
        updateTask
    } = useClients();

    const [activeTab, setActiveTab] = useState('overview');
    const [showInteractionModal, setShowInteractionModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [newInteraction, setNewInteraction] = useState({
        type: 'CALL',
        subject: '',
        description: '',
        outcome: ''
    });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'MEDIUM'
    });

    useEffect(() => {
        if (id) {
            fetchClient(id);
        }
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await deleteClient(parseInt(id));
                navigate('/clients');
            } catch (err) {
                console.error('Failed to delete client:', err);
            }
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await addNote(parseInt(id), { content: newNote });
            setNewNote('');
            setShowNoteModal(false);
            fetchClient(id);
        } catch (err) {
            console.error('Failed to add note:', err);
        }
    };

    const handleAddInteraction = async () => {
        if (!newInteraction.subject.trim()) return;
        try {
            await addInteraction(parseInt(id), newInteraction);
            setNewInteraction({ type: 'CALL', subject: '', description: '', outcome: '' });
            setShowInteractionModal(false);
            fetchClient(id);
        } catch (err) {
            console.error('Failed to add interaction:', err);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) return;
        try {
            await addTask(parseInt(id), newTask);
            setNewTask({ title: '', description: '', dueDate: '', priority: 'MEDIUM' });
            setShowTaskModal(false);
            fetchClient(id);
        } catch (err) {
            console.error('Failed to add task:', err);
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await updateTask(parseInt(id), taskId, { status: 'completed' });
            fetchClient(id);
        } catch (err) {
            console.error('Failed to complete task:', err);
        }
    };

    const getRatingIcon = (rating) => {
        if (rating === 'HOT') return <Flame size={16} style={{ color: '#ef4444' }} />;
        if (rating === 'WARM') return <Thermometer size={16} style={{ color: '#f97316' }} />;
        if (rating === 'COLD') return <Snowflake size={16} style={{ color: '#3b82f6' }} />;
        return null;
    };

    const getInteractionIcon = (type) => {
        const icons = {
            CALL: Phone,
            EMAIL: Mail,
            MEETING: Calendar,
            VIDEO_CALL: Calendar,
            NOTE: FileText
        };
        const Icon = icons[type] || MessageSquare;
        return <Icon size={16} />;
    };

    if (loading || !currentClient) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'var(--text-muted)'
                }}>
                    Loading client...
                </div>
            </Dashboard>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'interactions', label: 'Interactions', count: currentClient.interactions?.length },
        { id: 'notes', label: 'Notes', count: currentClient.notes?.length },
        { id: 'tasks', label: 'Tasks', count: currentClient.tasks?.length },
        { id: 'activity', label: 'Activity' }
    ];

    return (
        <Dashboard>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    {/* Breadcrumb */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <Link
                            to="/clients"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                fontSize: '0.875rem'
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back to CRM
                        </Link>
                    </div>

                    {/* Client Info */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '16px',
                                background: 'var(--primary-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1.5rem'
                            }}>
                                {currentClient.firstName?.charAt(0)}{currentClient.lastName?.charAt(0)}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <h1 style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        margin: 0
                                    }}>
                                        {currentClient.firstName} {currentClient.lastName}
                                    </h1>
                                    {getRatingIcon(currentClient.rating)}
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: currentClient.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                        color: currentClient.status === 'ACTIVE' ? '#22c55e' : '#3b82f6'
                                    }}>
                                        {currentClient.status}
                                    </span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: 'rgba(168, 85, 247, 0.15)',
                                        color: '#a855f7'
                                    }}>
                                        {currentClient.stage}
                                    </span>
                                </div>

                                {currentClient.companyName && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginTop: '0.5rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <Building2 size={16} />
                                        {currentClient.companyName}
                                        {currentClient.jobTitle && ` - ${currentClient.jobTitle}`}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    gap: '1.5rem',
                                    marginTop: '0.75rem'
                                }}>
                                    {currentClient.email && (
                                        <a href={`mailto:${currentClient.email}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--text-secondary)',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem'
                                        }}>
                                            <Mail size={14} />
                                            {currentClient.email}
                                        </a>
                                    )}
                                    {currentClient.phone && (
                                        <a href={`tel:${currentClient.phone}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--text-secondary)',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem'
                                        }}>
                                            <Phone size={14} />
                                            {currentClient.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowInteractionModal(true)}
                                className="btn-modern btn-modern-primary"
                            >
                                <Plus size={16} />
                                Log Interaction
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span style={{
                                        background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem'
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                            {/* Main Info */}
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem'
                            }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: '1rem'
                                }}>
                                    Contact Information
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Email</p>
                                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>{currentClient.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Phone</p>
                                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>{currentClient.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Company</p>
                                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>{currentClient.companyName || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Job Title</p>
                                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>{currentClient.jobTitle || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Website</p>
                                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>{currentClient.website || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Source</p>
                                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>{currentClient.source || '-'}</p>
                                    </div>
                                </div>

                                {(currentClient.address || currentClient.city || currentClient.country) && (
                                    <>
                                        <h3 style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            margin: '1.5rem 0 1rem 0'
                                        }}>
                                            Address
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                                            {currentClient.address}<br />
                                            {currentClient.city}{currentClient.state && `, ${currentClient.state}`}<br />
                                            {currentClient.country} {currentClient.postalCode}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Owner */}
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    padding: '1.25rem'
                                }}>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        Owner
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600
                                        }}>
                                            {currentClient.owner?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
                                                {currentClient.owner?.name || 'Unassigned'}
                                            </p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                                                {currentClient.owner?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    padding: '1.25rem'
                                }}>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        Quick Actions
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setShowNoteModal(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                width: '100%',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <FileText size={16} />
                                            Add Note
                                        </button>
                                        <button
                                            onClick={() => setShowTaskModal(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                width: '100%',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <CheckCircle size={16} />
                                            Add Task
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    padding: '1.25rem'
                                }}>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        Timeline
                                    </h3>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Created</span>
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                {new Date(currentClient.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {currentClient.lastContactedAt && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Last Contacted</span>
                                                <span style={{ color: 'var(--text-primary)' }}>
                                                    {new Date(currentClient.lastContactedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {currentClient.convertedAt && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Converted</span>
                                                <span style={{ color: '#22c55e' }}>
                                                    {new Date(currentClient.convertedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interactions Tab */}
                    {activeTab === 'interactions' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Interactions</h3>
                                <button
                                    onClick={() => setShowInteractionModal(true)}
                                    className="btn-modern btn-modern-primary"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    <Plus size={14} />
                                    Log Interaction
                                </button>
                            </div>
                            {currentClient.interactions?.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No interactions recorded yet
                                </div>
                            ) : (
                                currentClient.interactions?.map((interaction, i) => (
                                    <div
                                        key={interaction.id}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: i < currentClient.interactions.length - 1 ? '1px solid var(--border-color)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {getInteractionIcon(interaction.type)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                            {interaction.subject}
                                                        </p>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                                                            {interaction.type} by {interaction.conductor?.name}
                                                        </p>
                                                    </div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                        {new Date(interaction.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {interaction.description && (
                                                    <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 0 0', fontSize: '0.9rem' }}>
                                                        {interaction.description}
                                                    </p>
                                                )}
                                                {interaction.outcome && (
                                                    <p style={{
                                                        color: 'var(--text-secondary)',
                                                        margin: '0.5rem 0 0 0',
                                                        fontSize: '0.85rem',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        Outcome: {interaction.outcome}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notes</h3>
                                <button
                                    onClick={() => setShowNoteModal(true)}
                                    className="btn-modern btn-modern-primary"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    <Plus size={14} />
                                    Add Note
                                </button>
                            </div>
                            {currentClient.notes?.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No notes yet
                                </div>
                            ) : (
                                currentClient.notes?.map((note, i) => (
                                    <div
                                        key={note.id}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: i < currentClient.notes.length - 1 ? '1px solid var(--border-color)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                {note.author?.name} - {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                            {note.isPinned && <Pin size={14} style={{ color: 'var(--primary)' }} />}
                                        </div>
                                        <p style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {note.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Tasks</h3>
                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    className="btn-modern btn-modern-primary"
                                    style={{ padding: '0.5rem 1rem' }}
                                >
                                    <Plus size={14} />
                                    Add Task
                                </button>
                            </div>
                            {currentClient.tasks?.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No tasks yet
                                </div>
                            ) : (
                                currentClient.tasks?.map((task, i) => (
                                    <div
                                        key={task.id}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: i < currentClient.tasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                    >
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: task.status === 'completed' ? '#22c55e' : 'var(--text-muted)'
                                            }}
                                        >
                                            {task.status === 'completed' ? <CheckCircle size={20} /> : <Circle size={20} />}
                                        </button>
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                fontWeight: 500,
                                                color: 'var(--text-primary)',
                                                margin: 0,
                                                textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                            }}>
                                                {task.title}
                                            </p>
                                            {task.dueDate && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: task.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' :
                                                task.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.3)' : 'var(--bg-secondary)',
                                            color: task.priority === 'HIGH' || task.priority === 'URGENT' ? '#ef4444' : 'var(--text-muted)'
                                        }}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Activity Log</h3>
                            </div>
                            {currentClient.activities?.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No activity yet
                                </div>
                            ) : (
                                currentClient.activities?.map((activity, i) => (
                                    <div
                                        key={activity.id}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: i < currentClient.activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                    >
                                        <Activity size={16} style={{ color: 'var(--text-muted)' }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>
                                                <strong>{activity.user?.name}</strong> {activity.action.replace(/_/g, ' ')}
                                                {activity.field && ` (${activity.field})`}
                                            </p>
                                            {activity.oldValue && activity.newValue && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                                                    {activity.oldValue} → {activity.newValue}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {new Date(activity.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Note Modal */}
                {showNoteModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '500px',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0' }}>Add Note</h3>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Write your note..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    resize: 'none'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button onClick={() => setShowNoteModal(false)} style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}>
                                    Cancel
                                </button>
                                <button onClick={handleAddNote} className="btn-modern btn-modern-primary">
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Interaction Modal */}
                {showInteractionModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '500px',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0' }}>Log Interaction</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type</label>
                                    <select
                                        value={newInteraction.type}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="CALL">Call</option>
                                        <option value="EMAIL">Email</option>
                                        <option value="MEETING">Meeting</option>
                                        <option value="VIDEO_CALL">Video Call</option>
                                        <option value="SMS">SMS</option>
                                        <option value="WHATSAPP">WhatsApp</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subject</label>
                                    <input
                                        type="text"
                                        value={newInteraction.subject}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                                        placeholder="Brief subject"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                                    <textarea
                                        value={newInteraction.description}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                                        placeholder="Details..."
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            resize: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Outcome</label>
                                    <input
                                        type="text"
                                        value={newInteraction.outcome}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, outcome: e.target.value })}
                                        placeholder="Result of interaction"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setShowInteractionModal(false)} style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}>
                                    Cancel
                                </button>
                                <button onClick={handleAddInteraction} className="btn-modern btn-modern-primary">
                                    Save Interaction
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task Modal */}
                {showTaskModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '500px',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0' }}>Add Task</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Title</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Task title"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Due Date</label>
                                        <input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Task details..."
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            resize: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setShowTaskModal(false)} style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}>
                                    Cancel
                                </button>
                                <button onClick={handleAddTask} className="btn-modern btn-modern-primary">
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default ClientDetailPage;
