import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Dashboard from './Dashboard';
import {
    Plus, Search, MoreHorizontal, Users, Folder, List, Settings,
    ChevronRight, Sparkles, Building2, Lock, Globe, Trash2, Edit2
} from 'lucide-react';

const WorkspacesPage = () => {
    const navigate = useNavigate();
    const { workspaces, loading, fetchWorkspaces, createWorkspace } = useWorkspace();
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '', icon: '', color: '#6366F1' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const filteredWorkspaces = workspaces.filter(ws =>
        ws.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateWorkspace = async () => {
        if (!newWorkspace.name.trim()) return;

        try {
            setCreating(true);
            await createWorkspace(newWorkspace);
            setShowCreateModal(false);
            setNewWorkspace({ name: '', description: '', icon: '', color: '#6366F1' });
        } catch (error) {
            console.error('Error creating workspace:', error);
        } finally {
            setCreating(false);
        }
    };

    const workspaceIcons = ['🏢', '🚀', '💼', '🎯', '📊', '💡', '🔧', '🎨'];
    const workspaceColors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

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
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <Sparkles size={28} color="var(--primary)" />
                            Workspaces
                        </h1>
                        <p style={{
                            color: 'var(--text-muted)',
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.95rem'
                        }}>
                            Organize your projects with workspaces, spaces, and lists
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-modern btn-modern-primary"
                    >
                        <Plus size={18} />
                        New Workspace
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '1.5rem 2rem 0' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--border-color)',
                        maxWidth: '400px'
                    }}>
                        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <input
                            placeholder="Search workspaces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                padding: '0 0.75rem',
                                width: '100%',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>

                {/* Workspaces Grid */}
                <div style={{ flex: 1, padding: '1.5rem 2rem', overflow: 'auto' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                            color: 'var(--text-muted)'
                        }}>
                            Loading workspaces...
                        </div>
                    ) : filteredWorkspaces.length === 0 ? (
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
                            <Building2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                                No workspaces yet
                            </h3>
                            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>
                                Create your first workspace to get started
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-modern btn-modern-primary"
                            >
                                <Plus size={18} />
                                Create Workspace
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {filteredWorkspaces.map(workspace => (
                                <div
                                    key={workspace.id}
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-color)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
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
                                    {/* Workspace Header */}
                                    <div style={{
                                        background: `linear-gradient(135deg, ${workspace.color || '#6366F1'} 0%, ${workspace.color || '#6366F1'}dd 100%)`,
                                        padding: '1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem'
                                            }}>
                                                {workspace.icon || '🏢'}
                                            </div>
                                            <div>
                                                <h3 style={{
                                                    color: 'white',
                                                    fontSize: '1.25rem',
                                                    fontWeight: 700,
                                                    margin: 0
                                                }}>
                                                    {workspace.name}
                                                </h3>
                                                <p style={{
                                                    color: 'rgba(255,255,255,0.8)',
                                                    fontSize: '0.85rem',
                                                    margin: '0.25rem 0 0 0'
                                                }}>
                                                    {workspace._count?.members || 0} members
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                color: 'white'
                                            }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>

                                    {/* Workspace Content */}
                                    <div style={{ padding: '1.25rem' }}>
                                        <p style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.9rem',
                                            margin: '0 0 1rem 0',
                                            lineHeight: 1.5
                                        }}>
                                            {workspace.description || 'No description'}
                                        </p>

                                        {/* Spaces Preview */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <Folder size={16} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    {workspace._count?.spaces || 0} Spaces
                                                </span>
                                            </div>

                                            {workspace.spaces?.slice(0, 3).map(space => (
                                                <div
                                                    key={space.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/w/${workspace.id}/space/${space.id}`);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        marginBottom: '0.25rem',
                                                        background: 'var(--bg-secondary)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-hover)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                                    }}
                                                >
                                                    <span>{space.icon || '📁'}</span>
                                                    <span style={{
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        flex: 1
                                                    }}>
                                                        {space.name}
                                                    </span>
                                                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                                </div>
                                            ))}

                                            {workspace.spaces?.length > 3 && (
                                                <div style={{
                                                    color: 'var(--primary)',
                                                    fontSize: '0.8rem',
                                                    padding: '0.5rem',
                                                    cursor: 'pointer'
                                                }}>
                                                    +{workspace.spaces.length - 3} more spaces
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => navigate(`/w/${workspace.id}/space/${workspace.spaces?.[0]?.id || ''}`)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--primary)';
                                                e.currentTarget.style.color = 'white';
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                            }}
                                        >
                                            Open Workspace
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Workspace Modal */}
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
                                Create Workspace
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
                                        {workspaceIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setNewWorkspace({ ...newWorkspace, icon })}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    border: newWorkspace.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                    background: newWorkspace.icon === icon ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                                    fontSize: '1.25rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
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
                                        value={newWorkspace.name}
                                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                                        placeholder="Enter workspace name"
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
                                        value={newWorkspace.description}
                                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                                        placeholder="Describe your workspace"
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
                                        {workspaceColors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewWorkspace({ ...newWorkspace, color })}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background: color,
                                                    border: newWorkspace.color === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        ))}
                                    </div>
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
                                    onClick={handleCreateWorkspace}
                                    disabled={!newWorkspace.name.trim() || creating}
                                    className="btn-modern btn-modern-primary"
                                >
                                    {creating ? 'Creating...' : 'Create Workspace'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default WorkspacesPage;
