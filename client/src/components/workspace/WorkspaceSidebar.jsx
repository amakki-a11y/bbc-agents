import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    MoreHorizontal,
    Folder,
    List,
    Settings,
    Search,
    Building2,
    Layers,
    FolderOpen
} from 'lucide-react';

const WorkspaceSidebar = ({ collapsed = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        workspaces,
        currentWorkspace,
        sidebarExpanded,
        toggleSidebarItem,
        selectWorkspace,
        fetchWorkspaceDetails,
        loading
    } = useWorkspace();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateMenu, setShowCreateMenu] = useState(null);

    // Filter spaces based on search
    const filteredSpaces = useMemo(() => {
        if (!currentWorkspace?.spaces || !searchQuery) {
            return currentWorkspace?.spaces || [];
        }
        const query = searchQuery.toLowerCase();
        return currentWorkspace.spaces.filter(space =>
            space.name.toLowerCase().includes(query) ||
            space.folders?.some(f => f.name.toLowerCase().includes(query)) ||
            space.lists?.some(l => l.name.toLowerCase().includes(query)) ||
            space.folders?.some(f => f.lists?.some(l => l.name.toLowerCase().includes(query)))
        );
    }, [currentWorkspace?.spaces, searchQuery]);

    const handleWorkspaceChange = async (workspace) => {
        selectWorkspace(workspace);
        await fetchWorkspaceDetails(workspace.id);
    };

    const handleSpaceClick = (spaceId) => {
        navigate(`/w/${currentWorkspace.id}/space/${spaceId}`);
    };

    const handleListClick = (listId) => {
        navigate(`/w/${currentWorkspace.id}/list/${listId}`);
    };

    const handleFolderClick = (folderId) => {
        navigate(`/w/${currentWorkspace.id}/folder/${folderId}`);
    };

    const isActive = (path) => location.pathname === path;

    if (collapsed) {
        return (
            <div className="workspace-sidebar collapsed">
                <div className="sidebar-icon" title={currentWorkspace?.name || 'Workspaces'}>
                    <Building2 size={20} />
                </div>
                {currentWorkspace?.spaces?.slice(0, 5).map(space => (
                    <div
                        key={space.id}
                        className="sidebar-icon"
                        title={space.name}
                        onClick={() => handleSpaceClick(space.id)}
                    >
                        <span className="space-icon">{space.icon || '📁'}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="workspace-sidebar">
            {/* Workspace Selector */}
            <div className="workspace-selector">
                <select
                    value={currentWorkspace?.id || ''}
                    onChange={(e) => {
                        const ws = workspaces.find(w => w.id === parseInt(e.target.value));
                        if (ws) handleWorkspaceChange(ws);
                    }}
                    className="workspace-select"
                >
                    {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>
                            {ws.icon} {ws.name}
                        </option>
                    ))}
                </select>
                <button
                    className="icon-btn"
                    onClick={() => navigate('/workspace/settings')}
                    title="Workspace Settings"
                >
                    <Settings size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="sidebar-search">
                <Search size={14} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search spaces, lists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Spaces Tree */}
            <div className="spaces-tree">
                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : filteredSpaces.length === 0 ? (
                    <div className="empty-state">
                        <Layers size={24} />
                        <p>No spaces yet</p>
                        <button
                            className="btn-primary btn-sm"
                            onClick={() => setShowCreateMenu('space')}
                        >
                            <Plus size={14} /> Create Space
                        </button>
                    </div>
                ) : (
                    filteredSpaces.map(space => (
                        <SpaceItem
                            key={space.id}
                            space={space}
                            workspaceId={currentWorkspace.id}
                            expanded={sidebarExpanded[`space-${space.id}`]}
                            onToggle={() => toggleSidebarItem(`space-${space.id}`)}
                            onSpaceClick={handleSpaceClick}
                            onFolderClick={handleFolderClick}
                            onListClick={handleListClick}
                            isActive={isActive}
                            sidebarExpanded={sidebarExpanded}
                            toggleSidebarItem={toggleSidebarItem}
                        />
                    ))
                )}
            </div>

            {/* Add Space Button */}
            {currentWorkspace && (
                <div className="sidebar-footer">
                    <button
                        className="btn-add-space"
                        onClick={() => navigate(`/w/${currentWorkspace.id}/space/new`)}
                    >
                        <Plus size={14} />
                        <span>Add Space</span>
                    </button>
                </div>
            )}

            <style>{`
                .workspace-sidebar {
                    width: 260px;
                    height: 100%;
                    background: var(--bg-secondary, #1a1a2e);
                    border-right: 1px solid var(--border-color, #2d2d44);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .workspace-sidebar.collapsed {
                    width: 48px;
                    padding: 8px;
                    align-items: center;
                }

                .sidebar-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-bottom: 4px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .sidebar-icon:hover {
                    background: var(--bg-hover, #2d2d44);
                }

                .space-icon {
                    font-size: 16px;
                }

                .workspace-selector {
                    padding: 12px;
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                }

                .workspace-select {
                    flex: 1;
                    background: var(--bg-tertiary, #252538);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                    cursor: pointer;
                }

                .workspace-select:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
                }

                .icon-btn {
                    background: none;
                    border: none;
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                }

                .icon-btn:hover {
                    background: var(--bg-hover, #2d2d44);
                    color: var(--text-primary, #fff);
                }

                .sidebar-search {
                    padding: 8px 12px;
                    position: relative;
                }

                .sidebar-search .search-icon {
                    position: absolute;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary, #6b6b80);
                }

                .sidebar-search input {
                    width: 100%;
                    background: var(--bg-tertiary, #252538);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px 8px 32px;
                    color: var(--text-primary, #fff);
                    font-size: 12px;
                }

                .sidebar-search input:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
                }

                .sidebar-search input::placeholder {
                    color: var(--text-tertiary, #6b6b80);
                }

                .spaces-tree {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .loading-state,
                .empty-state {
                    padding: 24px;
                    text-align: center;
                    color: var(--text-secondary, #a0a0b2);
                }

                .empty-state svg {
                    margin-bottom: 8px;
                    opacity: 0.5;
                }

                .empty-state p {
                    margin-bottom: 12px;
                    font-size: 13px;
                }

                .btn-primary {
                    background: var(--primary, #6366f1);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .btn-primary:hover {
                    background: var(--primary-dark, #5558e8);
                }

                .btn-sm {
                    padding: 6px 12px;
                    font-size: 12px;
                }

                .sidebar-footer {
                    padding: 12px;
                    border-top: 1px solid var(--border-color, #2d2d44);
                }

                .btn-add-space {
                    width: 100%;
                    background: transparent;
                    border: 1px dashed var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 10px;
                    color: var(--text-secondary, #a0a0b2);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-size: 13px;
                    transition: all 0.2s;
                }

                .btn-add-space:hover {
                    border-color: var(--primary, #6366f1);
                    color: var(--primary, #6366f1);
                    background: rgba(99, 102, 241, 0.1);
                }
            `}</style>
        </div>
    );
};

