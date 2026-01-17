import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Search, UserPlus, Copy,
    ChevronDown, Folder, LayoutDashboard, Calendar, HelpCircle, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const Dashboard = ({ children }) => {
    const { logout, user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [isProjectsOpen, setIsProjectsOpen] = useState(true);

    // Mock Projects
    const projectsList = [
        { id: 1, name: 'Business Requirements', color: '#7b68ee' },
        { id: 'web', name: 'Web App', color: '#10b981' },
        { id: 'marketing', name: 'Marketing', color: '#f59e0b' },
        { id: 'design', name: 'Design System', color: '#ec4899' },
    ];

    const fetchData = async () => {
        try {
            const tasksRes = await axios.get('http://localhost:3000/api/tasks');
            const eventsRes = await axios.get('http://localhost:3000/api/events');
            setTasks(tasksRes.data);
            setEvents(eventsRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                    <div style={{ width: 28, height: 28, background: '#4ecdc4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        A
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* B) Left Sidebar Navigation */}
                <aside style={{
                    width: '240px',
                    background: 'var(--sidebar-bg)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.9rem',
                    color: '#555'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', color: '#555' }} onClick={() => window.location.href = '/'}>
                            <LayoutDashboard size={18} /> Dashboard
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', color: '#555' }} onClick={() => window.location.href = '/analytics'}>
                            <TrendingUp size={18} /> Analytics
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', color: '#555' }} onClick={() => window.location.href = '/templates'}>
                            <Copy size={18} /> Templates
                        </div>

                        {/* Projects Dropdown */}
                        <div
                            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px',
                                background: isProjectsOpen ? '#f4f4f5' : 'transparent', color: '#333', fontWeight: 600
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Folder size={18} /> Projects
                            </div>
                            {isProjectsOpen ? <ChevronDown size={14} /> : <div style={{ transform: 'rotate(-90deg)' }}><ChevronDown size={14} /></div>}
                        </div>

                        {/* Projects List */}
                        {isProjectsOpen && (
                            <div style={{ paddingLeft: '0.5rem' }}>
                                {projectsList.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={() => window.location.href = `/projects/${project.id}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.4rem 0.75rem 0.4rem 2rem',
                                            marginBottom: '1px', cursor: 'pointer', color: '#666', fontSize: '0.85rem'
                                        }}
                                        className="sidebar-item"
                                    >
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: project.color }} />
                                        {project.name}
                                    </div>
                                ))}
                                <div style={{
                                    padding: '0.4rem 0.75rem 0.4rem 2rem', color: '#888', fontSize: '0.8rem',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.2rem'
                                }}>
                                    <span style={{ fontSize: '1rem' }}>+</span> Create Project
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', color: '#555' }}>
                            <Calendar size={18} /> Calendar
                        </div>
                    </div>

                    {/* Bottom Sidebar */}
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                            <UserPlus size={16} /> Invite
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <HelpCircle size={16} /> Help
                        </div>
                    </div>
                </aside>

                {/* C) Main Content Area */}
                <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white' }}>
                    {children ? children : (
                        <div style={{ padding: '2rem' }}>
                            <h2>Welcome to SmartPlanner</h2>
                            <p>Select &quot;Business Requirements&quot; from the sidebar to see the task list.</p>
                        </div>
                    )}
                </main>
            </div>


        </div>
    );
};
export default Dashboard;
