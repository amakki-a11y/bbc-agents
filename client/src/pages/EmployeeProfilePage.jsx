import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    User, Mail, Phone, MapPin, Calendar, Building2, Briefcase, Clock,
    Edit3, MessageSquare, MoreVertical, ChevronRight, Award, Target,
    FileText, Star, TrendingUp, AlertTriangle, CheckCircle2, X, Upload,
    Plus, Download, Eye, Trash2, Shield, Globe, Home, Laptop, Users,
    GraduationCap, Code, Languages, BadgeCheck, History, ArrowUpRight,
    Flame, Zap, Trophy, Medal, Crown, Sparkles, BarChart3, PieChart
} from 'lucide-react';

const EmployeeProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSkillModal, setShowSkillModal] = useState(false);

    // Additional data states
    const [documents, setDocuments] = useState([]);
    const [skills, setSkills] = useState([]);
    const [history, setHistory] = useState({ roles: [], statuses: [] });
    const [performance, setPerformance] = useState({ reviews: [], goals: [], achievements: [] });
    const [stats, setStats] = useState({
        tasksCompleted: 0,
        goalsAchieved: '0/0',
        attendanceRate: 0,
        currentStreak: 0,
        totalPoints: 0,
        level: 1
    });

    const fetchEmployee = useCallback(async () => {
        try {
            setLoading(true);
            const res = await http.get(`/employees/${id}/full-profile`);
            setEmployee(res.data.employee);
            setDocuments(res.data.documents || []);
            setSkills(res.data.skills || []);
            setHistory(res.data.history || { roles: [], statuses: [] });
            setPerformance(res.data.performance || { reviews: [], goals: [], achievements: [] });
            setStats(res.data.stats || stats);
        } catch (error) {
            console.error('Failed to fetch employee:', error);
            // Try basic employee fetch as fallback
            try {
                const basicRes = await http.get(`/employees/${id}`);
                setEmployee(basicRes.data);
            } catch (e) {
                console.error('Failed to fetch basic employee:', e);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEmployee();
    }, [fetchEmployee]);

    const calculateTenure = (hireDate) => {
        if (!hireDate) return 'N/A';
        const hire = new Date(hireDate);
        const now = new Date();
        const diff = now - hire;
        const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
        const days = Math.floor((diff % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));

        if (years > 0) return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
        if (months > 0) return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    const calculateProbationProgress = (employee) => {
        if (!employee?.hire_date || !employee?.probationEndDate) return null;
        const start = new Date(employee.hire_date);
        const end = new Date(employee.probationEndDate);
        const now = new Date();
        const total = end - start;
        const elapsed = now - start;
        const progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
        const daysLeft = Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
        return { progress, daysLeft, endDate: end };
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#059669', label: 'Active' },
            probation: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#d97706', label: 'Probation' },
            on_leave: { bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5', label: 'On Leave' },
            terminated: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#dc2626', label: 'Terminated' },
            resigned: { bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', color: '#64748b', label: 'Resigned' }
        };
        const style = styles[status] || styles.active;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: style.color
                }} />
                {style.label}
            </span>
        );
    };

    const getWorkModeBadge = (mode) => {
        const styles = {
            remote: { icon: Home, label: 'Remote', color: '#8b5cf6' },
            office: { icon: Building2, label: 'Office', color: '#0ea5e9' },
            hybrid: { icon: Laptop, label: 'Hybrid', color: '#10b981' }
        };
        const style = styles[mode] || styles.office;
        const Icon = style.icon;
        return (
            <span style={{
                background: '#f1f5f9',
                color: style.color,
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <Icon size={14} />
                {style.label}
            </span>
        );
    };

    const getSkillProficiencyBar = (proficiency) => {
        const levels = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
        const percent = levels[proficiency] || 50;
        const gradient = percent >= 75
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : percent >= 50
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div className="progress-modern" style={{ flex: 1, height: '8px' }}>
                    <div className="progress-modern-bar" style={{
                        width: `${percent}%`,
                        background: gradient,
                        height: '100%'
                    }} />
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b',
                    minWidth: '80px',
                    textTransform: 'capitalize'
                }}>
                    {proficiency}
                </span>
            </div>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'skills', label: 'Skills', icon: Code },
        { id: 'history', label: 'History', icon: History }
    ];

    if (loading) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: '#f8fafc'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="animate-spin" style={{
                            width: 48,
                            height: 48,
                            border: '4px solid #e2e8f0',
                            borderTopColor: '#6366f1',
                            borderRadius: '50%',
                            margin: '0 auto 1rem'
                        }} />
                        <div style={{ color: '#64748b', fontWeight: 500 }}>Loading profile...</div>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (!employee) {
        return (
            <Dashboard>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: '#f8fafc'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <User size={64} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Employee Not Found</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                            The employee profile you're looking for doesn't exist.
                        </p>
                        <button
                            onClick={() => navigate('/employees')}
                            className="btn-modern btn-modern-primary"
                        >
                            Back to Employees
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const probation = calculateProbationProgress(employee);

    return (
        <Dashboard>
            <div className="scrollbar-modern" style={{ padding: '2rem', height: '100%', overflow: 'auto', background: '#f8fafc' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Header */}
                    <div className="card-modern animate-fadeInUp" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Avatar */}
                            <div style={{
                                width: 120,
                                height: 120,
                                borderRadius: '24px',
                                background: employee.photo
                                    ? `url(${employee.photo}) center/cover`
                                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                color: 'white',
                                flexShrink: 0
                            }}>
                                {!employee.photo && employee.name?.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                                        {employee.name}
                                    </h1>
                                    {getStatusBadge(employee.status)}
                                    {getWorkModeBadge(employee.workMode)}
                                </div>

                                <p style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>
                                    {employee.jobTitle || employee.role?.name} • {employee.department?.name}
                                </p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={16} style={{ color: '#6366f1' }} />
                                        {employee.email}
                                    </span>
                                    {employee.phone && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={16} style={{ color: '#6366f1' }} />
                                            {employee.phone}
                                        </span>
                                    )}
                                    {(employee.city || employee.country) && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={16} style={{ color: '#6366f1' }} />
                                            {[employee.city, employee.country].filter(Boolean).join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="btn-modern btn-modern-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Edit3 size={16} />
                                    Edit Profile
                                </button>
                                <button
                                    className="btn-modern btn-modern-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <MessageSquare size={16} />
                                    Message
                                </button>
                                <button
                                    className="btn-modern btn-modern-secondary"
                                    style={{ padding: '0.625rem' }}
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem', animationDelay: '100ms' }}>
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                            background: 'white',
                            padding: '6px',
                            borderRadius: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            flex: 1,
                                            padding: '0.875rem 1rem',
                                            background: isActive
                                                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                                : 'transparent',
                                            color: isActive ? 'white' : '#64748b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fadeIn">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                employee={employee}
                                stats={stats}
                                probation={probation}
                                formatDate={formatDate}
                                calculateTenure={calculateTenure}
                            />
                        )}
                        {activeTab === 'performance' && (
                            <PerformanceTab
                                performance={performance}
                                stats={stats}
                                formatDate={formatDate}
                            />
                        )}
                        {activeTab === 'documents' && (
                            <DocumentsTab
                                documents={documents}
                                formatDate={formatDate}
                                onUpload={() => setShowUploadModal(true)}
                                onRefresh={fetchEmployee}
                            />
                        )}
                        {activeTab === 'skills' && (
                            <SkillsTab
                                skills={skills}
                                getSkillProficiencyBar={getSkillProficiencyBar}
                                onAddSkill={() => setShowSkillModal(true)}
                                onRefresh={fetchEmployee}
                            />
                        )}
                        {activeTab === 'history' && (
                            <HistoryTab
                                history={history}
                                formatDate={formatDate}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditProfileModal
                    employee={employee}
                    onClose={() => setShowEditModal(false)}
                    onSave={fetchEmployee}
                />
            )}
            {showUploadModal && (
                <UploadDocumentModal
                    employeeId={id}
                    onClose={() => setShowUploadModal(false)}
                    onSave={fetchEmployee}
                />
            )}
            {showSkillModal && (
                <AddSkillModal
                    employeeId={id}
                    onClose={() => setShowSkillModal(false)}
                    onSave={fetchEmployee}
                />
            )}
        </Dashboard>
    );
};

// ============= TAB COMPONENTS =============

const OverviewTab = ({ employee, stats, probation, formatDate, calculateTenure }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {/* Employment Info */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Briefcase size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Employment Info
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <InfoRow label="Hire Date" value={formatDate(employee.hire_date)} />
                    <InfoRow label="Tenure" value={calculateTenure(employee.hire_date)} />
                    <InfoRow label="Employment Type" value={employee.employmentType?.replace('_', ' ') || 'Full-time'} capitalize />
                    <InfoRow label="Manager" value={employee.manager?.name || 'None'} />
                    <InfoRow label="Department" value={employee.department?.name} />
                    <InfoRow label="Role" value={employee.role?.name} />
                </div>
            </div>

            {/* Probation Status */}
            {probation && employee.probationStatus !== 'passed' && (
                <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', animationDelay: '50ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock size={18} color="white" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            Probation Status
                        </h3>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                Status: <span style={{ color: '#d97706', fontWeight: 600 }}>
                                    {employee.probationStatus?.replace('_', ' ') || 'In Progress'}
                                </span>
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                {probation.progress}%
                            </span>
                        </div>
                        <div className="progress-modern" style={{ height: '10px' }}>
                            <div className="progress-modern-bar" style={{
                                width: `${probation.progress}%`,
                                background: probation.progress >= 75
                                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                    : probation.progress >= 50
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                                    : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                            }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <InfoRow label="Started" value={formatDate(employee.hire_date)} />
                        <InfoRow label="Ends" value={formatDate(employee.probationEndDate)} />
                        <InfoRow label="Days Left" value={`${probation.daysLeft} days`} highlight={probation.daysLeft < 30} />
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', animationDelay: '100ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <BarChart3 size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Quick Stats
                    </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <StatBox icon={CheckCircle2} label="Tasks Completed" value={stats.tasksCompleted} color="#10b981" />
                    <StatBox icon={Target} label="Goals Achieved" value={stats.goalsAchieved} color="#6366f1" />
                    <StatBox icon={Calendar} label="Attendance Rate" value={`${stats.attendanceRate}%`} color="#0ea5e9" />
                    <StatBox icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} color="#f59e0b" />
                </div>
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trophy size={24} style={{ color: '#d97706' }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 500 }}>Total Points</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#78350f' }}>{stats.totalPoints}</div>
                        </div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontWeight: 700,
                        color: '#d97706',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Star size={16} fill="#d97706" />
                        Level {stats.level}
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', animationDelay: '150ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <User size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Personal Info
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <InfoRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
                    <InfoRow label="Location" value={[employee.city, employee.country].filter(Boolean).join(', ') || 'N/A'} />
                    <InfoRow label="Timezone" value={employee.timezone || 'UTC'} />
                    <InfoRow label="Work Mode" value={employee.workMode?.replace('_', ' ') || 'Office'} capitalize />
                    {employee.personalEmail && (
                        <InfoRow label="Personal Email" value={employee.personalEmail} />
                    )}
                </div>
            </div>

            {/* AI Summary */}
            {employee.aiProfileSummary && (
                <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', gridColumn: '1 / -1', animationDelay: '200ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={18} color="white" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            AI Summary
                        </h3>
                    </div>
                    <p style={{
                        margin: 0,
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        color: '#334155',
                        lineHeight: 1.7,
                        fontStyle: 'italic',
                        borderLeft: '4px solid #8b5cf6'
                    }}>
                        "{employee.aiProfileSummary}"
                    </p>
                </div>
            )}
        </div>
    );
};

const PerformanceTab = ({ performance, stats, formatDate }) => {
    const latestReview = performance.reviews?.[0];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {/* Performance Trend Chart Placeholder */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <TrendingUp size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Performance Trend
                    </h3>
                </div>
                <div style={{
                    height: '200px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <PieChart size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>Performance chart coming soon</p>
                    </div>
                </div>
            </div>

            {/* Latest Review */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', animationDelay: '50ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Latest Review {latestReview?.reviewPeriod && `(${latestReview.reviewPeriod})`}
                    </h3>
                </div>
                {latestReview ? (
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '1.5rem'
                        }}>
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>
                                {latestReview.overallRating || 'N/A'}/5
                            </span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={20}
                                        fill={star <= (latestReview.overallRating || 0) ? '#fbbf24' : 'none'}
                                        style={{ color: '#fbbf24' }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <RatingRow label="Technical Skills" value={latestReview.technicalSkills} />
                            <RatingRow label="Communication" value={latestReview.communication} />
                            <RatingRow label="Teamwork" value={latestReview.teamwork} />
                            <RatingRow label="Initiative" value={latestReview.initiative} />
                        </div>
                        <button
                            className="btn-modern btn-modern-secondary"
                            style={{ marginTop: '1rem', width: '100%' }}
                        >
                            View Full Review
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No reviews yet</p>
                    </div>
                )}
            </div>

            {/* Current Goals */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', animationDelay: '100ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Target size={18} color="white" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            Current Goals
                        </h3>
                    </div>
                    <button className="btn-modern btn-modern-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} />
                        Add Goal
                    </button>
                </div>
                {performance.goals?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {performance.goals.slice(0, 4).map((goal, idx) => (
                            <div key={goal.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.1rem' }}>
                                    {goal.status === 'completed' ? '☑' : '☐'}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                        {goal.title}
                                    </div>
                                    <div className="progress-modern" style={{ height: '6px' }}>
                                        <div className="progress-modern-bar" style={{
                                            width: `${goal.progress || 0}%`,
                                            background: goal.progress >= 75
                                                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{
                            padding: '0.75rem',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            fontWeight: 500
                        }}>
                            Progress: {performance.goals.filter(g => g.status === 'completed').length}/{performance.goals.length} goals
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        <Target size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No goals set yet</p>
                    </div>
                )}
            </div>

            {/* Achievements */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', gridColumn: '1 / -1', animationDelay: '150ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Trophy size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Achievements
                    </h3>
                </div>
                {performance.achievements?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {performance.achievements.map((achievement, idx) => (
                            <div
                                key={achievement.id || idx}
                                style={{
                                    padding: '1rem 1.25rem',
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{achievement.icon || '🏆'}</span>
                                <span style={{ fontWeight: 600, color: '#78350f' }}>{achievement.title}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        {['🔥 10-Day Streak', '⚡ Speed Demon', '🎯 Goal Crusher', '🏆 Top Performer', '👥 Team Player', '📈 Rising Star'].map((badge, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: '#f1f5f9',
                                    borderRadius: '10px',
                                    color: '#94a3b8',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    opacity: 0.6
                                }}
                            >
                                {badge}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DocumentsTab = ({ documents, formatDate, onUpload, onRefresh }) => {
    const documentTypes = [
        { type: 'cv', label: 'CV / Resume', icon: '📄', required: true },
        { type: 'contract', label: 'Employment Contract', icon: '📝', required: true },
        { type: 'id_proof', label: 'ID Proof', icon: '🪪', required: true },
        { type: 'certificate', label: 'Certificates', icon: '🎓', required: false }
    ];

    const getDocByType = (type) => documents.filter(d => d.documentType === type);

    // Get the API base URL
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleViewDocument = (doc) => {
        // Open document in new tab
        const url = `${API_BASE}${doc.fileUrl}`;
        window.open(url, '_blank');
    };

    const handleDownloadDocument = async (doc) => {
        try {
            const url = `${API_BASE}/api/v1/documents/${doc.id}/download`;
            const token = localStorage.getItem('token');

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = doc.fileName || 'document';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download document');
        }
    };

    const handleDeleteDocument = async (doc) => {
        if (!confirm(`Are you sure you want to delete "${doc.title || doc.fileName}"?`)) {
            return;
        }

        try {
            await http.delete(`/documents/${doc.id}`);
            onRefresh();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete document');
        }
    };

    return (
        <div className="card-modern animate-fadeInUp" style={{ overflow: 'hidden' }}>
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Documents
                    </h3>
                </div>
                <button
                    onClick={onUpload}
                    className="btn-modern btn-modern-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                    <Upload size={16} />
                    Upload
                </button>
            </div>
            <div style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Uploaded</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentTypes.map((docType, idx) => {
                            const docs = getDocByType(docType.type);
                            const hasDoc = docs.length > 0;
                            const latestDoc = docs[0];
                            const isExpiring = latestDoc?.expiryDate && new Date(latestDoc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                            return (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{docType.icon}</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{docType.label}</span>
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: hasDoc ? '#334155' : '#94a3b8' }}>
                                        {hasDoc ? latestDoc.fileName : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        {hasDoc ? formatDate(latestDoc.created_at) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {hasDoc ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                background: isExpiring
                                                    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                                                    : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                                color: isExpiring ? '#d97706' : '#059669'
                                            }}>
                                                {isExpiring ? '⚠️ Expiring' : '✅'}
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                background: docType.required ? '#fee2e2' : '#f1f5f9',
                                                color: docType.required ? '#dc2626' : '#64748b'
                                            }}>
                                                {docType.required ? '❌ Missing' : 'Optional'}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        {hasDoc && (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleViewDocument(latestDoc)}
                                                    style={{
                                                        padding: '6px',
                                                        background: '#f1f5f9',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#64748b'
                                                    }}
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadDocument(latestDoc)}
                                                    style={{
                                                        padding: '6px',
                                                        background: '#f1f5f9',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#64748b'
                                                    }}
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(latestDoc)}
                                                    style={{
                                                        padding: '6px',
                                                        background: '#fee2e2',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#dc2626'
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {documents.filter(d => !['cv', 'contract', 'id_proof', 'certificate'].includes(d.documentType)).map((doc, idx) => (
                            <tr key={`other-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.25rem' }}>📎</span>
                                        <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                                            {doc.documentType?.replace('_', ' ') || 'Other'}
                                        </span>
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#334155' }}>{doc.fileName}</td>
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{formatDate(doc.created_at)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                        color: '#059669'
                                    }}>
                                        ✅
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleViewDocument(doc)}
                                            style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
                                            title="View"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadDocument(doc)}
                                            style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDocument(doc)}
                                            style={{ padding: '6px', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SkillsTab = ({ skills, getSkillProficiencyBar, onAddSkill, onRefresh }) => {
    const technicalSkills = skills.filter(s => s.category === 'technical');
    const softSkills = skills.filter(s => s.category === 'soft');
    const languages = skills.filter(s => s.category === 'language');
    const certifications = skills.filter(s => s.category === 'certification');

    const SkillCategory = ({ title, items, icon }) => (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {icon}
                {title}
            </div>
            {items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((skill, idx) => (
                        <div key={skill.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                                minWidth: '120px',
                                fontWeight: 600,
                                color: '#0f172a',
                                fontSize: '0.9rem'
                            }}>
                                {skill.skillName}
                            </span>
                            {getSkillProficiencyBar(skill.proficiency)}
                            {skill.yearsOfExp && (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', minWidth: '50px' }}>
                                    {skill.yearsOfExp} yrs
                                </span>
                            )}
                            {skill.verified && (
                                <BadgeCheck size={18} style={{ color: '#10b981' }} />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No {title.toLowerCase()} added yet
                </div>
            )}
        </div>
    );

    return (
        <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Code size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Skills & Certifications
                    </h3>
                </div>
                <button
                    onClick={onAddSkill}
                    className="btn-modern btn-modern-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                    <Plus size={16} />
                    Add Skill
                </button>
            </div>

            <SkillCategory
                title="Technical Skills"
                items={technicalSkills}
                icon={<Code size={14} />}
            />

            <SkillCategory
                title="Soft Skills"
                items={softSkills}
                icon={<Users size={14} />}
            />

            {languages.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Languages size={14} />
                        Languages
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {languages.map((lang, idx) => (
                            <span key={idx} style={{
                                padding: '8px 14px',
                                background: '#f1f5f9',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#334155'
                            }}>
                                {lang.skillName} ({lang.proficiency})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {certifications.length > 0 && (
                <div>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Medal size={14} />
                        Certifications
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {certifications.map((cert, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '0.75rem 1rem',
                                background: '#f8fafc',
                                borderRadius: '10px'
                            }}>
                                <Medal size={18} style={{ color: '#f59e0b' }} />
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{cert.skillName}</span>
                                {cert.verified && (
                                    <BadgeCheck size={16} style={{ color: '#10b981', marginLeft: 'auto' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {skills.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Code size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No skills added yet</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Click "Add Skill" to get started</p>
                </div>
            )}
        </div>
    );
};

const HistoryTab = ({ history, formatDate }) => {
    const roleHistory = history.roles || [];
    const statusHistory = history.statuses || [];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {/* Employment History Timeline */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <History size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Employment History
                    </h3>
                </div>

                {roleHistory.length > 0 ? (
                    <div style={{ position: 'relative', paddingLeft: '24px' }}>
                        {/* Timeline line */}
                        <div style={{
                            position: 'absolute',
                            left: '7px',
                            top: '8px',
                            bottom: '8px',
                            width: '2px',
                            background: '#e2e8f0'
                        }} />

                        {roleHistory.map((item, idx) => {
                            const colors = ['#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#ec4899'];
                            const color = colors[idx % colors.length];

                            return (
                                <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                    {/* Timeline dot */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-20px',
                                        top: '4px',
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: color,
                                        border: '3px solid white',
                                        boxShadow: '0 0 0 2px ' + color
                                    }} />

                                    <div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: color,
                                            fontWeight: 600,
                                            marginBottom: '4px'
                                        }}>
                                            {formatDate(item.effectiveDate)} - {item.isCurrent ? 'Present' : formatDate(item.endDate)}
                                        </div>
                                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                                            {item.toJobTitle || item.toRole} @ {item.toDepartment}
                                        </div>
                                        {item.toManager && (
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                Manager: {item.toManager}
                                            </div>
                                        )}
                                        {item.changeType === 'promotion' && (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                marginTop: '6px',
                                                padding: '4px 10px',
                                                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: '#059669'
                                            }}>
                                                <ArrowUpRight size={12} />
                                                Promoted from {item.fromJobTitle || item.fromRole}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        <History size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No role history available</p>
                    </div>
                )}
            </div>

            {/* Status Changes */}
            <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', animationDelay: '50ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Status Changes
                    </h3>
                </div>

                {statusHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {statusHistory.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: '#f8fafc',
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    minWidth: '100px',
                                    fontSize: '0.85rem',
                                    color: '#64748b',
                                    fontWeight: 500
                                }}>
                                    {formatDate(item.effectiveDate)}
                                </div>
                                <div style={{ flex: 1, fontWeight: 600, color: '#0f172a' }}>
                                    {item.reason || `Changed to ${item.toStatus}`}
                                </div>
                                {item.changedBy && (
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                        By: {item.changedBy}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No status changes recorded</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= HELPER COMPONENTS =============

const InfoRow = ({ label, value, capitalize, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</span>
        <span style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: highlight ? '#dc2626' : '#0f172a',
            textTransform: capitalize ? 'capitalize' : 'none'
        }}>
            {value || 'N/A'}
        </span>
    </div>
);

const StatBox = ({ icon: Icon, label, value, color }) => (
    <div style={{
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    }}>
        <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon size={18} style={{ color }} />
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
        </div>
    </div>
);

const RatingRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
            {value || 'N/A'}
        </span>
    </div>
);

// ============= MODAL COMPONENTS =============

const EditProfileModal = ({ employee, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: employee?.name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        jobTitle: employee?.jobTitle || '',
        city: employee?.city || '',
        country: employee?.country || '',
        timezone: employee?.timezone || 'UTC',
        workMode: employee?.workMode || 'office',
        personalEmail: employee?.personalEmail || '',
        linkedIn: employee?.linkedIn || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await http.put(`/employees/${employee.id}`, formData);
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content scrollbar-modern" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            Edit Profile
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Update employee information
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '10px',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-modern"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className="input-modern"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Work Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-modern"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-modern"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="input-modern"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="input-modern"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Timezone
                                </label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="input-modern"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="UTC+4">UTC+4 (Dubai)</option>
                                    <option value="UTC+3">UTC+3 (Riyadh)</option>
                                    <option value="UTC+5:30">UTC+5:30 (Mumbai)</option>
                                    <option value="UTC-5">UTC-5 (New York)</option>
                                    <option value="UTC-8">UTC-8 (Los Angeles)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Work Mode
                                </label>
                                <select
                                    value={formData.workMode}
                                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                                    className="input-modern"
                                >
                                    <option value="office">Office</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Personal Email
                            </label>
                            <input
                                type="email"
                                value={formData.personalEmail}
                                onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                                className="input-modern"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                LinkedIn Profile
                            </label>
                            <input
                                type="url"
                                value={formData.linkedIn}
                                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                                className="input-modern"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        background: '#f8fafc'
                    }}>
                        <button type="button" onClick={onClose} className="btn-modern btn-modern-secondary">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-modern btn-modern-primary"
                            style={{ opacity: loading ? 0.5 : 1 }}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UploadDocumentModal = ({ employeeId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        documentType: 'cv',
        title: '',
        file: null
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            alert('Please select a file');
            return;
        }
        setLoading(true);
        try {
            const data = new FormData();
            data.append('file', formData.file);
            data.append('documentType', formData.documentType);
            data.append('title', formData.title || formData.file.name);

            await http.post(`/documents/employee/${employeeId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            Upload Document
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Add a new document to the employee profile
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '10px',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Document Type
                            </label>
                            <select
                                value={formData.documentType}
                                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                className="input-modern"
                            >
                                <option value="cv">CV / Resume</option>
                                <option value="contract">Employment Contract</option>
                                <option value="id_proof">ID Proof</option>
                                <option value="certificate">Certificate</option>
                                <option value="offer_letter">Offer Letter</option>
                                <option value="nda">NDA</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Document Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input-modern"
                                placeholder="Enter a title for this document"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                File
                            </label>
                            <div style={{
                                border: '2px dashed #e2e8f0',
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    style={{ display: 'none' }}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                                    <Upload size={32} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
                                        {formData.file ? formData.file.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                                        PDF, DOC, DOCX, JPG, PNG up to 10MB
                                    </p>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        background: '#f8fafc'
                    }}>
                        <button type="button" onClick={onClose} className="btn-modern btn-modern-secondary">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.file}
                            className="btn-modern btn-modern-primary"
                            style={{ opacity: loading || !formData.file ? 0.5 : 1 }}
                        >
                            {loading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddSkillModal = ({ employeeId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        skillName: '',
        category: 'technical',
        proficiency: 'intermediate',
        yearsOfExp: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.skillName.trim()) {
            alert('Please enter a skill name');
            return;
        }
        setLoading(true);
        try {
            await http.post(`/employees/${employeeId}/skills`, {
                ...formData,
                yearsOfExp: formData.yearsOfExp ? parseFloat(formData.yearsOfExp) : null
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to add skill:', error);
            alert('Failed to add skill: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            Add Skill
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Add a new skill to the profile
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '10px',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Skill Name
                            </label>
                            <input
                                type="text"
                                value={formData.skillName}
                                onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                                className="input-modern"
                                placeholder="e.g., React, Python, Project Management"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-modern"
                                >
                                    <option value="technical">Technical</option>
                                    <option value="soft">Soft Skill</option>
                                    <option value="language">Language</option>
                                    <option value="certification">Certification</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Proficiency
                                </label>
                                <select
                                    value={formData.proficiency}
                                    onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })}
                                    className="input-modern"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Years of Experience
                            </label>
                            <input
                                type="number"
                                value={formData.yearsOfExp}
                                onChange={(e) => setFormData({ ...formData, yearsOfExp: e.target.value })}
                                className="input-modern"
                                placeholder="Optional"
                                min="0"
                                step="0.5"
                            />
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        background: '#f8fafc'
                    }}>
                        <button type="button" onClick={onClose} className="btn-modern btn-modern-secondary">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-modern btn-modern-primary"
                            style={{ opacity: loading ? 0.5 : 1 }}
                        >
                            {loading ? 'Adding...' : 'Add Skill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeProfilePage;
