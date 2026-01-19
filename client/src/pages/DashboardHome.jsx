import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { http } from '../api/http';
import {
    CheckSquare, Clock, Users, TrendingUp, Calendar, Plus, ArrowRight,
    CheckCircle2, AlertCircle, Bell, FileText, UserCheck, LogIn
} from 'lucide-react';

const DashboardHome = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState({
        tasksDueToday: 0,
        pendingApprovals: 0,
        attendanceRate: 0,
        teamMembers: 0
    });
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        }
    }, [token]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch tasks
            const tasksRes = await http.get('/api/tasks');
            const tasks = tasksRes.data || [];

            // Calculate tasks due today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const tasksDueToday = tasks.filter(t => {
                if (!t.due_date) return false;
                const dueDate = new Date(t.due_date);
                return dueDate >= today && dueDate < tomorrow && t.status !== 'done';
            }).length;

            // Get upcoming tasks (not done, sorted by due date)
            const upcoming = tasks
                .filter(t => t.status !== 'done')
                .sort((a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date) - new Date(b.due_date);
                })
                .slice(0, 5);

            setUpcomingTasks(upcoming);
            setStats(prev => ({ ...prev, tasksDueToday }));

            // Try to fetch attendance data
            try {
                const attendanceRes = await http.get('/api/attendance/me/today');
                setAttendanceStatus(attendanceRes.data);
            } catch (e) {
                // User may not have employee profile
            }

            // Try to fetch employee count
            try {
                const employeesRes = await http.get('/api/employees?limit=1');
                const total = employeesRes.data?.pagination?.total || 0;
                setStats(prev => ({ ...prev, teamMembers: total }));
            } catch (e) {
                // May not have permission
            }

            // Mock recent activity (in real app, fetch from API)
            setRecentActivity([
                { id: 1, type: 'task_completed', message: 'Completed "Review design specs"', time: '2 hours ago' },
                { id: 2, type: 'check_in', message: 'Checked in at 9:00 AM', time: '5 hours ago' },
                { id: 3, type: 'task_assigned', message: 'New task assigned: API Integration', time: 'Yesterday' }
            ]);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await http.post('/api/attendance/check-in');
            fetchDashboardData();
        } catch (error) {
            console.error('Check-in failed:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDueDate = (dateStr) => {
        if (!dateStr) return 'No due date';
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) return 'Today';
        if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
        if (date < today) return 'Overdue';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#2563eb';
            case 'low': return '#16a34a';
            default: return '#6b7280';
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'task_completed': return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
            case 'check_in': return <LogIn size={16} style={{ color: '#3b82f6' }} />;
            case 'task_assigned': return <FileText size={16} style={{ color: '#8b5cf6' }} />;
            default: return <Bell size={16} style={{ color: '#6b7280' }} />;
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, bgColor }) => {
        const [isHovered, setIsHovered] = useState(false);
        return (
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: isHovered
                        ? '0 10px 25px rgba(0,0,0,0.1)'
                        : '0 1px 3px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderLeft: `4px solid ${color}`,
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    cursor: 'default'
                }}
            >
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}>
                    <Icon size={24} style={{ color }} />
                </div>
                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                        {value}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {label}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb'
            }}>
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            background: '#f9fafb',
            padding: '2rem',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Welcome Header with Gradient Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #7b68ee 0%, #6366f1 50%, #8b5cf6 100%)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(123, 104, 238, 0.3)'
                }}>
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute',
                        top: '-30px',
                        right: '-30px',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-20px',
                        right: '80px',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)'
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            margin: 0
                        }}>
                            {getGreeting()}, {user?.username || user?.email?.split('@')[0] || 'there'}!
                        </h1>
                        <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: '0.5rem 0 0' }}>
                            {formatDate()}
                        </p>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                }}>
                    <StatCard
                        icon={CheckSquare}
                        label="Tasks Due Today"
                        value={stats.tasksDueToday}
                        color="#7b68ee"
                        bgColor="#f0edff"
                    />
                    <StatCard
                        icon={AlertCircle}
                        label="Pending Approvals"
                        value={stats.pendingApprovals}
                        color="#f59e0b"
                        bgColor="#fef3c7"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Attendance Rate"
                        value={`${stats.attendanceRate}%`}
                        color="#10b981"
                        bgColor="#ecfdf5"
                    />
                    <StatCard
                        icon={Users}
                        label="Team Members"
                        value={stats.teamMembers}
                        color="#7b68ee"
                        bgColor="#f0edff"
                    />
                </div>

                {/* Two Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 400px',
                    gap: '1.5rem'
                }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* My Tasks */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                padding: '1.25rem',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#1f2937'
                                }}>
                                    My Tasks (Due Soon)
                                </h2>
                                <button
                                    onClick={() => window.location.href = '/projects/1'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#7b68ee',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#6366f1';
                                        e.currentTarget.style.gap = '6px';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#7b68ee';
                                        e.currentTarget.style.gap = '4px';
                                    }}
                                >
                                    View All <ArrowRight size={14} />
                                </button>
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                                {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                                    <div
                                        key={task.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.875rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: '2px solid #d1d5db',
                                            flexShrink: 0
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                                color: '#1f2937',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {task.title}
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem'
                                        }}>
                                            {task.priority && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    color: getPriorityColor(task.priority),
                                                    background: `${getPriorityColor(task.priority)}10`,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: formatDueDate(task.due_date) === 'Overdue' ? '#dc2626' :
                                                       formatDueDate(task.due_date) === 'Today' ? '#d97706' : '#6b7280'
                                            }}>
                                                {formatDueDate(task.due_date)}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        color: '#9ca3af'
                                    }}>
                                        <CheckCircle2 size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>No upcoming tasks</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                padding: '1.25rem',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#1f2937'
                                }}>
                                    Recent Activity
                                </h2>
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                                {recentActivity.map(activity => (
                                    <div
                                        key={activity.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.875rem'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: '#f3f4f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: '#374151'
                                            }}>
                                                {activity.message}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: '#9ca3af'
                                            }}>
                                                {activity.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Quick Actions */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '1.25rem'
                        }}>
                            <h2 style={{
                                margin: '0 0 1rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#1f2937'
                            }}>
                                Quick Actions
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem'
                            }}>
                                {!attendanceStatus?.check_in && (
                                    <button
                                        onClick={handleCheckIn}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '1rem',
                                            background: '#ecfdf5',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            color: '#16a34a',
                                            fontWeight: 500,
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#d1fae5';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#ecfdf5';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <Clock size={24} />
                                        Check In
                                    </button>
                                )}
                                <button
                                    onClick={() => window.location.href = '/projects/1'}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        background: '#f0edff',
                                        border: '1px solid #d4ccff',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        color: '#7b68ee',
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#e8e3ff';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#f0edff';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Plus size={24} />
                                    New Task
                                </button>
                                <button
                                    onClick={() => window.location.href = '/attendance'}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        background: '#fef3c7',
                                        border: '1px solid #fcd34d',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        color: '#d97706',
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#fde68a';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#fef3c7';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Calendar size={24} />
                                    View Calendar
                                </button>
                                <button
                                    onClick={() => window.location.href = '/employees'}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        background: '#f0edff',
                                        border: '1px solid #d4ccff',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        color: '#7b68ee',
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#e8e3ff';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#f0edff';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Users size={24} />
                                    Team
                                </button>
                            </div>
                        </div>

                        {/* Attendance Status */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '1.25rem'
                        }}>
                            <h2 style={{
                                margin: '0 0 1rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#1f2937'
                            }}>
                                Today's Attendance
                            </h2>
                            {attendanceStatus ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: attendanceStatus.check_in ? '#ecfdf5' : '#fef2f2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {attendanceStatus.check_in ? (
                                            <UserCheck size={24} style={{ color: '#16a34a' }} />
                                        ) : (
                                            <Clock size={24} style={{ color: '#dc2626' }} />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: '#1f2937'
                                        }}>
                                            {attendanceStatus.check_in ? 'Checked In' : 'Not Checked In'}
                                        </div>
                                        {attendanceStatus.check_in && (
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#6b7280'
                                            }}>
                                                at {new Date(attendanceStatus.check_in).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    color: '#6b7280',
                                    fontSize: '0.875rem'
                                }}>
                                    No attendance data available
                                </div>
                            )}
                        </div>

                        {/* Team Updates */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '1.25rem'
                        }}>
                            <h2 style={{
                                margin: '0 0 1rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#1f2937'
                            }}>
                                Team Updates
                            </h2>
                            <div style={{
                                padding: '2rem 1rem',
                                textAlign: 'center',
                                color: '#9ca3af'
                            }}>
                                <Bell size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>No new updates</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
