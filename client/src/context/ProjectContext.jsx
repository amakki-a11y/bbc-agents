import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import http from '../api/http';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [viewSettings, setViewSettings] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Track temp ID to real ID mappings
    const tempIdMapRef = useRef(new Map());

    // Fetch projects from backend
    const fetchProjects = async () => {
        try {
            const res = await http.get('/projects');
            // Filter out archived projects and map to expected format
            const activeProjects = res.data
                .filter(p => !p.archived)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    color: p.color || '#6366f1'
                }));
            setProjects(activeProjects);
            console.log('Projects fetched from database:', activeProjects.length);

            // Set first project as active if none selected
            if (activeProjects.length > 0 && !activeProjectId) {
                setActiveProjectId(activeProjects[0].id);
            }
            return activeProjects;
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setProjects([]);
            return [];
        }
    };

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const savedSettings = localStorage.getItem('project_view_settings');
            if (savedSettings) {
                setViewSettings(JSON.parse(savedSettings));
            }
            await fetchProjects();
            await fetchTasks();
            setIsLoading(false);
        };
        initData();
    }, []);

    useEffect(() => {
        localStorage.setItem('project_view_settings', JSON.stringify(viewSettings));
    }, [viewSettings]);

    const fetchTasks = async () => {
        try {
            const res = await http.get('/tasks');
            const mappedTasks = res.data.map(task => ({
                ...task,
                projectId: task.project_id,
                // Normalize status: backend uses lowercase, frontend uses uppercase with space
                status: normalizeStatusForUI(task.status)
            }));
            setTasks(mappedTasks);
            console.log('Tasks fetched from database:', mappedTasks.length);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            setTasks([]);
        }
    };

    // Helper to normalize status for UI display
    const normalizeStatusForUI = (status) => {
        if (!status) return 'TO DO';
        const statusMap = {
            'todo': 'TO DO',
            'to do': 'TO DO',
            'in_progress': 'IN PROGRESS',
            'in progress': 'IN PROGRESS',
            'inprogress': 'IN PROGRESS',
            'done': 'DONE',
            'complete': 'DONE',
            'completed': 'DONE'
        };
        return statusMap[status.toLowerCase()] || status.toUpperCase();
    };

    // Helper to normalize status for backend
    const normalizeStatusForBackend = (status) => {
        if (!status) return 'todo';
        const statusMap = {
            'TO DO': 'todo',
            'TODO': 'todo',
            'IN PROGRESS': 'in_progress',
            'INPROGRESS': 'in_progress',
            'DONE': 'done',
            'COMPLETE': 'done'
        };
        return statusMap[status.toUpperCase()] || status.toLowerCase();
    };

    const addTask = useCallback(async (task) => {
        const tempId = Date.now();
        const initialActivity = {
            id: Date.now(),
            type: 'create',
            message: 'Created this task',
            user: 'You',
            createdAt: new Date().toISOString()
        };

        const localTask = {
            status: 'TO DO',
            tags: [],
            activity: [initialActivity],
            ...task,
            id: tempId,
            projectId: activeProjectId,
            _isSaving: true // Flag to indicate task is being saved
        };

        // Add task with temp ID immediately for optimistic UI
        setTasks(prev => [...prev, localTask]);
        console.log('Task added with temp ID:', tempId);

        // Save to backend
        try {
            const backendTask = {
                title: task.title || 'New Task',
                description: task.description || '',
                status: normalizeStatusForBackend(task.status || 'TO DO'),
                priority: task.priority || 'medium',
                tags: task.tags || [],
                project_id: activeProjectId,
                due_date: task.due_date || null
            };
            
            console.log('Saving task to backend:', backendTask);

            const res = await http.post('/tasks', backendTask);
            
            const savedTask = {
                ...res.data,
                projectId: res.data.project_id,
                status: normalizeStatusForUI(res.data.status),
                activity: [initialActivity],
                _isSaving: false
            };
            
            console.log('Task saved to database with real ID:', savedTask.id);
            
            // Store the mapping from temp ID to real ID
            tempIdMapRef.current.set(tempId, savedTask.id);
            
            // Replace temp task with saved task
            setTasks(prev => {
                const updated = prev.map(t => t.id === tempId ? savedTask : t);
                console.log('Tasks updated, replaced temp ID', tempId, 'with real ID', savedTask.id);
                return updated;
            });
            
            return savedTask;
        } catch (e) {
            console.error("Backend sync failed:", e.response?.data || e.message);
            // Mark task as failed to save
            setTasks(prev => prev.map(t => 
                t.id === tempId ? { ...t, _isSaving: false, _saveFailed: true } : t
            ));
            return localTask;
        }
    }, [activeProjectId]);

    // Helper to get real ID from temp ID if available
    const getRealTaskId = useCallback((taskId) => {
        const numericId = Number(taskId);
        if (numericId > 1000000000000) {
            // This is a temp ID, check if we have a mapping
            const realId = tempIdMapRef.current.get(numericId);
            if (realId) {
                console.log('Mapped temp ID', numericId, 'to real ID', realId);
                return realId;
            }
        }
        return taskId;
    }, []);

    const updateTask = useCallback(async (taskId, updates) => {
        const realTaskId = getRealTaskId(taskId);
        
        // Normalize status if it's being updated
        const normalizedUpdates = { ...updates };
        if (updates.status) {
            normalizedUpdates.status = normalizeStatusForUI(updates.status);
        }
        
        setTasks(prev => prev.map(t => {
            if (t.id === taskId || t.id === realTaskId) {
                return { ...t, ...normalizedUpdates };
            }
            return t;
        }));

        // Only sync to backend if we have a real ID
        if (realTaskId < 1000000000000) {
            try {
                const backendUpdates = { ...updates };
                if (updates.status) {
                    backendUpdates.status = normalizeStatusForBackend(updates.status);
                }
                await http.put(`/tasks/${realTaskId}`, backendUpdates);
                console.log('Task updated in database:', realTaskId);
            } catch (e) {
                console.error('Backend sync failed:', e.response?.data || e.message);
            }
        } else {
            console.log('Skipping backend update for temp ID:', taskId);
        }
    }, [getRealTaskId]);

    const deleteTask = useCallback(async (taskId) => {
        const realTaskId = getRealTaskId(taskId);
        
        setTasks(prev => prev.filter(t => t.id !== taskId && t.id !== realTaskId));
        
        // Only delete from backend if we have a real ID
        if (realTaskId < 1000000000000) {
            try {
                await http.delete(`/tasks/${realTaskId}`);
            } catch (e) {
                console.log("Backend delete failed:", e.message);
            }
        }
    }, [getRealTaskId]);

    const bulkUpdateTasks = useCallback(async (taskIds, updates) => {
        if (!taskIds.length) return;
        
        const realTaskIds = taskIds.map(id => getRealTaskId(id)).filter(id => id < 1000000000000);
        
        setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, ...updates } : t));
        
        if (realTaskIds.length > 0) {
            try {
                await http.put('/tasks/bulk', { taskIds: realTaskIds, updates });
            } catch (e) {
                console.error("Bulk update failed", e);
            }
        }
    }, [getRealTaskId]);

    const bulkDeleteTasks = useCallback(async (taskIds) => {
        if (!taskIds.length) return;
        
        const realTaskIds = taskIds.map(id => getRealTaskId(id)).filter(id => id < 1000000000000);
        
        setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
        
        if (realTaskIds.length > 0) {
            try {
                await http.delete('/tasks/bulk', {
                    data: { taskIds: realTaskIds }
                });
            } catch (e) {
                console.error("Bulk delete failed", e);
            }
        }
    }, [getRealTaskId]);

    const updateViewSetting = useCallback((projectId, key, value) => {
        setViewSettings(prev => ({
            ...prev,
            [projectId]: { ...prev[projectId], [key]: value }
        }));
    }, []);

    // Get task by ID (handles temp ID to real ID mapping)
    const getTaskById = useCallback((taskId) => {
        const numericId = Number(taskId);
        
        // First try direct match
        let task = tasks.find(t => t.id === numericId || t.id === taskId || String(t.id) === String(taskId));
        
        // If not found and it's a temp ID, check if we have a mapping
        if (!task && numericId > 1000000000000) {
            const realId = tempIdMapRef.current.get(numericId);
            if (realId) {
                task = tasks.find(t => t.id === realId);
            }
        }
        
        return task;
    }, [tasks]);

    // Get current project
    const activeProject = useMemo(() => {
        return projects.find(p => p.id === activeProjectId) || null;
    }, [projects, activeProjectId]);

    const value = useMemo(() => ({
        projects, activeProjectId, setActiveProjectId, activeProject, tasks, addTask, updateTask,
        deleteTask, bulkUpdateTasks, bulkDeleteTasks, viewSettings, updateViewSetting,
        searchQuery, setSearchQuery, filters, setFilters, fetchTasks, fetchProjects, getTaskById,
        getRealTaskId, isLoading
    }), [projects, activeProjectId, activeProject, tasks, addTask, updateTask, deleteTask,
        bulkUpdateTasks, bulkDeleteTasks, viewSettings, updateViewSetting,
        searchQuery, filters, getTaskById, getRealTaskId, isLoading]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};
