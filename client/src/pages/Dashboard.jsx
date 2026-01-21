import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Search, UserPlus, Copy,
    ChevronDown, Folder, LayoutDashboard, Calendar, HelpCircle, TrendingUp, Bot,
    Users, Building2, Clock, GitBranch, Shield, LogOut, Settings, User, Inbox, Plus, MoreHorizontal, Archive, Trash2, Edit3,
    CalendarOff, Target, Sparkles, X, Activity, PanelLeftClose, PanelLeft, Sun, Moon
} from 'lucide-react';
import { http } from '../api/http';
import NotificationBell from '../components/NotificationBell';
import BotButton from '../components/bot/BotButton';
import DashboardHome from './DashboardHome';

// Modern NavItem component with dark theme
const NavItem = ({ icon: Icon, label, href, badge, collapsed }) => {
    const isActive = window.location.pathname === href;

    return (
        <div
            onClick={() => window.location.href = href}
            className={`sidebar-modern-item ${isActive ? 'active' : ''}`}
            title={collapsed ? label : undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: collapsed ? 0 : '0.75rem',
                padding: collapsed ? '0.7rem' : '0.7rem 0.875rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </div>
            {badge > 0 && !collapsed && (
                <span style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
            {badge > 0 && collapsed && (
                <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#ef4444',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%'
                }} />
            )}
        </div>
    );
};

const Dashboard = ({ children }) => {
    const { logout, user, token } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isProjectsOpen, setIsProjectsOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [projectHoverId, setProjectHoverId] = useState(null);
    const [unreadInbox, setUnreadInbox] = useState(0);
    const [searchFocused, setSearchFocused] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Persist sidebar state in localStorage
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    }, [sidebarCollapsed]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        logout();
        window.location.href = '/login';
    };

    const fetchData = async () => {
        if (!token) return;
        try {
            const [tasksRes, eventsRes, projectsRes] = await Promise.all([
                http.get('/tasks'),
                http.get('/events'),
                http.get('/projects')
            ]);
            setTasks(tasksRes.data);
            setEvents(eventsRes.data);
            setProjects(projectsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const handleCreateProject = async (projectData) => {
        try {
            const res = await http.post('/projects', projectData);
            setProjects(prev => [...prev, res.data]);
            setShowCreateProject(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleArchiveProject = async (projectId) => {
        try {
            await http.patch(`/projects/${projectId}/archive`);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: true } : p));
        } catch (error) {
            console.error('Failed to archive project:', error);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Delete this project? All tasks will be permanently removed.')) return;
        try {
            await http.delete(`/projects/${projectId}`);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-secondary)' }}>

            {/* Modern Header Bar */}
            <header style={{
                height: '64px',
                background: 'var(--header-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                boxShadow: 'var(--shadow-sm)',
                borderBottom: '1px solid var(--header-border)',
                flexShrink: 0,
                zIndex: 50
            }}>
                {/* Left: Logo & Workspace */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{
                            background: 'var(--primary-gradient)',
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Sparkles size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>BBC Agents</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Workspace</div>
                        </div>
                        <ChevronDown size={16} style={{ color: 'var(--text-light)' }} />
                    </div>
                </div>

                {/* Center: Search */}
                <div style={{ flex: 1, maxWidth: '480px', margin: '0 2rem' }}>
                    <div style={{
                        background: searchFocused ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.625rem 1rem',
                        border: searchFocused ? '2px solid var(--primary)' : '2px solid transparent',
                        boxShadow: searchFocused ? 'var(--input-focus-shadow)' : 'none',
                        transition: 'all 0.2s ease'
                    }}>
                        <Search size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                        <input
                            placeholder="Search anything..."
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                padding: '0 0.75rem',
                                width: '100%',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <kbd style={{
                            background: 'var(--bg-active)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'inherit',
                            fontWeight: 500
                        }}>⌘K</kbd>
                    </div>
                </div>

                {/* Right: Actions & User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="btn-modern btn-modern-primary" style={{ padding: '0.5rem 1rem' }}>
                        <Plus size={16} />
                        New
                    </button>

                    <div style={{ width: 1, height: 28, background: 'var(--border-color)' }} />

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            border: 'none',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <NotificationBell />

                    {/* User Avatar Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{
                                width: 40,
                                height: 40,
                                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'white',
                                cursor: 'pointer',
                                border: showUserMenu ? '2px solid var(--primary)' : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                boxShadow: showUserMenu ? 'var(--input-focus-shadow)' : 'none'
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <>
                                <div
                                    onClick={() => setShowUserMenu(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                                />
                                <div className="animate-fadeInDown" style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 12px)',
                                    right: 0,
                                    width: '260px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '16px',
                                    boxShadow: 'var(--shadow-xl)',
                                    overflow: 'hidden',
                                    zIndex: 1000,
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {/* User Info */}
                                    <div style={{
                                        padding: '1.25rem',
                                        background: 'var(--bg-secondary)',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{
                                                width: 52,
                                                height: 52,
                                                background: 'var(--primary-gradient)',
                                                borderRadius: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '1.25rem',
                                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                            }}>
                                                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: 700,
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                    marginBottom: '2px'
                                                }}>
                                                    {user?.username || 'User'}
                                                </div>
                                                <div style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {user?.email || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div style={{ padding: '0.5rem' }}>
                                        {[
                                            { icon: User, label: 'Profile', href: '/profile' },
                                            { icon: Settings, label: 'Settings', href: '/settings' }
                                        ].map(item => (
                                            <div
                                                key={item.href}
                                                onClick={() => { setShowUserMenu(false); window.location.href = item.href; }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500,
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                                    e.currentTarget.style.color = 'var(--text-primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                }}
                                            >
                                                <item.icon size={18} style={{ opacity: 0.7 }} />
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Logout */}
                                    <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                        <div
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                color: 'var(--danger)',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--danger-bg)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <LogOut size={18} />
                                            Sign out
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Modern Dark Sidebar */}
                <aside className="sidebar-modern scrollbar-dark" style={{
                    width: sidebarCollapsed ? '72px' : '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.875rem',
                    overflowY: 'auto',
                    transition: 'width 0.2s ease',
                    position: 'relative'
                }}>
                    {/* Collapse Toggle Button */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: sidebarCollapsed ? '50%' : '12px',
                            transform: sidebarCollapsed ? 'translateX(50%)' : 'none',
                            background: 'rgba(99, 102, 241, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            transition: 'all 0.2s ease',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                            e.currentTarget.style.color = '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                    </button>

                    <div style={{ flex: 1, padding: sidebarCollapsed ? '3.5rem 0.5rem 1rem' : '3.5rem 0.75rem 1rem' }}>
                        {/* Main Navigation */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <NavItem icon={LayoutDashboard} label="Dashboard" href="/" collapsed={sidebarCollapsed} />
                            <NavItem icon={TrendingUp} label="Analytics" href="/analytics" collapsed={sidebarCollapsed} />
                            <NavItem icon={Copy} label="Templates" href="/templates" collapsed={sidebarCollapsed} />
                        </div>

                        {/* Projects Section */}
                        {!sidebarCollapsed && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div
                                    onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0.875rem',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Folder size={14} />
                                        Projects
                                    </div>
                                    <ChevronDown
                                        size={14}
                                        style={{
                                            transition: 'transform 0.2s ease',
                                            transform: isProjectsOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                        }}
                                    />
                                </div>

                                {isProjectsOpen && (
                                    <div style={{ marginTop: '0.25rem' }}>
                                        {projects.filter(p => !p.archived).map(project => (
                                            <div
                                                key={project.id}
                                                onMouseEnter={() => setProjectHoverId(project.id)}
                                                onMouseLeave={() => setProjectHoverId(null)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0.5rem 0.875rem 0.5rem 1.75rem',
                                                    cursor: 'pointer',
                                                    color: '#94a3b8',
                                                    fontSize: '0.85rem',
                                                    borderRadius: '8px',
                                                    transition: 'all 0.15s ease',
                                                    background: projectHoverId === project.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                                }}
                                            >
                                                <div
                                                    onClick={() => window.location.href = `/projects/${project.id}`}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}
                                                >
                                                    <div style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        background: project.color || '#6366f1',
                                                        boxShadow: `0 0 8px ${project.color || '#6366f1'}40`
                                                    }} />
                                                    <span style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        color: projectHoverId === project.id ? '#e2e8f0' : '#94a3b8'
                                                    }}>
                                                        {project.name}
                                                    </span>
                                                </div>
                                                {projectHoverId === project.id && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }}
                                                            style={{
                                                                background: 'rgba(255,255,255,0.1)',
                                                                border: 'none',
                                                                padding: '4px',
                                                                cursor: 'pointer',
                                                                color: '#94a3b8',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Archive size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div
                                            onClick={() => setShowCreateProject(true)}
                                            style={{
                                                padding: '0.5rem 0.875rem 0.5rem 1.75rem',
                                                color: '#64748b',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = '#94a3b8';
                                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = '#64748b';
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <Plus size={14} /> Add Project
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {sidebarCollapsed && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <NavItem icon={Folder} label="Projects" href="/projects" collapsed={sidebarCollapsed} />
                            </div>
                        )}

                        {/* Tools Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <NavItem icon={Calendar} label="Calendar" href="/calendar" collapsed={sidebarCollapsed} />
                            <NavItem icon={Bot} label="AI Assistant" href="/bot" collapsed={sidebarCollapsed} />
                            <NavItem icon={Target} label="Goals" href="/goals" collapsed={sidebarCollapsed} />
                            <NavItem icon={Inbox} label="Inbox" href="/inbox" badge={unreadInbox} collapsed={sidebarCollapsed} />
                        </div>

                        {/* Company Section */}
                        <div>
                            {!sidebarCollapsed && (
                                <div style={{
                                    padding: '0.5rem 0.875rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: 'var(--sidebar-text)',
                                    letterSpacing: '0.5px'
                                }}>
                                    Company
                                </div>
                            )}
                            {sidebarCollapsed && (
                                <div style={{
                                    borderTop: '1px solid var(--sidebar-border)',
                                    margin: '0.5rem 0',
                                    paddingTop: '0.5rem'
                                }} />
                            )}
                            <NavItem icon={Users} label="Employees" href="/employees" collapsed={sidebarCollapsed} />
                            <NavItem icon={Building2} label="Departments" href="/departments" collapsed={sidebarCollapsed} />
                            <NavItem icon={Shield} label="Roles" href="/roles" collapsed={sidebarCollapsed} />
                            <NavItem icon={Clock} label="Attendance" href="/attendance" collapsed={sidebarCollapsed} />
                            <NavItem icon={CalendarOff} label="Leave" href="/leave" collapsed={sidebarCollapsed} />
                            <NavItem icon={GitBranch} label="Org Chart" href="/org-chart" collapsed={sidebarCollapsed} />
                            <NavItem icon={Activity} label="Activity Logs" href="/activity-logs" collapsed={sidebarCollapsed} />
                        </div>
                    </div>

                    {/* Bottom Sidebar */}
                    <div style={{
                        padding: sidebarCollapsed ? '1rem 0.5rem' : '1rem 0.75rem',
                        borderTop: '1px solid var(--sidebar-border)'
                    }}>
                        {[
                            { icon: UserPlus, label: 'Invite Team' },
                            { icon: HelpCircle, label: 'Help & Support' }
                        ].map(item => (
                            <div
                                key={item.label}
                                title={sidebarCollapsed ? item.label : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                    gap: sidebarCollapsed ? 0 : '0.75rem',
                                    padding: sidebarCollapsed ? '0.6rem' : '0.6rem 0.875rem',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                    e.currentTarget.style.color = '#94a3b8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#64748b';
                                }}
                            >
                                <item.icon size={16} />
                                {!sidebarCollapsed && item.label}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary)'
                }}>
                    {children ? children : <DashboardHome />}
                </main>
            </div>

            {/* Floating Bot Button */}
            <BotButton />

            {/* Create Project Modal */}
            {showCreateProject && (
                <CreateProjectModal
                    onClose={() => setShowCreateProject(false)}
                    onCreate={handleCreateProject}
                />
            )}
        </div>
    );
};

// Modern Create Project Modal Component
const CreateProjectModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [loading, setLoading] = useState(false);

    const PRESET_COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
        '#f97316', '#eab308', '#22c55e', '#06b6d4'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            await onCreate({ name: name.trim(), description: description.trim() || null, color });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100%', maxWidth: '480px' }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Create Project
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Add a new project to your workspace
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-tertiary)',
                            border: 'none',
                            borderRadius: '10px',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Project Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)'
                            }}>
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Marketing Campaign"
                                required
                                autoFocus
                                className="input-modern"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)'
                            }}>
                                Description <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief project description..."
                                rows={3}
                                className="input-modern"
                                style={{
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Color */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)'
                            }}>
                                Project Color
                            </label>
                            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: c,
                                            border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            transform: color === c ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: color === c ? `0 4px 12px ${c}50` : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        background: 'var(--bg-secondary)'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-modern btn-modern-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="btn-modern btn-modern-primary"
                            style={{
                                opacity: loading || !name.trim() ? 0.5 : 1,
                                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;
