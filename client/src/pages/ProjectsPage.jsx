import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, FolderKanban, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFilters from '../components/projects/ProjectFilters';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import AIProjectHelper from '../components/projects/AIProjectHelper';

function ProjectsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [pendingProjects, setPendingProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIHelper, setShowAIHelper] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        showAIGenerated: true,
        showPendingApproval: true
    });

    const isManagerOrAdmin = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.priority !== 'all') params.append('priority', filters.priority);
            if (!filters.showAIGenerated) params.append('excludeAI', 'true');

            const response = await http.get(`/projects?${params.toString()}`);
            const allProjects = response.data || [];

            // Separate pending approval projects for managers/admins
            if (isManagerOrAdmin && filters.showPendingApproval) {
                const pending = allProjects.filter(p => p.status === 'PENDING_APPROVAL');
                const others = allProjects.filter(p => p.status !== 'PENDING_APPROVAL');
                setPendingProjects(pending);
                setProjects(others);
            } else {
                setPendingProjects([]);
                setProjects(allProjects.filter(p =>
                    filters.showPendingApproval || p.status !== 'PENDING_APPROVAL'
                ));
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err.response?.data?.error || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [filters]);

    const handleApprove = async (projectId) => {
        try {
            await http.post(`/projects/${projectId}/approve`);
            fetchProjects();
        } catch (err) {
            console.error('Error approving project:', err);
            alert(err.response?.data?.error || 'Failed to approve project');
        }
    };

    const handleReject = async (projectId, reason) => {
        try {
            await http.post(`/projects/${projectId}/reject`, { reason });
            fetchProjects();
        } catch (err) {
            console.error('Error rejecting project:', err);
            alert(err.response?.data?.error || 'Failed to reject project');
        }
    };

    const handleProjectCreated = (newProject) => {
        fetchProjects();
    };

    const handleProjectClick = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <FolderKanban size={28} color="#6366f1" />
                        Projects
                    </h1>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Manage and track your team's projects
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowAIHelper(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Sparkles size={18} />
                        AI Helper
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                </div>
            </div>

            {/* Filters */}
            <ProjectFilters filters={filters} onChange={setFilters} />

            {/* Error State */}
            {error && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '10px',
                    marginBottom: '1.5rem'
                }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button
                        onClick={fetchProjects}
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={14} />
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '4rem',
                    color: '#6b7280'
                }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem' }} />
                    Loading projects...
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Pending Approval Section (Managers/Admins only) */}
                    {isManagerOrAdmin && pendingProjects.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                <Clock size={20} color="#d97706" />
                                <h2 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: '#92400e',
                                    margin: 0
                                }}>
                                    Pending Approval ({pendingProjects.length})
                                </h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1rem',
                                padding: '1rem',
                                background: '#fffbeb',
                                borderRadius: '12px',
                                border: '1px solid #fcd34d'
                            }}>
                                {pendingProjects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => handleProjectClick(project.id)}
                                        showApprovalActions={true}
                                        onApprove={() => handleApprove(project.id)}
                                        onReject={(reason) => handleReject(project.id, reason)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Projects */}
                    <div>
                        <h2 style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: '#374151',
                            margin: '0 0 1rem 0'
                        }}>
                            {filters.status !== 'all'
                                ? `${filters.status.replace('_', ' ')} Projects`
                                : 'All Projects'
                            } ({projects.length})
                        </h2>

                        {projects.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                                background: '#f9fafb',
                                borderRadius: '12px',
                                border: '1px dashed #e5e7eb'
                            }}>
                                <FolderKanban size={48} color="#d1d5db" style={{ marginBottom: '1rem' }} />
                                <h3 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    No projects found
                                </h3>
                                <p style={{
                                    color: '#9ca3af',
                                    margin: '0 0 1.5rem 0',
                                    fontSize: '0.9rem'
                                }}>
                                    Create your first project manually or use AI to generate one
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => setShowAIHelper(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '10px 18px',
                                            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Sparkles size={16} />
                                        Use AI Helper
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '10px 18px',
                                            background: '#6366f1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Plus size={16} />
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1rem'
                            }}>
                                {projects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => handleProjectClick(project.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleProjectCreated}
            />

            <AIProjectHelper
                isOpen={showAIHelper}
                onClose={() => setShowAIHelper(false)}
                onProjectCreated={handleProjectCreated}
            />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default ProjectsPage;
