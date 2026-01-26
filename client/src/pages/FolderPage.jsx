import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Dashboard from './Dashboard';
import {
    Folder, Plus, List, MoreHorizontal, ChevronRight, Edit2, Trash2,
    LayoutGrid, LayoutList, Search, Settings, ArrowLeft
} from 'lucide-react';
import api from '../services/api';

const FolderPage = () => {
    const { workspaceId, folderId } = useParams();
    const navigate = useNavigate();
    const { currentWorkspace, fetchWorkspaceById } = useWorkspace();

    const [folder, setFolder] = useState(null);
    const [space, setSpace] = useState(null);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newList, setNewList] = useState({ name: '', description: '', icon: '📋', color: '#6366F1' });
    const [creating, setCreating] = useState(false);
    const [showMenu, setShowMenu] = useState(null);

    useEffect(() => {
        fetchFolderData();
    }, [folderId, workspaceId]);

    const fetchFolderData = async () => {
        try {
            setLoading(true);

            // Fetch folder details
            const folderResponse = await api.get(`/folders/${folderId}`);
            setFolder(folderResponse.data);

            // Fetch space details
            if (folderResponse.data.spaceId) {
                const spaceResponse = await api.get(`/spaces/${folderResponse.data.spaceId}`);
                setSpace(spaceResponse.data);
            }

            // Fetch lists in this folder
            const listsResponse = await api.get(`/lists?folderId=${folderId}`);
            setLists(listsResponse.data || []);

            // Fetch workspace if not loaded
            if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
                fetchWorkspaceById(workspaceId);
            }
        } catch (error) {
            console.error('Error fetching folder data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!newList.name.trim()) return;

        try {
            setCreating(true);
            const response = await api.post('/lists', {
                ...newList,
                folderId: folderId,
                spaceId: folder?.spaceId
            });
            setLists([...lists, response.data]);
            setShowCreateModal(false);
            setNewList({ name: '', description: '', icon: '📋', color: '#6366F1' });
        } catch (error) {
            console.error('Error creating list:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteList = async (listId) => {
        if (!confirm('Are you sure you want to delete this list?')) return;

        try {
            await api.delete(`/lists/${listId}`);
            setLists(lists.filter(l => l.id !== listId));
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    };

    const filteredLists = lists.filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const listIcons = ['📋', '✅', '📝', '🎯', '📊', '💡', '🔧', '📁'];
    const listColors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

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
                    Loading folder...
                </div>
            </Dashboard>
        );
    }

    if (!folder) {
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
                    <Folder size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Folder not found</h2>
                    <p>The folder you are looking for does not exist.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-modern btn-modern-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <ArrowLeft size={16} />
                        Go Back
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
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        <Link
                            to="/workspaces"
                            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                        >
                            Workspaces
                        </Link>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        <Link
                            to={`/workspace/${workspaceId}`}
                            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                        >
                            {currentWorkspace?.name || 'Workspace'}
                        </Link>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        <Link
                            to={`/w/${workspaceId}/space/${space?.id}`}
                            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                        >
                            {space?.icon} {space?.name || 'Space'}
                        </Link>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {folder.icon} {folder.name}
                        </span>
                    </div>

                    {/* Title and Actions */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: `linear-gradient(135deg, ${folder.color || '#6366F1'} 0%, ${folder.color || '#6366F1'}dd 100%)`,
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.75rem',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                            }}>
                                {folder.icon || '📁'}
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    {folder.name}
                                </h1>
                                {folder.description && (
                                    <p style={{
                                        color: 'var(--text-muted)',
                                        margin: '0.25rem 0 0 0',
                                        fontSize: '0.9rem'
                                    }}>
                                        {folder.description}
                                    </p>
                                )}
                                <p style={{
                                    color: 'var(--text-muted)',
                                    margin: '0.5rem 0 0 0',
                                    fontSize: '0.8rem'
                                }}>
                                    {lists.length} {lists.length === 1 ? 'list' : 'lists'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-modern btn-modern-primary"
                            >
                                <Plus size={18} />
                                Add List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{
                    padding: '1rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
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
                            placeholder="Search lists..."
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
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
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
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <LayoutList size={18} />
                        </button>
                    </div>
                </div>

                {/* Lists Content */}
                <div style={{ flex: 1, padding: '0 2rem 2rem', overflow: 'auto' }}>
                    {filteredLists.length === 0 ? (
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
                            <List size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                                No lists yet
                            </h3>
                            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>
                                Create your first list in this folder
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-modern btn-modern-primary"
                            >
                                <Plus size={18} />
                                Create List
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1rem'
                        }}>
                            {filteredLists.map(list => (
                                <div
                                    key={list.id}
                                    onClick={() => navigate(`/w/${workspaceId}/list/${list.id}`)}
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: `${list.color || '#6366F1'}20`,
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem'
                                        }}>
                                            {list.icon || '📋'}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(showMenu === list.id ? null : list.id);
                                            }}
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

                                        {showMenu === list.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '50px',
                                                right: '1rem',
                                                background: 'var(--bg-card)',
                                                borderRadius: '8px',
                                                boxShadow: 'var(--shadow-lg)',
                                                border: '1px solid var(--border-color)',
                                                zIndex: 10,
                                                minWidth: '150px'
                                            }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMenu(null);
                                                        // Edit functionality
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.75rem 1rem',
                                                        width: '100%',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMenu(null);
                                                        handleDeleteList(list.id);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.75rem 1rem',
                                                        width: '100%',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 0.5rem 0'
                                    }}>
                                        {list.name}
                                    </h3>

                                    {list.description && (
                                        <p style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            margin: '0 0 0.75rem 0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {list.description}
                                        </p>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <span>{list._count?.tasks || 0} tasks</span>
                                        <span
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: list.color || '#6366F1'
                                            }}
                                        />
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
                            {filteredLists.map((list, index) => (
                                <div
                                    key={list.id}
                                    onClick={() => navigate(`/w/${workspaceId}/list/${list.id}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem 1.25rem',
                                        borderBottom: index < filteredLists.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>{list.icon || '📋'}</span>
                                        <div>
                                            <h3 style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 500,
                                                color: 'var(--text-primary)',
                                                margin: 0
                                            }}>
                                                {list.name}
                                            </h3>
                                            {list.description && (
                                                <p style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    margin: '0.25rem 0 0 0'
                                                }}>
                                                    {list.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem'
                                        }}>
                                            {list._count?.tasks || 0} tasks
                                        </span>
                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create List Modal */}
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
                            maxWidth: '480px',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-xl)'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 1.5rem 0'
                            }}>
                                Create List
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
                                        {listIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setNewList({ ...newList, icon })}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    border: newList.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                    background: newList.icon === icon ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
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
                                        value={newList.name}
                                        onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                                        placeholder="Enter list name"
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
                                        value={newList.description}
                                        onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                                        placeholder="Describe this list"
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
                                        {listColors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewList({ ...newList, color })}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background: color,
                                                    border: newList.color === color ? '3px solid var(--text-primary)' : '3px solid transparent',
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
                                    onClick={handleCreateList}
                                    disabled={!newList.name.trim() || creating}
                                    className="btn-modern btn-modern-primary"
                                >
                                    {creating ? 'Creating...' : 'Create List'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
};

export default FolderPage;
