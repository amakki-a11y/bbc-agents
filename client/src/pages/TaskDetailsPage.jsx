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
    const [activeTab, setActiveTab] = useState("details");

    // We need updateTask from context to pass to children
    const { updateTask } = useProject();

    const fetchTaskDetails = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.error("No token found");
                setLoading(false);
                return;
            }
            const response = await fetch(
                `http://localhost:3000/api/tasks/details/${taskId}`, // Fix port 5000 -> 3000
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch task details');

            const data = await response.json();
            setTaskDetails(data);
        } catch (error) {
            console.error('Error fetching task:', error);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

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
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!taskDetails) return <div>Task not found</div>;

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Add Header back if it was intended to be there */}
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

                    {/* Render Action Items here as per your manual refactor structure */}
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
                        task={taskDetails} // ActivityPanel expects 'task' prop based on previous files, user changed to 'activities' but let's check
                        onUpdate={handleUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsPage;