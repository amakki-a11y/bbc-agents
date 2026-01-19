import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Search, UserPlus, Copy,
    ChevronDown, Folder, LayoutDashboard, Calendar, HelpCircle, TrendingUp, Bot,
    Users, Building2, Clock, GitBranch, Shield, LogOut, Settings, User, Inbox, Plus, MoreHorizontal, Archive, Trash2, Edit3,
    CalendarOff
} from 'lucide-react';
import { http } from '../api/http';
import NotificationBell from '../components/NotificationBell';
import BotButton from '../components/bot/BotButton';
import DashboardHome from './DashboardHome';

// NavItem component with hover effects
const NavItem = ({ icon: Icon, label, href, badge }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isActive = window.location.pathname === href;

    return (
        <div
            onClick={() => window.location.href = href}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '2px',
                color: isActive ? '#7b68ee' : (isHovered ? '#1f2937' : '#4b5563'),
                background: isActive ? '#f0edff' : (isHovered ? '#f3f4f6' : 'transparent'),
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} style={{ color: isActive ? '#7b68ee' : (isHovered ? '#4b5563' : '#6b7280') }} />
                {label}
            </div>
            {badge > 0 && (
                <span style={{
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center'
                }}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </div>
    );
};

const Dashboard = ({ children }) => {
    const { logout, user, token } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isProjectsOpen, setIsProjectsOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [projectHoverId, setProjectHoverId] = useState(null);
    const [unreadInbox, setUnreadInbox] = useState(0);

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
                http.get('/api/tasks'),
                http.get('/api/events'),
                http.get('/api/projects')
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
            const res = await http.post('/api/projects', projectData);
            setProjects(prev => [...prev, res.data]);
            setShowCreateProject(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleArchiveProject = async (projectId) => {
        try {
            await http.patch(`/api/projects/${projectId}/archive`);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: true } : p));
        } catch (error) {
            console.error('Failed to archive project:', error);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Delete this project? All tasks will be permanently removed.')) return;
        try {
            await http.delete(`/api/projects/${projectId}`);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-dark)' }}>

            {/* A) Top Header Bar (Purple) */}
            <header style={{
                height: '48px',
                background: 'var(--header-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                color: 'white',
                flexShrink: 0
            }}>
                {/* Left: Workspace dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <div style={{ background: 'white', color: 'var(--header-bg)', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                    AI Workspace
                    <ChevronDown size={14} />
                </div>

                {/* Center: Search input */}
                <div style={{ flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.75rem',
                        color: 'white'
                    }}>
                        <Search size={14} style={{ opacity: 0.8 }} />
                        <input
                            placeholder="Search"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                width: '100%',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>

                {/* Right: Icons + Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', fontSize: '0.8rem', color: 'white' }}>Upgrade</button>
                    <button className="btn" style={{ background: 'white', color: 'var(--header-bg)', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>New</button>
                    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
                    <NotificationBell />

                    {/* User Avatar Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{
                                width: 32,
                                height: 32,
                                background: '#4ecdc4',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                border: showUserMenu ? '2px solid white' : '2px solid transparent',
                                transition: 'border 0.2s'
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <>
                                {/* Backdrop to close menu */}
                                <div
                                    onClick={() => setShowUserMenu(false)}
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 999
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: '240px',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                    overflow: 'hidden',
                                    zIndex: 1000
                                }}>
                                    {/* User Info */}
                                    <div style={{
                                        padding: '16px',
                                        borderBottom: '1px solid #e5e7eb',
                                        background: '#f9fafb'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '16px'
                                            }}>
                                                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: 600,
                                                    color: '#1f2937',
                                                    fontSize: '14px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {user?.username || 'User'}
                                                </div>
                                                <div style={{
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {user?.email || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div style={{ padding: '8px' }}>
                                        <div
                                            onClick={() => { setShowUserMenu(false); window.location.href = '/profile'; }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                color: '#374151',
                                                fontSize: '14px'
                                            }}
                                            className="sidebar-item"
                                        >
                                            <User size={18} color="#6b7280" />
                                            Profile
                                        </div>
                                        <div
                                            onClick={() => { setShowUserMenu(false); window.location.href = '/settings'; }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                color: '#374151',
                                                fontSize: '14px'
                                            }}
                                            className="sidebar-item"
                                        >
                                            <Settings size={18} color="#6b7280" />
                                            Settings
                                        </div>
                                    </div>

                                    {/* Logout */}
                                    <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                                        <div
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                color: '#dc2626',
                                                fontSize: '14px',
                                                fontWeight: 500
                                            }}
                                            className="sidebar-item"
                                        >
                                            <LogOut size={18} color="#dc2626" />
                                            Logout
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* B) Left Sidebar Navigation */}
                <aside style={{
                    width: '240px',
                    background: '#ffffff',
                    borderRight: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.875rem',
                    color: '#4b5563'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
                        <NavItem icon={LayoutDashboard} label="Dashboard" href="/" />
                        <NavItem icon={TrendingUp} label="Analytics" href="/analytics" />
                        <NavItem icon={Copy} label="Templates" href="/templates" />

                        {/* Projects Dropdown */}
                        <div
                            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '2px',
                                marginTop: '0.5rem',
                                background: isProjectsOpen ? '#f3f4f6' : 'transparent',
                                color: '#1f2937',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Folder size={18} style={{ color: '#7b68ee' }} /> Projects
                            </div>
                            <ChevronDown
                                size={14}
                                style={{
                                    transition: 'transform 0.2s ease',
                                    transform: isProjectsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                    color: '#6b7280'
                                }}
                            />
                        </div>

                        {/* Projects List */}
                        {isProjectsOpen && (
                            <div style={{ paddingLeft: '0.5rem' }}>
                                {projects.filter(p => !p.archived).map(project => (
                                    <div
                                        key={project.id}
                                        onMouseEnter={() => setProjectHoverId(project.id)}
                                        onMouseLeave={() => setProjectHoverId(null)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.4rem 0.75rem 0.4rem 2rem',
                                            marginBottom: '1px', cursor: 'pointer', color: '#666', fontSize: '0.85rem',
                                            borderRadius: '4px',
                                            background: projectHoverId === project.id ? '#f4f4f5' : 'transparent'
                                        }}
                                    >
                                        <div
                                            onClick={() => window.location.href = `/projects/${project.id}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}
                                        >
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: project.color || '#6366f1' }} />
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {project.name}
                                            </span>
                                        </div>
                                        {projectHoverId === project.id && (
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); /* TODO: Edit */ }}
                                                    style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#9ca3af', borderRadius: '4px' }}
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }}
                                                    style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#9ca3af', borderRadius: '4px' }}
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
                                        padding: '0.4rem 0.75rem 0.4rem 2rem', color: '#888', fontSize: '0.8rem',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.2rem',
                                        borderRadius: '4px'
                                    }}
                                    className="sidebar-item"
                                >
                                    <Plus size={14} /> Create Project
                                </div>
                            </div>
                        )}

                        <NavItem icon={Calendar} label="Calendar" href="/calendar" />
                        <NavItem icon={Bot} label="AI Assistant" href="/bot" />
                        <NavItem icon={Inbox} label="Inbox" href="/inbox" badge={unreadInbox} />

                        {/* Company Section Divider */}
                        <div style={{
                            margin: '1.25rem 0 0.75rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#9ca3af',
                            letterSpacing: '0.5px'
                        }}>
                            Company
                        </div>
                        <NavItem icon={Users} label="Employees" href="/employees" />
                        <NavItem icon={Building2} label="Departments" href="/departments" />
                        <NavItem icon={Shield} label="Roles" href="/roles" />
                        <NavItem icon={Clock} label="Attendance" href="/attendance" />
                        <NavItem icon={CalendarOff} label="Leave" href="/leave" />
                        <NavItem icon={GitBranch} label="Org Chart" href="/org-chart" />
                    </div>

                    {/* Bottom Sidebar */}
                    <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #e5e7eb' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                marginBottom: '2px',
                                cursor: 'pointer',
                                color: '#6b7280',
                                borderRadius: '8px',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.color = '#1f2937';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6b7280';
                            }}
                        >
                            <UserPlus size={16} /> Invite
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                color: '#6b7280',
                                borderRadius: '8px',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.color = '#1f2937';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6b7280';
                            }}
                        >
                            <HelpCircle size={16} /> Help
                        </div>
                    </div>
                </aside>

                {/* C) Main Content Area */}
                <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white' }}>
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

// Create Project Modal Component
const CreateProjectModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [loading, setLoading] = useState(false);

    const PRESET_COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
        '#f97316', '#eab308', '#22c55e', '#14b8a6'
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
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                        Create New Project
                    </h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                                Project Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Marketing Campaign"
                                required
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief project description..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                                Color
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: c,
                                            border: color === c ? '3px solid #1f2937' : '3px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.625rem 1.25rem',
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color: '#4b5563',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            style={{
                                padding: '0.625rem 1.25rem',
                                background: loading || !name.trim() ? '#d1d5db' : '#4f46e5',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color: 'white',
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
