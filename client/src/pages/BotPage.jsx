import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Bot, User, Clock, ListTodo, Calendar, MessageSquare,
    Settings, Trash2, ChevronRight, Briefcase, Send, CheckCircle2,
    Sparkles, FileText, Users, Bell
} from 'lucide-react';
import { http } from '../api/http';
import BotChat from '../components/bot/BotChat';

const COMMAND_CATEGORIES = [
    {
        name: 'Tasks',
        icon: ListTodo,
        color: '#3b82f6',
        bgColor: '#eff6ff',
        commands: [
            { label: 'Show my tasks', command: 'show my tasks' },
            { label: 'Create a task', command: 'create a task' },
            { label: 'Tasks due today', command: 'tasks due today' },
            { label: 'Overdue tasks', command: 'show overdue tasks' }
        ]
    },
    {
        name: 'Attendance',
        icon: Clock,
        color: '#10b981',
        bgColor: '#ecfdf5',
        commands: [
            { label: 'Check in', command: 'check in' },
            { label: 'Check out', command: 'check out' },
            { label: 'My attendance', command: 'show my attendance' },
            { label: 'Request leave', command: 'request leave' }
        ]
    },
    {
        name: 'Communication',
        icon: MessageSquare,
        color: '#8b5cf6',
        bgColor: '#f5f3ff',
        commands: [
            { label: 'Send message', command: 'send message to' },
            { label: 'My team', command: 'show my team' },
            { label: 'Contact manager', command: 'contact my manager' },
            { label: 'Help', command: 'help' }
        ]
    }
];