// Space Item Component
const SpaceItem = ({
    space,
    workspaceId,
    expanded,
    onToggle,
    onSpaceClick,
    onFolderClick,
    onListClick,
    isActive,
    sidebarExpanded,
    toggleSidebarItem
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="space-item">
            <div
                className={`space-header ${isActive(`/w/${workspaceId}/space/${space.id}`) ? 'active' : ''}`}
                onClick={() => onSpaceClick(space.id)}
            >
                <button
                    className="toggle-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="space-icon">{space.icon || '📁'}</span>
                <span className="space-name">{space.name}</span>
                <button
                    className="menu-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>

            {expanded && (
                <div className="space-content">
                    {/* Folders */}
                    {space.folders?.map(folder => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            workspaceId={workspaceId}
                            expanded={sidebarExpanded[`folder-${folder.id}`]}
                            onToggle={() => toggleSidebarItem(`folder-${folder.id}`)}
                            onFolderClick={onFolderClick}
                            onListClick={onListClick}
                            isActive={isActive}
                        />
                    ))}

                    {/* Lists directly in space (no folder) */}
                    {space.lists?.map(list => (
                        <ListItem
                            key={list.id}
                            list={list}
                            workspaceId={workspaceId}
                            onListClick={onListClick}
                            isActive={isActive}
                            indent={1}
                        />
                    ))}
                </div>
            )}

            <style>{`
                .space-item {
                    margin-bottom: 2px;
                }

                .space-header {
                    display: flex;
                    align-items: center;
                    padding: 6px 12px;
                    cursor: pointer;
                    gap: 6px;
                    color: var(--text-primary, #fff);
                    transition: background 0.15s;
                }

                .space-header:hover {
                    background: var(--bg-hover, #2d2d44);
                }

                .space-header.active {
                    background: var(--bg-active, #3d3d5c);
                }

                .toggle-btn {
                    background: none;
                    border: none;
                    padding: 2px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    display: flex;
                    align-items: center;
                }

                .toggle-btn:hover {
                    color: var(--text-primary, #fff);
                }

                .space-icon {
                    font-size: 14px;
                }

                .space-name {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .menu-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    opacity: 0;
                    transition: opacity 0.15s;
                }

                .space-header:hover .menu-btn {
                    opacity: 1;
                }

                .menu-btn:hover {
                    color: var(--text-primary, #fff);
                }

                .space-content {
                    margin-left: 12px;
                }
            `}</style>
        </div>
    );
};

