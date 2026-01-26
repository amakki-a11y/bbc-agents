import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Dashboard from './Dashboard';
import {
    Plus, Search, MoreHorizontal, Users, Folder, Settings, ChevronRight,
    Sparkles, Lock, Globe, Trash2, Edit2, UserPlus, ArrowLeft, LayoutGrid,
    LayoutList, Star, Clock
} from 'lucide-react';
import api from '../services/api';

const WorkspaceDetailPage = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { currentWorkspace, setCurrentWorkspace, fetchWorkspaceById, createSpace } = useWorkspace();

    const [loading, setLoading] = useState(true);
    const [spaces, setSpaces] = useState([]);
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSpace, setNewSpace] = useState({ name: '', description: '', icon: '📊', color: '#6366F1', isPrivate: false });
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('spaces');

    useEffect(() => {
        fetchWorkspaceData();
    }, [workspaceId]);

    const fetchWorkspaceData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/workspaces/${workspaceId}`);
            setCurrentWorkspace(response.data);
            setSpaces(response.data.spaces || []);
            setMembers(response.data.members || []);
        } catch (error) {
            console.error('Error fetching workspace:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSpace = async () => {
        if (!newSpace.name.trim()) return;

        try {
            setCreating(true);
            const response = await api.post('/spaces', {
                ...newSpace,
                workspaceId
            });
            setSpaces([...spaces, response.data]);
            setShowCreateModal(false);
            setNewSpace({ name: '', description: '', icon: '📊', color: '#6366F1', isPrivate: false });
        } catch (error) {
            console.error('Error creating space:', error);
        } finally {
            setCreating(false);
        }
    };

    const filteredSpaces = spaces.filter(space =>
        space.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const spaceIcons = ['📊', '💼', '🎨', '💻', '📈', '🛠️', '📋', '🎯', '🚀', '💡'];
    const spaceColors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

    if (loading) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'var(--text-muted)'
                }}>
                    Loading workspace...
                </div>
            </Dashboard>
        );
    }

    if (!currentWorkspace) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'var(--text-muted)'
                }}>
                    <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Workspace not found</h2>
                    <p>The workspace you are looking for does not exist.</p>
                    <button
                        onClick={() => navigate('/workspaces')}
                        className="btn-modern btn-modern-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <ArrowLeft size={16} />
                        Back to Workspaces
                    </button>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)'
            }}>
                {/* Header Banner */}
                <div style={{
                    background: `linear-gradient(135deg, ${currentWorkspace.color || '#6366F1'} 0%, ${currentWorkspace.color || '#6366F1'}cc 100%)`,
                    padding: '2rem',
                    position: 'relative'
                }}>
                    {/* Breadcrumb */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        <Link
                            to="/workspaces"
                            style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                        >
                            Workspaces
                        </Link>
                        <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                        <span style={{ color: 'white', fontWeight: 500 }}>
                            {currentWorkspace.name}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem'
                            }}>
                                {currentWorkspace.icon || '🏢'}
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    margin: 0,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {currentWorkspace.name}
                                </h1>
                                {currentWorkspace.description && (
                                    <p style={{
                                        color: 'rgba(255,255,255,0.8)',
                                        margin: '0.5rem 0 0 0',
                                        fontSize: '1rem'
                                    }}>
                                        {currentWorkspace.description}
                                    </p>
                                )}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    marginTop: '0.75rem'
                                }}>
                                    <span style={{
                                        color: 'rgba(255,255,255,0.8)',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Folder size={16} />
                                        {spaces.length} spaces
                                    </span>
                                    <span style={{
                                        color: 'rgba(255,255,255,0.8)',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Users size={16} />
                                        {members.length} members
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0.75rem',
                                    cursor: 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    background: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1.25rem',
                                    cursor: 'pointer',
                                    color: currentWorkspace.color || '#6366F1',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Plus size={18} />
                                New Space
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    padding: '0 2rem',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '0.5rem'
                }}>
                    {[
                        { id: 'spaces', label: 'Spaces', icon: Folder },
                        { id: 'members', label: 'Members', icon: Users }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem 1.25rem',
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                marginBottom: '-1px',
                                transition: 'all 0.15s'
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {activeTab === 'spaces' && (
                        <div style={{ padding: '1.5rem 2rem' }}>
                            {/* Toolbar */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                {/* Search */}
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.625rem 1rem',
                                    border: '1px solid var(--border-color)',
                                    width: '300px'
                                }}>
                                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input
                                        placeholder="Search spaces..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-primary)',
                                            padding: '0 0.75rem',
                                            width: '100%',
                                            outline: 'none',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>

                                {/* View Toggle */}
                                <div style={{
                                    display: 'flex',
                                    background: 'var(--bg-card)',
                                    borderRadius: '8px',
                                    padding: '4px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        style={{
                                            background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                            color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        style={{
                                            background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                                            color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <LayoutList size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Spaces Grid */}
                            {filteredSpaces.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '300px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                                        No spaces yet
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>
                                        Create your first space to organize work
                                    </p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="btn-modern btn-modern-primary"
                                    >
                                        <Plus size={18} />
                                        Create Space
                                    </button>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '1.25rem'
                                }}>
                                    {filteredSpaces.map(space => (
                                        <div
                                            key={space.id}
                                            onClick={() => navigate(`/w/${workspaceId}/space/${space.id}`)}
                                            style={{
                                                background: 'var(--bg-card)',
                                                borderRadius: '14px',
                                                border: '1px solid var(--border-color)',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div style={{
                                                height: '8px',
                                                background: `linear-gradient(90deg, ${space.color || '#6366F1'} 0%, ${space.color || '#6366F1'}aa 100%)`
                                            }} />
                                            <div style={{ padding: '1.25rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '0.75rem'
                                                }}>
                                                    <div style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        background: `${space.color || '#6366F1'}20`,
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.5rem'
                                                    }}>
                                                        {space.icon || '📊'}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {space.isPrivate && (
                                                            <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                                                        )}
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-muted)',
                                                                padding: '0.25rem'
                                                            }}
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    margin: '0 0 0.5rem 0'
                                                }}>
                                                    {space.name}
                                                </h3>

                                                {space.description && (
                                                    <p style={{
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.85rem',
                                                        margin: '0 0 1rem 0',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        lineHeight: 1.4
                                                    }}>
                                                        {space.description}
                                                    </p>
                                                )}

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Folder size={14} />
                                                        {space._count?.folders || 0} folders
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={14} />
                                                        {space._count?.lists || 0} lists
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    overflow: 'hidden'
                                }}>
                                    {filteredSpaces.map((space, index) => (
                                        <div
                                            key={space.id}
                                            onClick={() => navigate(`/w/${workspaceId}/space/${space.id}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '1rem 1.25rem',
                                                borderBottom: index < filteredSpaces.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background: `${space.color || '#6366F1'}20`,
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.25rem'
                                                }}>
                                                    {space.icon || '📊'}
                                                </div>
                                                <div>
                                                    <h3 style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-primary)',
                                                        margin: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        {space.name}
                                                        {space.isPrivate && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
                                                    </h3>
                                                    {space.description && (
                                                        <p style={{
                                                            color: 'var(--text-muted)',
                                                            fontSize: '0.8rem',
                                                            margin: '0.25rem 0 0 0'
                                                        }}>
                                                            {space.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {space._count?.folders || 0} folders
                                                </span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {space._count?.lists || 0} lists
                                                </span>
                                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div style={{ padding: '1.5rem 2rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    Workspace Members ({members.length})
                                </h2>
                                <button className="btn-modern btn-modern-primary">
                                    <UserPlus size={18} />
                                    Invite Member
                                </button>
                            </div>

                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden'
                            }}>
                                {members.map((member, index) => (
                                    <div
                                        key={member.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1rem 1.25rem',
                                            borderBottom: index < members.length - 1 ? '1px solid var(--border-color)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'var(--primary-gradient)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 600
                                            }}>
                                                {member.employee?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p style={{
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 500,
                                                    margin: 0
                                                }}>
                                                    {member.employee?.name || 'Unknown'}
                                                </p>
                                                <p style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    margin: '0.25rem 0 0 0'
                                                }}>
                                                    {member.employee?.email || ''}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.375rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: member.role === 'OWNER' ? 'var(--primary)' :
                                                member.role === 'ADMIN' ? '#8b5cf6' : 'var(--bg-secondary)',
                                            color: member.role === 'OWNER' || member.role === 'ADMIN' ? 'white' : 'var(--text-secondary)'
                                        }}>
                                            {member.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Space Modal */}
                {showCreateModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '500px',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-xl)'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 1.5rem 0'
                            }}>
                                Create Space
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Icon Selection */}
                                <div>
                                    <label style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        Icon
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {spaceIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setNewSpace({ ...newSpace, icon })}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    border: newSpace.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                    background: newSpace.icon === icon ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                                    fontSize: '1.25rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newSpace.name}
                                        onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                                        placeholder="Enter space name"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={newSpace.description}
                                        onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                                        placeholder="Describe this space"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.95rem',
                                            resize: 'none'
                                        }}
                                    />
                                </div>

                                {/* Color Selection */}
                                <div>
                                    <label style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>
                                        Color
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {spaceColors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewSpace({ ...newSpace, color })}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background: color,
                                                    border: newSpace.color === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy Toggle */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <p style={{
                                            color: 'var(--text-primary)',
                                            fontWeight: 500,
                                            margin: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            {newSpace.isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                                            {newSpace.isPrivate ? 'Private Space' : 'Public Space'}
                                        </p>
                                        <p style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            margin: '0.25rem 0 0 0'
                                        }}>
                                            {newSpace.isPrivate
                                                ? 'Only invited members can access'
                                                : 'All workspace members can access'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setNewSpace({ ...newSpace, isPrivate: !newSpace.isPrivate })}
                                        style={{
                                            width: '44px',
                                            height: '24px',
                                            borderRadius: '24px',
                                            background: newSpace.isPrivate ? 'var(--primary)' : 'var(--bg-tertiary)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: newSpace.isPrivate ? '23px' : '3px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            transition: 'left 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                marginTop: '1.5rem'
                            }}>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'transparent',
                                        color: 'var(--text-secondary)',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSpace}
                                    disabled={!newSpace.name.trim() || creating}
                                    className="btn-modern btn-modern-primary"
                                >
                                    {creating ? 'Creating...' : 'Create Space'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default WorkspaceDetailPage;