const CommandCategory = ({ category, onSelectCommand, expandedCategory, onToggleExpand }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isExpanded = expandedCategory === category.name;
    const Icon = category.icon;

    return (
        <div style={{
            marginBottom: '12px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            background: 'white',
            transition: 'all 0.2s'
        }}>
            <button
                onClick={() => onToggleExpand(category.name)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: isHovered ? '#fafafa' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: category.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Icon size={18} style={{ color: category.color }} />
                    </div>
                    <span style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: '#1f2937'
                    }}>
                        {category.name}
                    </span>
                </div>
                <ChevronRight
                    size={16}
                    style={{
                        color: '#9ca3af',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}
                />
            </button>

            {isExpanded && (
                <div style={{
                    borderTop: '1px solid #f3f4f6',
                    padding: '8px',
                    animation: 'slideDown 0.2s ease'
                }}>
                    {category.commands.map((cmd) => (
                        <button
                            key={cmd.command}
                            onClick={() => onSelectCommand(cmd.command)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#4b5563',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = category.bgColor;
                                e.currentTarget.style.color = category.color;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#4b5563';
                            }}
                        >
                            <Send size={12} />
                            {cmd.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const RecentConversation = ({ conversation, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px',
                background: isHovered ? '#f9fafb' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s'
            }}
        >
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <MessageSquare size={14} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {conversation.preview}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginTop: '2px'
                }}>
                    {conversation.time}
                </div>
            </div>
        </button>
    );
};

const BotPage = () => {
    const navigate = useNavigate();
    const [context, setContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState('Tasks');
    const [recentConversations, setRecentConversations] = useState([]);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [selectedCommand, setSelectedCommand] = useState(null);

    useEffect(() => {
        loadContext();
        loadRecentConversations();
    }, []);

    const loadContext = async () => {
        try {
            const response = await http.get('/bot/context');
            setContext(response.data);
        } catch (err) {
            console.error('Failed to load context:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentConversations = async () => {
        try {
            const response = await http.get('/bot/history?limit=10');
            const messages = response.data || [];
            const userMessages = messages
                .filter(m => m.sender === 'employee')
                .slice(0, 5)
                .map(m => ({
                    id: m.id,
                    preview: m.content.length > 40 ? m.content.substring(0, 40) + '...' : m.content,
                    time: formatTime(m.created_at)
                }));
            setRecentConversations(userMessages);
        } catch (err) {
            console.error('Failed to load recent conversations:', err);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const handleToggleExpand = (categoryName) => {
        setExpandedCategory(prev => prev === categoryName ? null : categoryName);
    };

    const handleSelectCommand = (command) => {
        setSelectedCommand(command);
        setShowMobileSidebar(false);
    };

    const handleClearHistory = async () => {
        if (!window.confirm('Are you sure you want to clear your chat history?')) return;
        try {
            await http.delete('/bot/history');
            setRecentConversations([]);
            window.location.reload();
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#f9fafb'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#7c3aed',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: '#f9fafb'
        }}>
            {/* Page Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'white',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(123, 104, 238, 0.25)'
                        }}>
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#1f2937'
                            }}>
                                AI Assistant
                            </h1>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '2px'
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    boxShadow: '0 0 6px #10b981'
                                }} />
                                <span style={{
                                    fontSize: '13px',
                                    color: '#10b981',
                                    fontWeight: 500
                                }}>
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Mobile sidebar toggle */}
                    <button
                        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                        style={{
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                        className="mobile-sidebar-toggle"
                    >
                        <Sparkles size={18} />
                    </button>

                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden'
            }}>
                {/* Chat Area - 70% */}
                <div style={{
                    flex: '1 1 70%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'white',
                    borderRight: '1px solid #e5e7eb'
                }}>
                    <BotChat isFullPage={true} initialCommand={selectedCommand} />
                </div>

                {/* Sidebar - 30% */}
                <aside
                    className={`sidebar ${showMobileSidebar ? 'show' : ''}`}
                    style={{
                        width: '320px',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#fafafa',
                        overflow: 'hidden'
                    }}
                >
                    {/* Suggested Commands */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <Sparkles size={16} style={{ color: '#7c3aed' }} />
                            <h2 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Suggested Commands
                            </h2>
                        </div>

                        {COMMAND_CATEGORIES.map((category) => (
                            <CommandCategory
                                key={category.name}
                                category={category}
                                expandedCategory={expandedCategory}
                                onToggleExpand={handleToggleExpand}
                                onSelectCommand={handleSelectCommand}
                            />
                        ))}

                        {/* Recent Conversations */}
                        <div style={{
                            marginTop: '24px',
                            paddingTop: '20px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Clock size={16} style={{ color: '#6b7280' }} />
                                    <h2 style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Recent
                                    </h2>
                                </div>
                                {recentConversations.length > 0 && (
                                    <button
                                        onClick={handleClearHistory}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#fee2e2';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#9ca3af';
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        Clear
                                    </button>
                                )}
                            </div>

                            {recentConversations.length === 0 ? (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                    fontSize: '13px'
                                }}>
                                    No recent conversations
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    {recentConversations.map((conv) => (
                                        <RecentConversation
                                            key={conv.id}
                                            conversation={conv}
                                            onClick={() => handleSelectCommand(conv.preview.replace('...', ''))}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Context Card */}
                        {context && (
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            color: '#1f2937'
                                        }}>
                                            {context.employee?.name || 'User'}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280'
                                        }}>
                                            {context.role?.name || 'Employee'} - {context.department?.name || 'Department'}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px'
                                }}>
                                    <div style={{
                                        padding: '10px 12px',
                                        background: '#eff6ff',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#3b82f6'
                                        }}>
                                            {context.tasks?.length || 0}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#6b7280',
                                            marginTop: '2px'
                                        }}>
                                            Pending Tasks
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '10px 12px',
                                        background: '#ecfdf5',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#10b981'
                                        }}>
                                            {context.attendance?.filter(a => a.status === 'present').length || 0}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#6b7280',
                                            marginTop: '2px'
                                        }}>
                                            Days Present
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Mobile Overlay */}
            {showMobileSidebar && (
                <div
                    onClick={() => setShowMobileSidebar(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 40
                    }}
                    className="mobile-overlay"
                />
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Custom Scrollbar */
                aside::-webkit-scrollbar {
                    width: 6px;
                }

                aside::-webkit-scrollbar-track {
                    background: transparent;
                }

                aside::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }

                aside::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .mobile-sidebar-toggle {
                        display: flex !important;
                    }

                    .sidebar {
                        position: fixed;
                        top: 0;
                        right: -320px;
                        height: 100vh;
                        z-index: 50;
                        transition: right 0.3s ease;
                        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
                    }

                    .sidebar.show {
                        right: 0;
                    }

                    .mobile-overlay {
                        display: block;
                    }
                }

                @media (min-width: 769px) {
                    .mobile-overlay {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default BotPage;
