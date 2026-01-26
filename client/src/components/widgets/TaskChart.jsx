import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const TaskChart = ({ tasks }) => {
    const statusData = useMemo(() => {
        const counts = { Todo: 0, 'In Progress': 0, Done: 0, Review: 0 };
        tasks.forEach(task => {
            const status = task.status || 'Todo';
            if (counts[status] !== undefined) {
                counts[status]++;
            } else {
                counts[status] = (counts[status] || 0) + 1;
            }
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(item => item.value > 0);
    }, [tasks]);

    const priorityData = useMemo(() => {
        const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
        tasks.forEach(task => {
            const priority = task.priority || 'Medium';
            if (counts[priority] !== undefined) {
                counts[priority]++;
            }
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [tasks]);

    if (!tasks || tasks.length === 0) {
        return <div className="p-4 text-center text-gray-500">No data available for visualization</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Task Status Distribution</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Tasks by Priority</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={priorityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default TaskChart;
