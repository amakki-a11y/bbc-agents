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
    const [viewSettings, setViewSettings] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({});

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        const savedSettings = localStorage.getItem('project_view_settings');
        if (savedSettings) {
            setViewSettings(JSON.parse(savedSettings));
        }
        fetchTasks();
    }, []);

    useEffect(() => {
        localStorage.setItem('project_view_settings', JSON.stringify(viewSettings));
    }, [viewSettings]);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/data/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const mappedTasks = res.data.map(task => ({
                ...task,
                projectId: task.project_id,
                status: task.status?.toUpperCase().replace('_', ' ') || 'TO DO'
            }));
            setTasks(mappedTasks);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            setTasks([
                { id: 101, projectId: 1, title: "Sample Task 1", status: "TO DO", priority: "medium" },
                { id: 102, projectId: 1, title: "Sample Task 2", status: "IN PROGRESS", priority: "high" },
            ]);
        }
    };

    const addTask = useCallback(async (task) => {
        const tempId = Date.now();
        const initialActivity = {
            id: Date.now(),
            type: 'create',
            message: 'MT created this task',
            user: 'MT',
            createdAt: new Date().toISOString()
        };
        
        const localTask = { 
            status: 'TO DO', 
            tags: [], 
            activity: [initialActivity], 
            ...task, 
            id: tempId, 
            projectId: activeProjectId 
        };

        setTasks(prev => [...prev, localTask]);

        (async () => {
            try {
                const token = localStorage.getItem('token');
                const backendTask = {
                    title: task.title || 'New Task',
                    description: task.description || '',
                    status: 'todo',
                    priority: task.priority || 'medium',
                    tags: task.tags || [],
                    project_id: activeProjectId,
                    due_date: task.due_date || null
                };
                
                const res = await axios.post(`${API_URL}/data/tasks`, backendTask, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const savedTask = {
                    ...res.data,
                    projectId: res.data.project_id,
                    status: res.data.status?.toUpperCase().replace('_', ' ') || 'TO DO',
                    activity: [initialActivity]
                };
                
                setTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));
                console.log('Task saved to database:', savedTask);
            } catch (e) {
                console.error("Backend sync failed:", e.response?.data || e.message);
            }
        })();

        return localTask;
    }, [activeProjectId, API_URL]);

    const updateTask = useCallback(async (taskId, updates) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const updatedTask = { ...t, ...updates };
                axios.put(`${API_URL}/data/tasks/${taskId}`, { ...updates }, {
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
            await axios.delete(`${API_URL}/data/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { console.log("Backend offline, local delete"); }
    }, [API_URL]);

    const bulkUpdateTasks = useCallback(async (taskIds, updates) => {
        if (!taskIds.length) return;
        setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, ...updates } : t));
        try {
            await axios.put(`${API_URL}/data/tasks/bulk`, { taskIds, updates }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { console.error("Bulk update failed", e); }
    }, [API_URL]);

    const bulkDeleteTasks = useCallback(async (taskIds) => {
        if (!taskIds.length) return;
        setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
        try {
            await axios.delete(`${API_URL}/data/tasks/bulk`, {
                data: { taskIds },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (e) { console.error("Bulk delete failed", e); }
    }, [API_URL]);

    const updateViewSetting = useCallback((projectId, key, value) => {
        setViewSettings(prev => ({
            ...prev,
            [projectId]: { ...prev[projectId], [key]: value }
        }));
    }, []);

    const value = useMemo(() => ({
        projects, activeProjectId, setActiveProjectId, tasks, addTask, updateTask,
        deleteTask, bulkUpdateTasks, bulkDeleteTasks, viewSettings, updateViewSetting,
        searchQuery, setSearchQuery, filters, setFilters, fetchTasks
    }), [projects, activeProjectId, tasks, addTask, updateTask, deleteTask,
        bulkUpdateTasks, bulkDeleteTasks, viewSettings, updateViewSetting,
        searchQuery, filters]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};
