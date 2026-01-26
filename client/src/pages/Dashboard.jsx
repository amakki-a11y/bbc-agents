import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Search, UserPlus, Copy, ChevronDown,
    Folder, LayoutDashboard, Calendar, HelpCircle, TrendingUp, Bot,
    Users, Building2, Clock, GitBranch, Shield, LogOut, Settings, User, Inbox, Plus,
    CalendarOff, Target, Sparkles, Activity, PanelLeftClose, PanelLeft, Sun, Moon, FileText, Brain, UserCog
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
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

// Company Settings Menu Configuration with permissions
const COMPANY_SETTINGS_MENU = [
    { icon: Users, label: "Employees", href: "/employees", permission: "employees.view" },
    { icon: Building2, label: "Departments", href: "/departments", permission: "departments.view" },
    { icon: Shield, label: "Roles", href: "/roles", permission: "roles.view" },
    { icon: Clock, label: "Attendance", href: "/attendance", permission: "attendance.view_own" },
    { icon: CalendarOff, label: "Leave", href: "/leave", permission: "attendance.view_own" },
    { icon: GitBranch, label: "Org Chart", href: "/org-chart", permission: "employees.view" },
    { icon: Activity, label: "Activity Logs", href: "/activity-logs", permission: "system.audit_logs" },
    { icon: FileText, label: "Documents", href: "/documents", permission: "documents.view" },
    { icon: UserCog, label: "Users", href: "/users", permission: "users.view" }
];

const Dashboard = ({ children }) => {
    const { logout, user } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { hasPermission, loading: _permissionsLoading } = usePermissions();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [unreadInbox, _setUnreadInbox] = useState(0);
    const [searchFocused, setSearchFocused] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Persist sidebar state in localStorage
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    // Filter company settings menu based on user permissions
    const visibleCompanySettings = COMPANY_SETTINGS_MENU.filter(item =>
        hasPermission(item.permission)
    );

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
                            <NavItem icon={Folder} label="Projects" href="/projects" collapsed={sidebarCollapsed} />
                            <NavItem icon={Copy} label="Templates" href="/templates" collapsed={sidebarCollapsed} />
                        </div>

                        {/* Tools Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <NavItem icon={Calendar} label="Calendar" href="/calendar" collapsed={sidebarCollapsed} />
                            <NavItem icon={Bot} label="AI Assistant" href="/bot" collapsed={sidebarCollapsed} />
                            <NavItem icon={Brain} label="Agent Brain" href="/agent-brain" collapsed={sidebarCollapsed} />
                            <NavItem icon={Target} label="Goals" href="/goals" collapsed={sidebarCollapsed} />
                            <NavItem icon={Inbox} label="Inbox" href="/inbox" badge={unreadInbox} collapsed={sidebarCollapsed} />
                        </div>

                        {/* Company Settings Section - Permission Gated */}
                        {visibleCompanySettings.length > 0 && (
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
                                        Company Settings
                                    </div>
                                )}
                                {sidebarCollapsed && (
                                    <div style={{
                                        borderTop: '1px solid var(--sidebar-border)',
                                        margin: '0.5rem 0',
                                        paddingTop: '0.5rem'
                                    }} />
                                )}
                                {visibleCompanySettings.map(item => (
                                    <NavItem
                                        key={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        href={item.href}
                                        collapsed={sidebarCollapsed}
                                    />
                                ))}
                            </div>
                        )}
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
        </div>
    );
};

export default Dashboard;