// Folder Item Component
const FolderItem = ({
    folder,
    workspaceId,
    expanded,
    onToggle,
    onFolderClick,
    onListClick,
    isActive
}) => {
    return (
        <div className="folder-item">
            <div
                className={`folder-header ${isActive(`/w/${workspaceId}/folder/${folder.id}`) ? 'active' : ''}`}
                onClick={() => onFolderClick(folder.id)}
            >
                <button
                    className="toggle-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                <span className="folder-name">{folder.name}</span>
            </div>

            {expanded && folder.lists && (
                <div className="folder-content">
                    {folder.lists.map(list => (
                        <ListItem
                            key={list.id}
                            list={list}
                            workspaceId={workspaceId}
                            onListClick={onListClick}
                            isActive={isActive}
                            indent={2}
                        />
                    ))}
                </div>
            )}

            <style>{`
                .folder-item {
                    margin-bottom: 1px;
                }

                .folder-header {
                    display: flex;
                    align-items: center;
                    padding: 5px 8px;
                    margin-left: 16px;
                    cursor: pointer;
                    gap: 6px;
                    color: var(--text-secondary, #a0a0b2);
                    border-radius: 4px;
                    transition: all 0.15s;
                }

                .folder-header:hover {
                    background: var(--bg-hover, #2d2d44);
                    color: var(--text-primary, #fff);
                }

                .folder-header.active {
                    background: var(--bg-active, #3d3d5c);
                    color: var(--text-primary, #fff);
                }

                .folder-name {
                    flex: 1;
                    font-size: 12px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .folder-content {
                    margin-left: 8px;
                }
            `}</style>
        </div>
    );
};

// List Item Component
const ListItem = ({ list, workspaceId, onListClick, isActive, indent = 1 }) => {
    const marginLeft = indent * 16 + 8;

    return (
        <div
            className={`list-item ${isActive(`/w/${workspaceId}/list/${list.id}`) ? 'active' : ''}`}
            style={{ marginLeft: `${marginLeft}px` }}
            onClick={() => onListClick(list.id)}
        >
            <List size={14} style={{ color: list.color || '#6366f1' }} />
            <span className="list-name">{list.name}</span>
            {list._count?.tasks > 0 && (
                <span className="task-count">{list._count.tasks}</span>
            )}

            <style>{`
                .list-item {
                    display: flex;
                    align-items: center;
                    padding: 5px 8px;
                    cursor: pointer;
                    gap: 6px;
                    color: var(--text-secondary, #a0a0b2);
                    border-radius: 4px;
                    transition: all 0.15s;
                }

                .list-item:hover {
                    background: var(--bg-hover, #2d2d44);
                    color: var(--text-primary, #fff);
                }

                .list-item.active {
                    background: var(--bg-active, #3d3d5c);
                    color: var(--text-primary, #fff);
                }

                .list-name {
                    flex: 1;
                    font-size: 12px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .task-count {
                    font-size: 10px;
                    background: var(--bg-tertiary, #252538);
                    padding: 2px 6px;
                    border-radius: 10px;
                    color: var(--text-tertiary, #6b6b80);
                }
            `}</style>
        </div>
    );
};

export default WorkspaceSidebar;
