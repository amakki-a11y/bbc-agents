import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import TaskDetailsMain from '../components/task/TaskDetailsMain';
import ActivityPanel from '../components/task/ActivityPanel';
import TaskTabActionItems from '../components/task/TaskTabActionItems';
import TaskDetailsHeader from "../components/task/TaskDetailsHeader";

const TaskDetailsPage = ({ onClose, taskId: propTaskId }) => {
    const params = useParams();
    const taskId = propTaskId || params.taskId;

    const [taskDetails, setTaskDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("details");

    const { updateTask, tasks } = useProject();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const fetchTaskDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                setError("No authentication token found");
                setLoading(false);
                return;
            }

            // Check if this is a temporary ID (Date.now() generates 13-digit numbers like 1768691631122)
            const numericId = Number(taskId);
            const isTemporaryId = numericId > 1000000000000;
            
            if (isTemporaryId) {
                console.log('Detected temporary ID:', taskId);
                
                // Try to find the task in context - it might have the real DB id now
                const contextTask = tasks.find(t => 
                    t.id === numericId || 
                    t.id === taskId || 
                    String(t.id) === String(taskId)
                );
                
                if (contextTask) {
                    // Check if context task now has a real database ID (small number)
                    if (contextTask.id < 1000000000000) {
                        console.log('Task was saved! Real ID:', contextTask.id);
                        setTaskDetails(contextTask);
                        setLoading(false);
                        return;
                    }
                    
                    // Still has temp ID but we can show it from context
                    console.log('Using task from context (still temp ID):', contextTask);
                    setTaskDetails(contextTask);
                    setLoading(false);
                    return;
                }
                
                setError("Task is still being saved. Please wait a moment and try again.");
                setLoading(false);
                return;
            }

            // Real database ID - fetch from API
            // Correct endpoint: /api/tasks/details/:id
            const response = await fetch(
                `${API_URL}/tasks/details/${taskId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    // Fallback: try to find in context
                    const contextTask = tasks.find(t => String(t.id) === String(taskId));
                    if (contextTask) {
                        console.log('Task not in DB, using context:', contextTask);
                        setTaskDetails(contextTask);
                        setLoading(false);
                        return;
                    }
                    throw new Error('Task not found');
                }
                throw new Error(`Failed to fetch task details: ${response.status}`);
            }

            const data = await response.json();
            console.log('Task fetched from API:', data);
            setTaskDetails(data);
        } catch (err) {
            console.error('Error fetching task:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [taskId, API_URL, tasks]);

    useEffect(() => {
        if (taskId) fetchTaskDetails();
    }, [taskId, fetchTaskDetails]);

    const refreshTaskDetails = async () => {
        await fetchTaskDetails();
    };

    const handleUpdate = (field, value) => {
        // Optimistic update for local state
        setTaskDetails(prev => ({ ...prev, [field]: value }));
        // Update context/backend
        if (taskDetails && taskDetails.id) {
            const updates = { [field]: value };
            updateTask(taskDetails.id, updates);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Loading task...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="text-red-500">{error}</div>
                <button 
                    onClick={fetchTaskDetails}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        Close
                    </button>
                )}
            </div>
        );
    }

    if (!taskDetails) return <div>Task not found</div>;

    return (
        <div className="h-screen flex flex-col bg-white">
            <TaskDetailsHeader task={taskDetails} onClose={onClose} />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel (70%) - Tabs and Content */}
                <div className="w-[70%] flex flex-col">
                    <TaskDetailsMain
                        task={taskDetails}
                        onUpdate={handleUpdate}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onTaskRefresh={refreshTaskDetails}
                    />

                    {activeTab === 'actionItems' && (
                        <div className="p-4 overflow-auto flex-1">
                            <TaskTabActionItems
                                taskId={taskId}
                                task={taskDetails}
                                onTaskRefresh={refreshTaskDetails}
                            />
                        </div>
                    )}
                </div>

                {/* Right Panel (30%) - Activity */}
                <div className="w-[30%] border-l border-gray-200">
                    <ActivityPanel
                        task={taskDetails}
                        onUpdate={handleUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsPage;
