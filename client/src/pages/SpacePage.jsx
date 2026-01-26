import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Dashboard from './Dashboard';
import {
    Plus,
    Folder,
    List,
    MoreHorizontal,
    Settings,
    Users,
    ChevronRight,
    FolderPlus,
    FilePlus,
    Search,
    Grid,
    LayoutList
} from 'lucide-react';

const SpacePage = () => {
    const { workspaceId, spaceId } = useParams();
    const navigate = useNavigate();
    const {
        currentSpace,
        fetchSpace,
        createFolder,
        createList,
        deleteFolder,
        deleteList,
        loading
    } = useWorkspace();

    const [view, setView] = useState('grid'); // grid or list
    const [showCreateModal, setShowCreateModal] = useState(null); // 'folder' or 'list'
    const [newItemName, setNewItemName] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (spaceId) {
            fetchSpace(parseInt(spaceId));
        }
    }, [spaceId, fetchSpace]);

    const handleCreateFolder = async () => {
        if (!newItemName.trim()) return;

        try {
            await createFolder({
                spaceId: parseInt(spaceId),
                name: newItemName.trim()
            });
            setNewItemName('');
            setShowCreateModal(null);
            fetchSpace(parseInt(spaceId));
        } catch (err) {
            console.error('Error creating folder:', err);
        }
    };

    const handleCreateList = async () => {
        if (!newItemName.trim()) return;

        try {
            await createList({
                spaceId: parseInt(spaceId),
                folderId: selectedFolder,
                name: newItemName.trim()
            });
            setNewItemName('');
            setShowCreateModal(null);
            setSelectedFolder(null);
            fetchSpace(parseInt(spaceId));
        } catch (err) {
            console.error('Error creating list:', err);
        }
    };

    const handleListClick = (listId) => {
        navigate(`/w/${workspaceId}/list/${listId}`);
    };

    const handleFolderClick = (folderId) => {
        setSelectedFolder(selectedFolder === folderId ? null : folderId);
    };

    // Filter items based on search
    const filterItems = (items) => {
        if (!searchQuery) return items;
        const query = searchQuery.toLowerCase();
        return items?.filter(item => item.name.toLowerCase().includes(query));
    };

    if (loading && !currentSpace) {
        return (
            <Dashboard>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading space...</p>
                </div>
            </Dashboard>
        );
    }

    if (!currentSpace) {
        return (
            <Dashboard>
                <div className="not-found-container">
                    <h2>Space not found</h2>
                    <p>The space you are looking for does not exist or you do not have access to it.</p>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="space-page">
                {/* Header */}
                <div className="space-header">
                    <div className="header-left">
                        <span className="space-icon" style={{ backgroundColor: currentSpace.color + '20' }}>
                            {currentSpace.icon || '📁'}
                        </span>
                        <div className="header-info">
                            <h1>{currentSpace.name}</h1>
                            {currentSpace.description && (
                                <p className="space-description">{currentSpace.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="btn-icon" title="Members">
                            <Users size={18} />
                        </button>
                        <button className="btn-icon" title="Settings">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="space-toolbar">
                    <div className="toolbar-left">
                        <button
                            className="btn-create"
                            onClick={() => setShowCreateModal('folder')}
                        >
                            <FolderPlus size={16} />
                            <span>New Folder</span>
                        </button>
                        <button
                            className="btn-create"
                            onClick={() => setShowCreateModal('list')}
                        >
                            <FilePlus size={16} />
                            <span>New List</span>
                        </button>
                    </div>

                    <div className="toolbar-right">
                        <div className="search-box">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="view-switcher">
                            <button
                                className={`view-btn ${view === 'grid' ? 'active' : ''}`}
                                onClick={() => setView('grid')}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                className={`view-btn ${view === 'list' ? 'active' : ''}`}
                                onClick={() => setView('list')}
                            >
                                <LayoutList size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-content">
                    {/* Folders */}
                    {filterItems(currentSpace.folders)?.length > 0 && (
                        <div className="section">
                            <h3 className="section-title">Folders</h3>
                            <div className={`items-grid ${view}`}>
                                {filterItems(currentSpace.folders).map(folder => (
                                    <div
                                        key={folder.id}
                                        className={`folder-card ${selectedFolder === folder.id ? 'expanded' : ''}`}
                                    >
                                        <div
                                            className="folder-header"
                                            onClick={() => handleFolderClick(folder.id)}
                                        >
                                            <Folder size={20} style={{ color: folder.color || '#6366f1' }} />
                                            <span className="folder-name">{folder.name}</span>
                                            <ChevronRight
                                                size={16}
                                                className={`expand-icon ${selectedFolder === folder.id ? 'rotated' : ''}`}
                                            />
                                            <button className="menu-btn">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>

                                        {selectedFolder === folder.id && folder.lists && (
                                            <div className="folder-lists">
                                                {folder.lists.map(list => (
                                                    <div
                                                        key={list.id}
                                                        className="list-item"
                                                        onClick={() => handleListClick(list.id)}
                                                    >
                                                        <List size={14} style={{ color: list.color }} />
                                                        <span>{list.name}</span>
                                                        <span className="task-count">
                                                            {list._count?.tasks || 0} tasks
                                                        </span>
                                                    </div>
                                                ))}
                                                <button
                                                    className="add-list-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFolder(folder.id);
                                                        setShowCreateModal('list');
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                    <span>Add List</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lists (not in folders) */}
                    {filterItems(currentSpace.lists)?.length > 0 && (
                        <div className="section">
                            <h3 className="section-title">Lists</h3>
                            <div className={`items-grid ${view}`}>
                                {filterItems(currentSpace.lists).map(list => (
                                    <div
                                        key={list.id}
                                        className="list-card"
                                        onClick={() => handleListClick(list.id)}
                                    >
                                        <div className="list-icon" style={{ backgroundColor: list.color + '20' }}>
                                            <List size={20} style={{ color: list.color }} />
                                        </div>
                                        <div className="list-info">
                                            <span className="list-name">{list.name}</span>
                                            <span className="task-count">{list._count?.tasks || 0} tasks</span>
                                        </div>
                                        <button className="menu-btn">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {(!currentSpace.folders?.length && !currentSpace.lists?.length) && (
                        <div className="empty-state">
                            <div className="empty-icon">📂</div>
                            <h3>This space is empty</h3>
                            <p>Create folders to organize your lists, or add lists directly to this space.</p>
                            <div className="empty-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowCreateModal('folder')}
                                >
                                    <FolderPlus size={16} />
                                    Create Folder
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal('list')}
                                >
                                    <FilePlus size={16} />
                                    Create List
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(null)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Create {showCreateModal === 'folder' ? 'Folder' : 'List'}</h3>
                            <input
                                type="text"
                                placeholder={`${showCreateModal === 'folder' ? 'Folder' : 'List'} name...`}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        showCreateModal === 'folder' ? handleCreateFolder() : handleCreateList();
                                    }
                                    if (e.key === 'Escape') setShowCreateModal(null);
                                }}
                                autoFocus
                            />
                            {showCreateModal === 'list' && currentSpace.folders?.length > 0 && (
                                <div className="folder-select">
                                    <label>Add to folder (optional)</label>
                                    <select
                                        value={selectedFolder || ''}
                                        onChange={(e) => setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)}
                                    >
                                        <option value="">No folder</option>
                                        {currentSpace.folders.map(folder => (
                                            <option key={folder.id} value={folder.id}>
                                                {folder.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowCreateModal(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={showCreateModal === 'folder' ? handleCreateFolder : handleCreateList}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .space-page {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary, #0f0f1a);
                }

                .loading-container,
                .not-found-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-secondary, #a0a0b2);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color, #2d2d44);
                    border-top-color: var(--primary, #6366f1);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .space-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .space-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }

                .header-info h1 {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    margin: 0 0 4px 0;
                }

                .space-description {
                    font-size: 14px;
                    color: var(--text-secondary, #a0a0b2);
                    margin: 0;
                }

                .header-right {
                    display: flex;
                    gap: 8px;
                }

                .btn-icon {
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    color: var(--text-primary, #fff);
                    border-color: var(--primary, #6366f1);
                }

                .space-toolbar {
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                }

                .toolbar-left,
                .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .btn-create {
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-primary, #fff);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    transition: all 0.2s;
                }

                .btn-create:hover {
                    border-color: var(--primary, #6366f1);
                    background: rgba(99, 102, 241, 0.1);
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .search-box input {
                    background: none;
                    border: none;
                    outline: none;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                    width: 150px;
                }

                .view-switcher {
                    display: flex;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 6px;
                    padding: 4px;
                    gap: 4px;
                }

                .view-btn {
                    background: none;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    transition: all 0.2s;
                }

                .view-btn:hover {
                    color: var(--text-primary, #fff);
                }

                .view-btn.active {
                    background: var(--primary, #6366f1);
                    color: white;
                }

                .space-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }

                .section {
                    margin-bottom: 32px;
                }

                .section-title {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: var(--text-tertiary, #6b6b80);
                    font-weight: 500;
                    margin: 0 0 16px 0;
                }

                .items-grid {
                    display: grid;
                    gap: 12px;
                }

                .items-grid.grid {
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                }

                .items-grid.list {
                    grid-template-columns: 1fr;
                }

                .folder-card {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .folder-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .folder-header:hover {
                    background: var(--bg-hover, #2d2d44);
                }

                .folder-name {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }

                .expand-icon {
                    color: var(--text-tertiary, #6b6b80);
                    transition: transform 0.2s;
                }

                .expand-icon.rotated {
                    transform: rotate(90deg);
                }

                .menu-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    color: var(--text-tertiary, #6b6b80);
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .folder-header:hover .menu-btn,
                .list-card:hover .menu-btn {
                    opacity: 1;
                }

                .folder-lists {
                    border-top: 1px solid var(--border-color, #2d2d44);
                    padding: 8px;
                }

                .folder-lists .list-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--text-primary, #fff);
                    transition: background 0.2s;
                }

                .folder-lists .list-item:hover {
                    background: var(--bg-hover, #2d2d44);
                }

                .folder-lists .task-count {
                    margin-left: auto;
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                }

                .add-list-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 10px 12px;
                    background: none;
                    border: 1px dashed var(--border-color, #2d2d44);
                    border-radius: 6px;
                    color: var(--text-secondary, #a0a0b2);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .add-list-btn:hover {
                    border-color: var(--primary, #6366f1);
                    color: var(--primary, #6366f1);
                }

                .list-card {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .list-card:hover {
                    background: var(--bg-hover, #2d2d44);
                }

                .list-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .list-info {
                    flex: 1;
                }

                .list-name {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }

                .list-card .task-count {
                    display: block;
                    font-size: 12px;
                    color: var(--text-tertiary, #6b6b80);
                    margin-top: 2px;
                }

                .empty-state {
                    text-align: center;
                    padding: 64px 24px;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .empty-state h3 {
                    font-size: 18px;
                    color: var(--text-primary, #fff);
                    margin: 0 0 8px 0;
                }

                .empty-state p {
                    font-size: 14px;
                    color: var(--text-secondary, #a0a0b2);
                    margin: 0 0 24px 0;
                }

                .empty-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-primary,
                .btn-secondary {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: var(--primary, #6366f1);
                    color: white;
                    border: none;
                }

                .btn-primary:hover {
                    background: var(--primary-dark, #5558e8);
                }

                .btn-secondary {
                    background: none;
                    border: 1px solid var(--border-color, #2d2d44);
                    color: var(--text-primary, #fff);
                }

                .btn-secondary:hover {
                    border-color: var(--primary, #6366f1);
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 12px;
                    padding: 24px;
                    width: 100%;
                    max-width: 400px;
                }

                .modal h3 {
                    font-size: 18px;
                    color: var(--text-primary, #fff);
                    margin: 0 0 16px 0;
                }

                .modal input {
                    width: 100%;
                    background: var(--bg-tertiary, #252538);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 8px;
                    padding: 12px;
                    color: var(--text-primary, #fff);
                    font-size: 14px;
                    margin-bottom: 16px;
                }

                .modal input:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
                }

                .folder-select {
                    margin-bottom: 16px;
                }

                .folder-select label {
                    display: block;
                    font-size: 12px;
                    color: var(--text-secondary, #a0a0b2);
                    margin-bottom: 8px;
                }

                .folder-select select {
                    width: 100%;
                    background: var(--bg-tertiary, #252538);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 8px;
                    padding: 12px;
                    color: var(--text-primary, #fff);
                    font-size: 14px;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .btn-cancel {
                    background: none;
                    border: 1px solid var(--border-color, #2d2d44);
                    padding: 10px 20px;
                    border-radius: 8px;
                    color: var(--text-secondary, #a0a0b2);
                    font-size: 14px;
                    cursor: pointer;
                }

                .btn-cancel:hover {
                    color: var(--text-primary, #fff);
                }
            `}</style>
        </Dashboard>
    );
};

export default SpacePage;
