import React from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const ActivityFeed = ({ events = [], tasks = [] }) => {
    // Derived deadlines from tasks
    const upcomingDeadlines = tasks
        .filter(t => t.dueDate && t.status !== 'Done')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5); // Top 5 upcoming

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-500';
            case 'critical': return 'text-red-600 font-bold';
            case 'medium': return 'text-amber-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Recent Activity */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={18} className="text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-700">Recent Activity</h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {events.length > 0 ? (
                        <div className="space-y-4">
                            {events.map((event, i) => (
                                <div key={event.id || i} className="flex gap-3 text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium">{event.description || event.title}</p>
                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            {new Date(event.createdAt || Date.now()).toLocaleDateString()}
                                            <span>•</span>
                                            {new Date(event.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm italic">No recent activity</p>
                    )}
                </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={18} className="text-amber-500" />
                    <h3 className="text-lg font-semibold text-gray-700">Upcoming Deadlines</h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {upcomingDeadlines.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingDeadlines.map((task, i) => {
                                const isOverdue = new Date(task.dueDate) < new Date();
                                return (
                                    <div key={task.id || i} className={`p-3 rounded-md border ${isOverdue ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'} flex items-center justify-between`}>
                                        <div className="flex items-start gap-3 overflow-hidden">
                                            <div className={`mt-1 ${getPriorityColor(task.priority)}`}>
                                                <Calendar size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                                                <p className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                                                    {isOverdue ? 'Overdue: ' : 'Due: '}
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded-full ${isOverdue ? 'bg-red-200 text-red-700' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                            {task.priority || 'Normal'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <CheckCircle size={24} className="mb-2 opacity-50" />
                            <p className="text-sm">No upcoming deadlines!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
