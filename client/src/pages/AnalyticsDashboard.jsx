import { useState, useEffect } from 'react';
import { http } from '../api/http';
import StatsOverview from '../components/widgets/StatsOverview';
import TaskChart from '../components/widgets/TaskChart';
import ActivityFeed from '../components/widgets/ActivityFeed';
import QuickAdd from '../components/widgets/QuickAdd';
import { Layout, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AnalyticsDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch tasks and events in parallel
            const [tasksRes, eventsRes] = await Promise.all([
                http.get('/api/tasks'),
                http.get('/api/events').catch(() => ({ data: [] })) // Events may not exist
            ]);
            setTasks(tasksRes.data || []);
            setEvents(eventsRes.data || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTaskAdded = (newTask) => {
        // Optimistic update or refetch
        setTasks(prev => [newTask, ...prev]);
        // Also could trigger a full refresh to get events updated
        fetchData();
    };

    if (isLoading && tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-6 custom-scrollbar">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Layout className="text-blue-600" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Overview of your productivity and project status.
                        <span className="text-gray-400 ml-2">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-all"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="w-64">
                        <QuickAdd onTaskAdded={handleTaskAdded} />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview tasks={tasks} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                {/* Left Column (2/3 width) - Charts */}
                <div className="xl:col-span-2 space-y-6">
                    <TaskChart tasks={tasks} />
                </div>

                {/* Right Column (1/3 width) - Activity Feed */}
                <div className="xl:col-span-1 h-[600px] xl:h-auto">
                    <ActivityFeed events={events} tasks={tasks} />
                </div>
            </div>
        </div>
    );
};

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
