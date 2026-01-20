import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import { Target, Plus, ChevronDown, ChevronUp, Calendar, User, Building2, Globe, Trash2, Edit3, X, Check, TrendingUp, AlertTriangle, CheckCircle2, Rocket } from 'lucide-react';

const GoalsPage = () => {
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, atRisk: 0, onTrack: 0 });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedGoalId, setExpandedGoalId] = useState(null);
    const [editingGoal, setEditingGoal] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);
            const params = filterStatus ? `?status=${filterStatus}` : '';
            const [goalsRes, statsRes] = await Promise.all([
                http.get(`/api/goals${params}`),
                http.get('/api/goals/stats')
            ]);
            setGoals(goalsRes.data || []);
            setStats(statsRes.data || { total: 0, completed: 0, atRisk: 0, onTrack: 0 });
        } catch (error) {
            console.error('Failed to fetch goals:', error);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    const fetchMetadata = useCallback(async () => {
        try {
            const [empRes, deptRes] = await Promise.all([
                http.get('/api/employees?limit=100'),
                http.get('/api/departments')
            ]);
            setEmployees(empRes.data?.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
        fetchMetadata();
    }, [fetchGoals, fetchMetadata]);

    const handleCreateGoal = async (goalData) => {
        try {
            await http.post('/api/goals', goalData);
            setShowCreateModal(false);
            fetchGoals();
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('Failed to create goal: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateGoal = async (id, updates) => {
        try {
            await http.put(`/api/goals/${id}`, updates);
            setEditingGoal(null);
            fetchGoals();
        } catch (error) {
            console.error('Failed to update goal:', error);
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm('Delete this goal? This action cannot be undone.')) return;
        try {
            await http.delete(`/api/goals/${id}`);
            fetchGoals();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    };

    const handleCompleteGoal = async (id) => {
        try {
            await http.put(`/api/goals/${id}`, { status: 'completed', currentValue: goals.find(g => g.id === id)?.targetValue });
            fetchGoals();
        } catch (error) {
            console.error('Failed to complete goal:', error);
        }
    };

    const getStatusBadge = (goal) => {
        const status = goal.computedStatus || goal.status;
        const styles = {
            completed: { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#059669', label: 'Completed' },
            at_risk: { bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', color: '#d97706', label: 'At Risk' },
            overdue: { bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#dc2626', label: 'Overdue' },
            active: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', label: 'On Track' },
            failed: { bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#dc2626', label: 'Failed' }
        };
        const style = styles[status] || styles.active;
        return (
            <span className="badge-modern" style={{
                background: style.bg,
                color: style.color,
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.75rem'
            }}>
                {style.label}
            </span>
        );
    };

    const getProgressBar = (goal) => {
        const progress = goal.progress || 0;
        const clampedProgress = Math.min(100, Math.max(0, progress));
        const barGradient = progress >= 100
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : progress >= 50
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : progress >= 25
            ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div className="progress-modern" style={{ flex: 1 }}>
                    <div className="progress-modern-bar" style={{
                        width: `${clampedProgress}%`,
                        background: barGradient
                    }} />
                </div>
                <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    minWidth: '45px',
                    textAlign: 'right'
                }}>
                    {progress}%
                </span>
            </div>
        );
    };

    const getOwnerIcon = (ownerType) => {
        switch (ownerType) {
            case 'employee': return <User size={14} />;
            case 'department': return <Building2 size={14} />;
            case 'company': return <Globe size={14} />;
            default: return <User size={14} />;
        }
    };

    const StatCard = ({ label, value, gradient, icon: Icon, delay }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                className="card-modern animate-fadeInUp hover-lift"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    animationDelay: delay
                }}
            >
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'scale(1.05) rotate(-3deg)' : 'scale(1) rotate(0deg)'
                }}>
                    <Icon size={26} color="white" />
                </div>
                <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{label}</div>
                </div>
            </div>
        );
    };

    return (
        <Dashboard>
            <div className="scrollbar-modern" style={{ padding: '2rem', height: '100%', overflow: 'auto', background: '#f8fafc' }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                    {/* Header */}
                    <div className="animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                }}>
                                    <Target size={24} color="white" />
                                </div>
                                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                                    Goals & OKRs
                                </h1>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', marginLeft: '56px' }}>
                                Track and manage your objectives and key results
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-modern btn-modern-primary"
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            <Plus size={18} />
                            New Goal
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                        <StatCard
                            label="Total Goals"
                            value={stats.total}
                            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                            icon={Target}
                            delay="0ms"
                        />
                        <StatCard
                            label="Completed"
                            value={stats.completed}
                            gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                            icon={CheckCircle2}
                            delay="100ms"
                        />
                        <StatCard
                            label="At Risk"
                            value={stats.atRisk}
                            gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                            icon={AlertTriangle}
                            delay="200ms"
                        />
                        <StatCard
                            label="On Track"
                            value={stats.onTrack}
                            gradient="linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)"
                            icon={Rocket}
                            delay="300ms"
                        />
                    </div>

                    {/* Filter */}
                    <div className="animate-fadeInUp" style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', animationDelay: '200ms' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-modern"
                            style={{
                                width: 'auto',
                                padding: '0.625rem 1rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="at_risk">At Risk</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    {/* Goals List */}
                    <div className="card-modern animate-fadeInUp" style={{ overflow: 'hidden', animationDelay: '300ms' }}>
                        {loading ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <div className="animate-spin" style={{
                                    width: 40,
                                    height: 40,
                                    border: '4px solid #e2e8f0',
                                    borderTopColor: '#6366f1',
                                    borderRadius: '50%',
                                    margin: '0 auto 1rem'
                                }} />
                                <div style={{ color: '#64748b', fontWeight: 500 }}>Loading goals...</div>
                            </div>
                        ) : goals.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                <Target size={56} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: '#64748b' }}>No goals found</p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Create your first goal to get started!</p>
                            </div>
                        ) : (
                            goals.map((goal, idx) => (
                                <div
                                    key={goal.id}
                                    className="animate-fadeInUp"
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        animationDelay: `${idx * 50}ms`
                                    }}
                                >
                                    {/* Goal Row */}
                                    <div
                                        style={{
                                            padding: '1.25rem 1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1.25rem',
                                            cursor: 'pointer',
                                            background: expandedGoalId === goal.id ? '#f8fafc' : 'white',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                                        onMouseEnter={(e) => { if (expandedGoalId !== goal.id) e.currentTarget.style.background = '#fafbfc'; }}
                                        onMouseLeave={(e) => { if (expandedGoalId !== goal.id) e.currentTarget.style.background = 'white'; }}
                                    >
                                        {/* Expand Icon */}
                                        <div style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            background: '#f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#64748b',
                                            transition: 'all 0.2s ease',
                                            transform: expandedGoalId === goal.id ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }}>
                                            <ChevronDown size={16} />
                                        </div>

                                        {/* Title & Owner */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
                                                {goal.title}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {getOwnerIcon(goal.ownerType)}
                                                    {goal.ownerName}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={14} />
                                                    {new Date(goal.dueDate).toLocaleDateString()}
                                                    {goal.daysLeft !== undefined && goal.status !== 'completed' && (
                                                        <span style={{
                                                            color: goal.daysLeft < 7 ? '#ef4444' : '#64748b',
                                                            fontWeight: goal.daysLeft < 7 ? 600 : 400
                                                        }}>
                                                            ({goal.daysLeft}d left)
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ width: '220px' }}>
                                            {getProgressBar(goal)}
                                        </div>

                                        {/* Status Badge */}
                                        <div style={{ minWidth: '110px' }}>
                                            {getStatusBadge(goal)}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                                            {goal.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleCompleteGoal(goal.id)}
                                                    title="Mark Complete"
                                                    style={{
                                                        padding: '8px',
                                                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        color: '#059669',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEditingGoal(goal)}
                                                title="Edit"
                                                style={{
                                                    padding: '8px',
                                                    background: '#f1f5f9',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#0f172a'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = '#64748b'; }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                title="Delete"
                                                style={{
                                                    padding: '8px',
                                                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    color: '#dc2626',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedGoalId === goal.id && (
                                        <div className="animate-fadeIn" style={{
                                            padding: '0 1.5rem 1.5rem 4.5rem',
                                            background: '#f8fafc'
                                        }}>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                                gap: '1.25rem',
                                                padding: '1rem',
                                                background: 'white',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target</div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                                                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                                                        {goal.goalType}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created By</div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                                        {goal.creator?.name || 'Unknown'}
                                                    </div>
                                                </div>
                                                {goal.autoTrackField && (
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auto-Track</div>
                                                        <div style={{ fontWeight: 700, color: '#6366f1', textTransform: 'capitalize' }}>
                                                            {goal.autoTrackField.replace('_', ' ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {goal.description && (
                                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                                                    <div style={{ color: '#334155', lineHeight: 1.6 }}>{goal.description}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Goal Modal */}
            {showCreateModal && (
                <GoalFormModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleCreateGoal}
                    employees={employees}
                    departments={departments}
                />
            )}

            {/* Edit Goal Modal */}
            {editingGoal && (
                <GoalFormModal
                    goal={editingGoal}
                    onClose={() => setEditingGoal(null)}
                    onSave={(data) => handleUpdateGoal(editingGoal.id, data)}
                    employees={employees}
                    departments={departments}
                />
            )}
        </Dashboard>
    );
};

// Modern Goal Form Modal Component
const GoalFormModal = ({ goal, onClose, onSave, employees, departments }) => {
    const [formData, setFormData] = useState({
        title: goal?.title || '',
        description: goal?.description || '',
        targetValue: goal?.targetValue || '',
        currentValue: goal?.currentValue || 0,
        unit: goal?.unit || 'tasks',
        ownerType: goal?.ownerType || 'employee',
        ownerId: goal?.ownerId || '',
        dueDate: goal?.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : '',
        autoTrackField: goal?.autoTrackField || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.targetValue || !formData.dueDate) {
            alert('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            await onSave({
                ...formData,
                targetValue: parseFloat(formData.targetValue),
                currentValue: parseFloat(formData.currentValue) || 0,
                ownerId: formData.ownerType === 'company' ? null : formData.ownerId || null
            });
        } finally {
            setLoading(false);
        }
    };

    const UNITS = [
        { value: 'tasks', label: 'Tasks' },
        { value: 'hours', label: 'Hours' },
        { value: 'percent', label: 'Percent (%)' },
        { value: 'dollars', label: 'Dollars ($)' },
        { value: 'customers', label: 'Customers' },
        { value: 'custom', label: 'Custom' }
    ];

    const AUTO_TRACK_OPTIONS = [
        { value: '', label: 'Manual tracking' },
        { value: 'tasks_completed', label: 'Tasks Completed' },
        { value: 'hours_worked', label: 'Hours Worked' },
        { value: 'attendance_rate', label: 'Attendance Rate' }
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content scrollbar-modern" style={{
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {/* Header */}
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
                            {goal ? 'Edit Goal' : 'Create New Goal'}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            {goal ? 'Update your goal details' : 'Set up a new goal to track'}
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
                            color: '#64748b',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Goal Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Complete 20 tasks this month"
                                required
                                className="input-modern"
                            />
                        </div>

                        {/* Target Value & Unit */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Target Value
                                </label>
                                <input
                                    type="number"
                                    value={formData.targetValue}
                                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                                    placeholder="e.g., 20"
                                    required
                                    min="0"
                                    step="any"
                                    className="input-modern"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Unit
                                </label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="input-modern"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {UNITS.map(u => (
                                        <option key={u.value} value={u.value}>{u.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Current Value (for editing) */}
                        {goal && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    Current Progress
                                </label>
                                <input
                                    type="number"
                                    value={formData.currentValue}
                                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                                    min="0"
                                    step="any"
                                    className="input-modern"
                                />
                            </div>
                        )}

                        {/* Owner Type */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Owner Type
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {[
                                    { value: 'employee', label: 'Employee', icon: User },
                                    { value: 'department', label: 'Department', icon: Building2 },
                                    { value: 'company', label: 'Company', icon: Globe }
                                ].map(option => (
                                    <label
                                        key={option.value}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '0.875rem',
                                            border: `2px solid ${formData.ownerType === option.value ? '#6366f1' : '#e2e8f0'}`,
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            background: formData.ownerType === option.value ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : 'white',
                                            transition: 'all 0.2s ease',
                                            color: formData.ownerType === option.value ? '#4f46e5' : '#64748b'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="ownerType"
                                            value={option.value}
                                            checked={formData.ownerType === option.value}
                                            onChange={(e) => setFormData({ ...formData, ownerType: e.target.value, ownerId: '' })}
                                            style={{ display: 'none' }}
                                        />
                                        <option.icon size={18} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Owner Selection */}
                        {formData.ownerType !== 'company' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    {formData.ownerType === 'employee' ? 'Select Employee' : 'Select Department'}
                                </label>
                                <select
                                    value={formData.ownerId}
                                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                                    className="input-modern"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="">Select...</option>
                                    {formData.ownerType === 'employee'
                                        ? employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))
                                        : departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        )}

                        {/* Due Date */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                                className="input-modern"
                            />
                        </div>

                        {/* Auto-Track */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Auto-Track Progress
                            </label>
                            <select
                                value={formData.autoTrackField}
                                onChange={(e) => setFormData({ ...formData, autoTrackField: e.target.value })}
                                className="input-modern"
                                style={{ cursor: 'pointer' }}
                            >
                                {AUTO_TRACK_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                                Automatically update progress based on system data
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Additional details about this goal..."
                                rows={3}
                                className="input-modern"
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        background: '#f8fafc'
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
                            disabled={loading}
                            className="btn-modern btn-modern-primary"
                            style={{
                                opacity: loading ? 0.5 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Saving...' : (goal ? 'Update Goal' : 'Create Goal')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalsPage;
