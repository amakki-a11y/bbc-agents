import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, User, Briefcase, Clock } from 'lucide-react';
import { http } from '../api/http';
import BotChat from '../components/bot/BotChat';

const BotPage = () => {
    const navigate = useNavigate();
    const [context, setContext] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContext();
    }, []);

    const loadContext = async () => {
        try {
            const response = await http.get('/api/bot/context');
            setContext(response.data);
        } catch (err) {
            console.error('Failed to load context:', err);
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = {
        display: 'flex',
        height: '100vh',
        backgroundColor: 'var(--bg-dark)'
    };

    const sidebarStyle = {
        width: '300px',
        backgroundColor: 'white',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
    };

    const headerStyle = {
        padding: '20px',
        borderBottom: '1px solid var(--border)'
    };

    const backButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        marginBottom: '16px',
        padding: '8px 12px',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
    };

    const profileCardStyle = {
        padding: '16px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    };

    const avatarStyle = {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
    };

    const infoSectionStyle = {
        flex: 1,
        padding: '20px',
        overflowY: 'auto'
    };

    const infoCardStyle = {
        padding: '16px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        marginBottom: '16px'
    };

    const infoTitleStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-main)',
        marginBottom: '12px'
    };

    const statRowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid var(--border)'
    };

    const chatContainerStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: 'var(--text-muted)'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {/* Sidebar with context info */}
            <div style={sidebarStyle}>
                <div style={headerStyle}>
                    <button
                        onClick={() => navigate('/')}
                        style={backButtonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>

                    {context && (
                        <div style={profileCardStyle}>
                            <div style={avatarStyle}>
                                <User size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                    {context.employee.name}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {context.role.name} - {context.department.name}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={infoSectionStyle}>
                    {context && (
                        <>
                            {/* Tasks Summary */}
                            <div style={infoCardStyle}>
                                <div style={infoTitleStyle}>
                                    <Briefcase size={16} />
                                    Pending Tasks
                                </div>
                                {context.tasks.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                        No pending tasks
                                    </div>
                                ) : (
                                    <div>
                                        {context.tasks.slice(0, 5).map(task => (
                                            <div key={task.id} style={{
                                                padding: '8px 0',
                                                borderBottom: '1px solid var(--border)',
                                                fontSize: '13px'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        color: 'var(--text-main)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '180px'
                                                    }}>
                                                        {task.title}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        backgroundColor: task.priority === 'high' ? '#fff5f5' : '#f0f0f0',
                                                        color: task.priority === 'high' ? 'var(--danger)' : 'var(--text-muted)'
                                                    }}>
                                                        {task.priority || 'medium'}
                                                    </span>
                                                </div>
                                                {task.due_date && (
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {context.tasks.length > 5 && (
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'var(--primary)',
                                                marginTop: '8px',
                                                fontWeight: '500'
                                            }}>
                                                +{context.tasks.length - 5} more tasks
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Attendance Summary */}
                            <div style={infoCardStyle}>
                                <div style={infoTitleStyle}>
                                    <Clock size={16} />
                                    This Week's Attendance
                                </div>
                                {context.attendance.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                        No attendance records
                                    </div>
                                ) : (
                                    <div>
                                        <div style={statRowStyle}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Present</span>
                                            <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                                                {context.attendance.filter(a => a.status === 'present').length}
                                            </span>
                                        </div>
                                        <div style={statRowStyle}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Late</span>
                                            <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                                                {context.attendance.filter(a => a.status === 'late').length}
                                            </span>
                                        </div>
                                        <div style={{ ...statRowStyle, borderBottom: 'none' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Absent</span>
                                            <span style={{ fontWeight: '600', color: 'var(--danger)' }}>
                                                {context.attendance.filter(a => a.status === 'absent').length}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Manager Info */}
                            {context.manager && (
                                <div style={infoCardStyle}>
                                    <div style={infoTitleStyle}>
                                        <User size={16} />
                                        Your Manager
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                                        {context.manager.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {context.manager.email}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={chatContainerStyle}>
                <BotChat isFullPage={true} />
            </div>
        </div>
    );
};

export default BotPage;
