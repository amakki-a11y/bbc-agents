import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { http } from '../api/http';
import {
    CheckSquare, Clock, Users, Calendar, Plus, ArrowRight,
    CheckCircle2, AlertCircle, Bell, FileText, UserCheck, LogIn, Target,
    Zap, Activity, Sparkles
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
            const tasksRes = await http.get('/tasks');
            const tasks = tasksRes.data || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const tasksDueToday = tasks.filter(t => {
                if (!t.due_date) return false;
                const dueDate = new Date(t.due_date);
                return dueDate >= today && dueDate < tomorrow && t.status !== 'done';
            }).length;

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

            try {
                const attendanceRes = await http.get('/attendance/me/today');
                setAttendanceStatus(attendanceRes.data);
            } catch {
                // Attendance data not available
            }

            try {
                const employeesRes = await http.get('/employees?limit=1');
                const total = employeesRes.data?.pagination?.total || 0;
                setStats(prev => ({ ...prev, teamMembers: total }));
            } catch {
                // Employee data not available
            }

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
            await http.post('/attendance/check-in');
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
            case 'urgent': return 'var(--danger)';
            case 'high': return 'var(--warning)';
            case 'medium': return 'var(--primary)';
            case 'low': return 'var(--success)';
            default: return 'var(--text-muted)';
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'task_completed': return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
            case 'check_in': return <LogIn size={16} style={{ color: 'var(--primary)' }} />;
            case 'task_assigned': return <FileText size={16} style={{ color: 'var(--primary-light)' }} />;
            default: return <Bell size={16} style={{ color: 'var(--text-muted)' }} />;
        }
    };

    // Modern Stat Card Component
    const StatCard = ({ icon: Icon, label, value, gradient, delay }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                className="animate-fadeInUp card-modern hover-lift"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    cursor: 'default',
                    animationDelay: delay
                }}
            >
                <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'scale(1.05) rotate(-3deg)' : 'scale(1) rotate(0deg)'
                }}>
                    <Icon size={24} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                        marginBottom: '0.25rem'
                    }}>
                        {value}
                    </div>
                    <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                    }}>
                        {label}
                    </div>
                </div>
            </div>
        );
    };

    // Quick Action Button Component
    const QuickActionButton = ({ icon: Icon, label, onClick, gradient, hoverGradient }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.25rem 1rem',
                    background: isHovered ? hoverGradient : gradient,
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: isHovered ? '0 12px 24px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <Icon size={26} />
                {label}
            </button>
        );
    };

    if (loading) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-secondary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin" style={{
                        width: 48,
                        height: 48,
                        border: '4px solid var(--border-color)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem'
                    }} />
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="scrollbar-modern" style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            padding: '2rem',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                {/* Welcome Header Card */}
                <div className="animate-fadeInUp" style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    marginBottom: '2rem',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)'
                }}>
                    {/* Decorative Elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-40px',
                        right: '-40px',
                        width: '180px',
                        height: '180px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        animation: 'float 6s ease-in-out infinite'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        right: '100px',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        animation: 'float 8s ease-in-out infinite reverse'
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '30px',
                        right: '200px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        animation: 'float 5s ease-in-out infinite'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1rem'
                        }}>
                            <Sparkles size={24} style={{ opacity: 0.9 }} />
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                opacity: 0.9,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {formatDate()}
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            marginBottom: '0.5rem',
                            margin: 0,
                            lineHeight: 1.2
                        }}>
                            {getGreeting()}, {user?.username || user?.email?.split('@')[0] || 'there'}!
                        </h1>
                        <p style={{
                            opacity: 0.85,
                            fontSize: '1rem',
                            margin: '0.75rem 0 0',
                            maxWidth: '500px'
                        }}>
                            Here&apos;s what&apos;s happening with your workspace today. Let&apos;s make it productive!
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                }}>
                    <StatCard
                        icon={CheckSquare}
                        label="Tasks Due Today"
                        value={stats.tasksDueToday}
                        gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        delay="0ms"
                    />
                    <StatCard
                        icon={AlertCircle}
                        label="Pending Approvals"
                        value={stats.pendingApprovals}
                        gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        delay="100ms"
                    />
                    <StatCard
                        icon={Activity}
                        label="Attendance Rate"
                        value={`${stats.attendanceRate}%`}
                        gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        delay="200ms"
                    />
                    <StatCard
                        icon={Users}
                        label="Team Members"
                        value={stats.teamMembers}
                        gradient="linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)"
                        delay="300ms"
                    />
                </div>

                {/* Main Content Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: '1.5rem'
                }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Tasks Card */}
                        <div className="card-modern animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                            <div style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <CheckSquare size={18} color="white" />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            My Tasks
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {upcomingTasks.length} tasks pending
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/projects/1'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'var(--bg-tertiary)',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        color: 'var(--primary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--primary-bg)';
                                        e.currentTarget.style.gap = '10px';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                                        e.currentTarget.style.gap = '6px';
                                    }}
                                >
                                    View All <ArrowRight size={14} />
                                </button>
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                                {upcomingTasks.length > 0 ? upcomingTasks.map((task, idx) => (
                                    <div
                                        key={task.id}
                                        className="animate-fadeInUp"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            animationDelay: `${idx * 50}ms`
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '6px',
                                            border: `2px solid ${getPriorityColor(task.priority)}`,
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {task.title}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {task.priority && (
                                                <span className="badge-modern" style={{
                                                    background: `${getPriorityColor(task.priority)}15`,
                                                    color: getPriorityColor(task.priority),
                                                    textTransform: 'capitalize',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                color: formatDueDate(task.due_date) === 'Overdue' ? 'var(--danger)' :
                                                       formatDueDate(task.due_date) === 'Today' ? 'var(--warning)' : 'var(--text-secondary)'
                                            }}>
                                                {formatDueDate(task.due_date)}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{
                                        padding: '3rem',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <CheckCircle2 size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                                        <p style={{ margin: 0, fontWeight: 500 }}>All caught up!</p>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>No tasks due soon</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Card */}
                        <div className="card-modern animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                            <div style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg, var(--primary-light) 0%, #a855f7 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Activity size={18} color="white" />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Recent Activity
                                </h2>
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                                {recentActivity.map((activity, idx) => (
                                    <div
                                        key={activity.id}
                                        className="animate-fadeInUp"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            animationDelay: `${idx * 50}ms`
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'var(--bg-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {activity.message}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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
                        <div className="card-modern animate-fadeInUp" style={{
                            padding: '1.5rem',
                            animationDelay: '150ms'
                        }}>
                            <h2 style={{
                                margin: '0 0 1.25rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Zap size={18} style={{ color: 'var(--warning)' }} />
                                Quick Actions
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.875rem'
                            }}>
                                {!attendanceStatus?.check_in && (
                                    <QuickActionButton
                                        icon={Clock}
                                        label="Check In"
                                        onClick={handleCheckIn}
                                        gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                                        hoverGradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                                    />
                                )}
                                <QuickActionButton
                                    icon={Plus}
                                    label="New Task"
                                    onClick={() => window.location.href = '/projects/1'}
                                    gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                    hoverGradient="linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                                />
                                <QuickActionButton
                                    icon={Calendar}
                                    label="Calendar"
                                    onClick={() => window.location.href = '/calendar'}
                                    gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                                    hoverGradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
                                />
                                <QuickActionButton
                                    icon={Target}
                                    label="Goals"
                                    onClick={() => window.location.href = '/goals'}
                                    gradient="linear-gradient(135deg, #ec4899 0%, #f472b6 100%)"
                                    hoverGradient="linear-gradient(135deg, #db2777 0%, #ec4899 100%)"
                                />
                            </div>
                        </div>

                        {/* Attendance Card */}
                        <div className="card-modern animate-fadeInUp" style={{
                            padding: '1.5rem',
                            animationDelay: '250ms'
                        }}>
                            <h2 style={{
                                margin: '0 0 1rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)'
                            }}>
                                Today&apos;s Attendance
                            </h2>
                            {attendanceStatus ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1.25rem',
                                    background: attendanceStatus.check_in
                                        ? 'var(--success-bg)'
                                        : 'var(--danger-bg)',
                                    borderRadius: '14px',
                                    border: attendanceStatus.check_in
                                        ? '1px solid var(--success)'
                                        : '1px solid var(--danger)'
                                }}>
                                    <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '14px',
                                        background: attendanceStatus.check_in
                                            ? 'linear-gradient(135deg, var(--success) 0%, #34d399 100%)'
                                            : 'linear-gradient(135deg, var(--danger) 0%, #f87171 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: attendanceStatus.check_in
                                            ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                                            : '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}>
                                        {attendanceStatus.check_in ? (
                                            <UserCheck size={24} style={{ color: 'white' }} />
                                        ) : (
                                            <Clock size={24} style={{ color: 'white' }} />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: attendanceStatus.check_in ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {attendanceStatus.check_in ? 'Checked In' : 'Not Checked In'}
                                        </div>
                                        {attendanceStatus.check_in && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '2px' }}>
                                                at {new Date(attendanceStatus.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1.5rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '14px',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontWeight: 500 }}>No attendance data</p>
                                </div>
                            )}
                        </div>

                        {/* Team Updates */}
                        <div className="card-modern animate-fadeInUp" style={{
                            padding: '1.5rem',
                            animationDelay: '350ms'
                        }}>
                            <h2 style={{
                                margin: '0 0 1rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)'
                            }}>
                                Team Updates
                            </h2>
                            <div style={{
                                padding: '2rem 1rem',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-secondary)',
                                borderRadius: '14px'
                            }}>
                                <Bell size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontWeight: 500 }}>No new updates</p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Check back later</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
