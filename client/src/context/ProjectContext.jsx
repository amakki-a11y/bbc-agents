import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([
        { id: 1, name: 'Business Requirements', color: '#7b68ee' },
        { id: 'web', name: 'Web App', color: '#10b981' },
        { id: 'marketing', name: 'Marketing', color: '#f59e0b' },
        { id: 'design', name: 'Design System', color: '#ec4899' },
    ]);
    const [activeProjectId, setActiveProjectId] = useState(1);
    const [tasks, setTasks] = useState([]);
    const [viewSettings, setViewSettings] = useState({}); // { [projectId]: { view: 'list' | 'board', grouping: 'status', ... } }
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({});

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // Load initial data
    useEffect(() => {
        // Load view settings from local storage
        const savedSettings = localStorage.getItem('project_view_settings');
        if (savedSettings) {
            setViewSettings(JSON.parse(savedSettings));
        }

        fetchTasks();
    }, []);

    // Save settings on change
    useEffect(() => {
        localStorage.setItem('project_view_settings', JSON.stringify(viewSettings));
    }, [viewSettings]);

   const fetchTasks = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/data/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Map backend format to frontend format
        const mappedTasks = res.data.map(task => ({
            ...task,
            projectId: task.project_id,
            status: task.status?.toUpperCase().replace('_', ' ') || 'TO DO'
        }));
        setTasks(mappedTasks);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        // Fallback data if backend is not ready
        setTasks([
            { id: 101, projectId: 1, title: "Sample Task 1", status: "TO DO", priority: "medium" },
            { id: 102, projectId: 1, title: "Sample Task 2", status: "IN PROGRESS", priority: "high" },
        ]);
    }
};

    const logActivity = useCallback((task, type, message, meta = {}) => {
        const entry = {
            id: Date.now() + Math.random(),
            type,
            message,
            meta,
            user: "MT",
            createdAt: new Date().toISOString()
        };
        return [...(task.activity || []), entry];
    }, []);

    const addTask = useCallback(async (task) => {
    // Optimistic update with temp ID
    const tempId = Date.now();
    const initialActivity = {
        id: Date.now(),
        type: 'create',
        message: 'MT created this task',
        user: 'MT',
        createdAt: new Date().toISOString()
    };
    
    // Local task for UI (with frontend format)
    const localTask = { 
        status: 'TO DO', 
        tags: [], 
        activity: [initialActivity], 
        ...task, 
        id: tempId, 
        projectId: activeProjectId 
    };

    setTasks(prev => [...prev, localTask]);

    // Background sync to backend
    (async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Convert to backend format
            const backendTask = {
                title: task.title || 'New Task',
                description: task.description || '',
                status: 'todo', // Backend expects lowercase
                priority: task.priority || 'medium',
                tags: task.tags || [],
                project_id: activeProjectId, // Backend expects snake_case
                due_date: task.due_date || null
            };
            
            const res = await axios.post(`${API_URL}/data/tasks`, backendTask, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Replace temp task with real task from backend
            const savedTask = {
                ...res.data,
                projectId: res.data.project_id, // Map back to frontend format
                activity: [initialActivity]
            };
            
            setTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));
            console.log('Task saved to database:', savedTask);
        } catch (e) {
            console.error("Backend sync failed:", e.response?.data || e.message);
            // Keep the local task even if backend fails
        }
    })();

    return localTask;
}, [activeProjectId, API_URL]);

        // Background sync
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.post(`${API_URL}/tasks`, newTask, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(prev => prev.map(t => t.id === tempId ? res.data : t));
            } catch (e) {
                console.log("Backend offline, using local state");
            }
        })();

        return newTask;
    }, [activeProjectId, API_URL]);

    const updateTask = useCallback(async (taskId, updates) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                let newActivity = t.activity || [];
                // Simplified activity logging for brevity in update...
                const updatedTask = { ...t, ...updates }; // Activity logic could be complex

                // Fire and forget sync
                axios.put(`${API_URL}/tasks/${taskId}`, { ...updates }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }).catch(e => console.log('Backend sync failed'));

                return updatedTask;
            }
            return t;
        }));
    }, [API_URL]);

    const deleteTask = useCallback(async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { console.log("Backend offline, local delete"); }
    }, [API_URL]);

    const bulkUpdateTasks = useCallback(async (taskIds, updates) => {
        if (!taskIds.length) return;
        setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, ...updates } : t));
        try {
            await axios.put(`${API_URL}/tasks/bulk`, { taskIds, updates }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { console.error("Bulk update failed", e); }
    }, [API_URL]);

    const bulkDeleteTasks = useCallback(async (taskIds) => {
        if (!taskIds.length) return;
        setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
        try {
            await axios.delete(`${API_URL}/tasks/bulk`, {
                data: { taskIds },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { console.error("Bulk delete failed", e); }
    }, [API_URL]);

    const updateViewSetting = useCallback((projectId, key, value) => {
        setViewSettings(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                [key]: value
            }
        }));
    }, []);

    const value = useMemo(() => ({
        projects,
        activeProjectId,
        setActiveProjectId,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        bulkUpdateTasks,
        bulkDeleteTasks,
        viewSettings,
        updateViewSetting,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters
    }), [
        projects,
        activeProjectId,
        setActiveProjectId,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        bulkUpdateTasks,
        bulkDeleteTasks,
        viewSettings,
        updateViewSetting,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters
    ]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};
