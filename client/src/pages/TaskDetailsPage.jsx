import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import TaskDetailsMain from '../components/task/TaskDetailsMain';
import ActivityPanel from '../components/task/ActivityPanel';
import TaskTabActionItems from '../components/task/TaskTabActionItems';
import TaskDetailsHeader from "../components/task/TaskDetailsHeader";
import { Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';

const TaskDetailsPage = ({ onClose, taskId: propTaskId }) => {
    const params = useParams();
    const taskId = propTaskId || params.taskId;

    const [taskDetails, setTaskDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("details");
    const [activityRefreshKey, setActivityRefreshKey] = useState(0);

    const { updateTask, tasks, projects } = useProject();
    const activityPanelRef = useRef(null);
    const initialFetchDone = useRef(false);

    // Using centralized API_URL from http.js

    // Fetch task details - only depends on taskId and API_URL, NOT on tasks
    const fetchTaskDetails = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                setError("No authentication token found");
                setLoading(false);
                return;
            }

            const numericId = Number(taskId);
            const isTemporaryId = numericId > 1000000000000;

            if (isTemporaryId) {
                // For temp IDs, find task in context (use a ref to avoid dependency)
                const contextTask = tasks.find(t =>
                    t.id === numericId ||
                    t.id === taskId ||
                    String(t.id) === String(taskId)
                );

                if (contextTask) {
                    setTaskDetails(contextTask);
                    setLoading(false);
                    return;
                }

                setError("Task is still being saved. Please wait a moment and try again.");
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${API_URL}/tasks/details/${taskId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Task not found');
                }
                throw new Error(`Failed to fetch task details: ${response.status}`);
            }

            const data = await response.json();
            setTaskDetails(data);
        } catch (err) {
            console.error('Error fetching task:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [taskId, API_URL]); // Removed 'tasks' dependency to prevent refetch on context updates

    // Initial fetch only when taskId changes
    useEffect(() => {
        if (taskId && !initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchTaskDetails();
        } else if (taskId && initialFetchDone.current) {
            // TaskId changed, reset and fetch
            initialFetchDone.current = true;
            fetchTaskDetails();
        }
    }, [taskId, fetchTaskDetails]);

    // Reset the ref when taskId changes
    useEffect(() => {
        initialFetchDone.current = false;
    }, [taskId]);

    // Function to refresh only activities (not the whole task)
    const refreshActivities = useCallback(async () => {
        if (!taskId || Number(taskId) > 1000000000000) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(
                `${API_URL}/tasks/details/${taskId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                // Only update activities, preserve other local state
                setTaskDetails(prev => prev ? {
                    ...prev,
                    activities: data.activities || []
                } : data);
            }
        } catch (err) {
            console.error('Error refreshing activities:', err);
        }
    }, [taskId, API_URL]);

    // Full refresh function (for manual refresh button)
    const refreshTaskDetails = async () => {
        await fetchTaskDetails(false);
    };

    // Optimistic update handler
    const handleUpdate = useCallback(async (field, value) => {
        // Optimistic update - update local state immediately
        setTaskDetails(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });

        if (taskDetails && taskDetails.id) {
            const updates = { [field]: value };

            // Update context (which syncs to backend)
            await updateTask(taskDetails.id, updates);

            // Refresh activities after a short delay to let backend process
            setTimeout(() => {
                refreshActivities();
                setActivityRefreshKey(k => k + 1);
            }, 500);
        }
    }, [taskDetails, updateTask, refreshActivities]);

    const currentProject = taskDetails?.projectId
        ? projects.find(p => p.id === taskDetails.projectId)
        : null;

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
                    <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading task details...</span>
                </div>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    maxWidth: '400px',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertCircle size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontWeight: 600 }}>Error Loading Task</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{error}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button
                            onClick={fetchTaskDetails}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '0.5rem 1rem',
                                background: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={16} /> Retry
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!taskDetails) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#6b7280' }}>Task not found</p>
                    {onClose && (
                        <button onClick={onClose} style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            Close
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '2rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                height: '90vh',
                background: 'white',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                <TaskDetailsHeader
                    task={taskDetails}
                    project={currentProject}
                    onClose={onClose}
                />

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left Panel (65%) - Main Content */}
                    <div style={{
                        width: '65%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <TaskDetailsMain
                            task={taskDetails}
                            onUpdate={handleUpdate}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onTaskRefresh={refreshTaskDetails}
                        />

                        {activeTab === 'actionItems' && (
                            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                                <TaskTabActionItems
                                    taskId={taskId}
                                    task={taskDetails}
                                    onTaskRefresh={refreshTaskDetails}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Panel (35%) - Activity */}
                    <div style={{
                        width: '35%',
                        borderLeft: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <ActivityPanel
                            task={taskDetails}
                            onUpdate={handleUpdate}
                            onTaskRefresh={refreshTaskDetails}
                            refreshKey={activityRefreshKey}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsPage;
