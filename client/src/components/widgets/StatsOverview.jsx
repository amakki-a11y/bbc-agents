import React from 'react';
import { CheckCircle2, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {subtext && (
                <p className={`text-xs mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
                    {trend === 'up' && <TrendingUp size={12} />}
                    {subtext}
                </p>
            )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
    </div>
);

const StatsOverview = ({ tasks = [] }) => {
    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks due today or overdue
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length;

    // Tasks completed this week (simple mock logic for "this week" vs "last week" if no exact dates on completion)
    // Assuming createdAt is close to completion or we just use current status count for now as a simpler proxy
    // For a real app, we'd check `completedAt` timestamp.
    const activeTasks = tasks.filter(t => t.status === 'In Progress').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="Total Completed"
                value={completedTasks}
                subtext={`${completionRate}% completion rate`}
                trend="up"
                icon={CheckCircle2}
                color="bg-green-500"
            />
            <StatCard
                title="Active Tasks"
                value={activeTasks}
                subtext="Currently in progress"
                icon={Clock}
                color="bg-blue-500"
            />
            <StatCard
                title="Productivity Score"
                value={`${completionRate * 10}`}
                subtext="Based on activity"
                trend="up"
                icon={TrendingUp}
                color="bg-purple-500"
            />
            <StatCard
                title="Overdue"
                value={overdueTasks}
                subtext="Requires attention"
                trend={overdueTasks > 0 ? 'down' : 'neutral'}
                icon={AlertTriangle}
                color="bg-red-500"
            />
        </div>
    );
};

export default StatsOverview;
