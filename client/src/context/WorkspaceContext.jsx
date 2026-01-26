import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import http from '../api/http';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
    // Core state
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const [currentSpace, setCurrentSpace] = useState(null);
    const [currentList, setCurrentList] = useState(null);
    const [currentTask, setCurrentTask] = useState(null);

    // UI state
    const [sidebarExpanded, setSidebarExpanded] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ===========================================
    // WORKSPACE OPERATIONS
    // ===========================================

    const fetchWorkspaces = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await http.get('/workspaces');
            setWorkspaces(res.data);
            // Auto-select first workspace if none selected
            if (res.data.length > 0 && !currentWorkspace) {
                setCurrentWorkspace(res.data[0]);
            }
            return res.data;
        } catch (err) {
            console.error('Error fetching workspaces:', err);
            setError('Failed to load workspaces');
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentWorkspace]);

    const fetchWorkspaceDetails = useCallback(async (workspaceId) => {
        setLoading(true);
        try {
            const res = await http.get(`/workspaces/${workspaceId}`);
            setCurrentWorkspace(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching workspace details:', err);
            setError('Failed to load workspace');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createWorkspace = useCallback(async (data) => {
        try {
            const res = await http.post('/workspaces', data);
            setWorkspaces(prev => [...prev, res.data]);
            return res.data;
        } catch (err) {
            console.error('Error creating workspace:', err);
            throw err;
        }
    }, []);

    const updateWorkspace = useCallback(async (id, data) => {
        try {
            const res = await http.put(`/workspaces/${id}`, data);
            setWorkspaces(prev => prev.map(w => w.id === id ? res.data : w));
            if (currentWorkspace?.id === id) {
                setCurrentWorkspace(res.data);
            }
            return res.data;
        } catch (err) {
            console.error('Error updating workspace:', err);
            throw err;
        }
    }, [currentWorkspace]);

    const deleteWorkspace = useCallback(async (id) => {
        try {
            await http.delete(`/workspaces/${id}`);
            setWorkspaces(prev => prev.filter(w => w.id !== id));
            if (currentWorkspace?.id === id) {
                setCurrentWorkspace(null);
            }
        } catch (err) {
            console.error('Error deleting workspace:', err);
            throw err;
        }
    }, [currentWorkspace]);

    // ===========================================
    // SPACE OPERATIONS
    // ===========================================

    const fetchSpace = useCallback(async (spaceId) => {
        setLoading(true);
        try {
            const res = await http.get(`/spaces/${spaceId}`);
            setCurrentSpace(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching space:', err);
            setError('Failed to load space');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createSpace = useCallback(async (data) => {
        try {
            const res = await http.post('/spaces', data);
            // Update current workspace with new space
            if (currentWorkspace && data.workspaceId === currentWorkspace.id) {
                setCurrentWorkspace(prev => ({
                    ...prev,
                    spaces: [...(prev.spaces || []), res.data]
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error creating space:', err);
            throw err;
        }
    }, [currentWorkspace]);

    const updateSpace = useCallback(async (id, data) => {
        try {
            const res = await http.put(`/spaces/${id}`, data);
            if (currentWorkspace) {
                setCurrentWorkspace(prev => ({
                    ...prev,
                    spaces: prev.spaces?.map(s => s.id === id ? res.data : s)
                }));
            }
            if (currentSpace?.id === id) {
                setCurrentSpace(res.data);
            }
            return res.data;
        } catch (err) {
            console.error('Error updating space:', err);
            throw err;
        }
    }, [currentWorkspace, currentSpace]);

    const deleteSpace = useCallback(async (id) => {
        try {
            await http.delete(`/spaces/${id}`);
            if (currentWorkspace) {
                setCurrentWorkspace(prev => ({
                    ...prev,
                    spaces: prev.spaces?.filter(s => s.id !== id)
                }));
            }
            if (currentSpace?.id === id) {
                setCurrentSpace(null);
            }
        } catch (err) {
            console.error('Error deleting space:', err);
            throw err;
        }
    }, [currentWorkspace, currentSpace]);

    // ===========================================
    // FOLDER OPERATIONS
    // ===========================================

    const createFolder = useCallback(async (data) => {
        try {
            const res = await http.post('/folders', data);
            // Update current space with new folder
            if (currentSpace && data.spaceId === currentSpace.id) {
                setCurrentSpace(prev => ({
                    ...prev,
                    folders: [...(prev.folders || []), res.data]
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error creating folder:', err);
            throw err;
        }
    }, [currentSpace]);

    const updateFolder = useCallback(async (id, data) => {
        try {
            const res = await http.put(`/folders/${id}`, data);
            if (currentSpace) {
                setCurrentSpace(prev => ({
                    ...prev,
                    folders: prev.folders?.map(f => f.id === id ? res.data : f)
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error updating folder:', err);
            throw err;
        }
    }, [currentSpace]);

    const deleteFolder = useCallback(async (id) => {
        try {
            await http.delete(`/folders/${id}`);
            if (currentSpace) {
                setCurrentSpace(prev => ({
                    ...prev,
                    folders: prev.folders?.filter(f => f.id !== id)
                }));
            }
        } catch (err) {
            console.error('Error deleting folder:', err);
            throw err;
        }
    }, [currentSpace]);

    // ===========================================
    // LIST OPERATIONS
    // ===========================================

    const fetchList = useCallback(async (listId) => {
        setLoading(true);
        try {
            const res = await http.get(`/lists/${listId}`);
            setCurrentList(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching list:', err);
            setError('Failed to load list');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createList = useCallback(async (data) => {
        try {
            const res = await http.post('/lists', data);
            // Update current space with new list
            if (currentSpace && data.spaceId === currentSpace.id) {
                if (data.folderId) {
                    setCurrentSpace(prev => ({
                        ...prev,
                        folders: prev.folders?.map(f =>
                            f.id === data.folderId
                                ? { ...f, lists: [...(f.lists || []), res.data] }
                                : f
                        )
                    }));
                } else {
                    setCurrentSpace(prev => ({
                        ...prev,
                        lists: [...(prev.lists || []), res.data]
                    }));
                }
            }
            return res.data;
        } catch (err) {
            console.error('Error creating list:', err);
            throw err;
        }
    }, [currentSpace]);

    const updateList = useCallback(async (id, data) => {
        try {
            const res = await http.put(`/lists/${id}`, data);
            if (currentList?.id === id) {
                setCurrentList(prev => ({ ...prev, ...res.data }));
            }
            return res.data;
        } catch (err) {
            console.error('Error updating list:', err);
            throw err;
        }
    }, [currentList]);

    const deleteList = useCallback(async (id) => {
        try {
            await http.delete(`/lists/${id}`);
            if (currentList?.id === id) {
                setCurrentList(null);
            }
        } catch (err) {
            console.error('Error deleting list:', err);
            throw err;
        }
    }, [currentList]);

    // ===========================================
    // TASK OPERATIONS
    // ===========================================

    const fetchTask = useCallback(async (taskId) => {
        setLoading(true);
        try {
            const res = await http.get(`/list-tasks/${taskId}`);
            setCurrentTask(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching task:', err);
            setError('Failed to load task');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = useCallback(async (data) => {
        try {
            const res = await http.post('/list-tasks', data);
            // Update current list with new task
            if (currentList && data.listId === currentList.id) {
                setCurrentList(prev => ({
                    ...prev,
                    tasks: [...(prev.tasks || []), res.data]
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error creating task:', err);
            throw err;
        }
    }, [currentList]);

    const updateTask = useCallback(async (id, data) => {
        try {
            const res = await http.put(`/list-tasks/${id}`, data);
            if (currentList) {
                setCurrentList(prev => ({
                    ...prev,
                    tasks: prev.tasks?.map(t => t.id === id ? { ...t, ...res.data } : t)
                }));
            }
            if (currentTask?.id === id) {
                setCurrentTask(prev => ({ ...prev, ...res.data }));
            }
            return res.data;
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    }, [currentList, currentTask]);

    const deleteTask = useCallback(async (id) => {
        try {
            await http.delete(`/list-tasks/${id}`);
            if (currentList) {
                setCurrentList(prev => ({
                    ...prev,
                    tasks: prev.tasks?.filter(t => t.id !== id)
                }));
            }
            if (currentTask?.id === id) {
                setCurrentTask(null);
            }
        } catch (err) {
            console.error('Error deleting task:', err);
            throw err;
        }
    }, [currentList, currentTask]);

    const moveTask = useCallback(async (taskId, listId, statusId) => {
        try {
            const res = await http.post(`/list-tasks/${taskId}/move`, { listId, statusId });
            // Update source list
            if (currentList) {
                setCurrentList(prev => ({
                    ...prev,
                    tasks: prev.tasks?.filter(t => t.id !== taskId)
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error moving task:', err);
            throw err;
        }
    }, [currentList]);

    const reorderTasks = useCallback(async (listId, taskIds, statusId) => {
        try {
            await http.put(`/list-tasks/list/${listId}/reorder`, { taskIds, statusId });
        } catch (err) {
            console.error('Error reordering tasks:', err);
            throw err;
        }
    }, []);

    // ===========================================
    // TASK COMMENTS
    // ===========================================

    const addComment = useCallback(async (taskId, content, parentId = null) => {
        try {
            const res = await http.post(`/list-tasks/${taskId}/comments`, { content, parentId });
            if (currentTask?.id === taskId) {
                setCurrentTask(prev => ({
                    ...prev,
                    comments: parentId
                        ? prev.comments?.map(c =>
                            c.id === parentId
                                ? { ...c, replies: [...(c.replies || []), res.data] }
                                : c
                        )
                        : [res.data, ...(prev.comments || [])]
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    }, [currentTask]);

    const updateComment = useCallback(async (taskId, commentId, content) => {
        try {
            const res = await http.put(`/list-tasks/${taskId}/comments/${commentId}`, { content });
            if (currentTask?.id === taskId) {
                setCurrentTask(prev => ({
                    ...prev,
                    comments: prev.comments?.map(c => c.id === commentId ? res.data : c)
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error updating comment:', err);
            throw err;
        }
    }, [currentTask]);

    const deleteComment = useCallback(async (taskId, commentId) => {
        try {
            await http.delete(`/list-tasks/${taskId}/comments/${commentId}`);
            if (currentTask?.id === taskId) {
                setCurrentTask(prev => ({
                    ...prev,
                    comments: prev.comments?.filter(c => c.id !== commentId)
                }));
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            throw err;
        }
    }, [currentTask]);

    // ===========================================
    // TASK ASSIGNEES
    // ===========================================

    const addAssignee = useCallback(async (taskId, employeeId) => {
        try {
            const res = await http.post(`/list-tasks/${taskId}/assignees`, { employeeId });
            if (currentTask?.id === taskId) {
                setCurrentTask(prev => ({
                    ...prev,
                    assignees: [...(prev.assignees || []), res.data]
                }));
            }
            return res.data;
        } catch (err) {
            console.error('Error adding assignee:', err);
            throw err;
        }
    }, [currentTask]);

    const removeAssignee = useCallback(async (taskId, assigneeId) => {
        try {
            await http.delete(`/list-tasks/${taskId}/assignees/${assigneeId}`);
            if (currentTask?.id === taskId) {
                setCurrentTask(prev => ({
                    ...prev,
                    assignees: prev.assignees?.filter(a => a.id !== assigneeId)
                }));
            }
        } catch (err) {
            console.error('Error removing assignee:', err);
            throw err;
        }
    }, [currentTask]);

    // ===========================================
    // UI HELPERS
    // ===========================================

    const toggleSidebarItem = useCallback((key) => {
        setSidebarExpanded(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    const selectWorkspace = useCallback((workspace) => {
        setCurrentWorkspace(workspace);
        setCurrentSpace(null);
        setCurrentList(null);
        setCurrentTask(null);
    }, []);

    const selectSpace = useCallback((space) => {
        setCurrentSpace(space);
        setCurrentList(null);
        setCurrentTask(null);
    }, []);

    const selectList = useCallback((list) => {
        setCurrentList(list);
        setCurrentTask(null);
    }, []);

    const selectTask = useCallback((task) => {
        setCurrentTask(task);
    }, []);

    // Load workspaces on mount
    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const value = useMemo(() => ({
        // State
        workspaces,
        currentWorkspace,
        currentSpace,
        currentList,
        currentTask,
        sidebarExpanded,
        loading,
        error,

        // Workspace operations
        fetchWorkspaces,
        fetchWorkspaceDetails,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,

        // Space operations
        fetchSpace,
        createSpace,
        updateSpace,
        deleteSpace,

        // Folder operations
        createFolder,
        updateFolder,
        deleteFolder,

        // List operations
        fetchList,
        createList,
        updateList,
        deleteList,

        // Task operations
        fetchTask,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        reorderTasks,

        // Comment operations
        addComment,
        updateComment,
        deleteComment,

        // Assignee operations
        addAssignee,
        removeAssignee,

        // UI helpers
        toggleSidebarItem,
        selectWorkspace,
        selectSpace,
        selectList,
        selectTask,

        // Setters for direct manipulation
        setCurrentWorkspace,
        setCurrentSpace,
        setCurrentList,
        setCurrentTask,
        setError
    }), [
        workspaces,
        currentWorkspace,
        currentSpace,
        currentList,
        currentTask,
        sidebarExpanded,
        loading,
        error,
        fetchWorkspaces,
        fetchWorkspaceDetails,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        fetchSpace,
        createSpace,
        updateSpace,
        deleteSpace,
        createFolder,
        updateFolder,
        deleteFolder,
        fetchList,
        createList,
        updateList,
        deleteList,
        fetchTask,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        reorderTasks,
        addComment,
        updateComment,
        deleteComment,
        addAssignee,
        removeAssignee,
        toggleSidebarItem,
        selectWorkspace,
        selectSpace,
        selectList,
        selectTask
    ]);

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};

export default WorkspaceContext;
