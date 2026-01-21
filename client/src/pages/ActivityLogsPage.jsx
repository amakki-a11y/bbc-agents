import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    Activity, Filter, Download, RefreshCw, Search, Calendar,
    User, FileText, Clock, ChevronLeft, ChevronRight, X,
    LogIn, LogOut, Plus, Edit3, Trash2, Upload, Eye, Target
} from 'lucide-react';

const ActivityLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });

    // Filters
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    const [error, setError] = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.action && { action: filters.action }),
                ...(filters.entityType && { entityType: filters.entityType }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate }),
                ...(filters.search && { search: filters.search })
            });

            console.log('[ActivityLogs] Fetching logs with params:', params.toString());
            const res = await http.get(`/activity-logs?${params}`);
            console.log('[ActivityLogs] Response:', res.data);

            setLogs(res.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: res.data.pagination?.total || 0,
                totalPages: res.data.pagination?.totalPages || 0
            }));
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
            setError(err.response?.data?.error || err.message || 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    const fetchStats = async () => {
        try {
            const res = await http.get('/activity-logs/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.action && { action: filters.action }),
                ...(filters.entityType && { entityType: filters.entityType }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            });

            const res = await http.get(`/activity-logs/export?${params}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export logs:', error);
            alert('Failed to export logs');
        }
    };

    const getActionIcon = (action) => {
        const icons = {
            login: <LogIn size={16} style={{ color: 'var(--success)' }} />,
            logout: <LogOut size={16} style={{ color: 'var(--text-muted)' }} />,
            create: <Plus size={16} style={{ color: 'var(--primary)' }} />,
            update: <Edit3 size={16} style={{ color: 'var(--warning)' }} />,
            delete: <Trash2 size={16} style={{ color: 'var(--danger)' }} />,
            upload: <Upload size={16} style={{ color: 'var(--primary-light)' }} />,
            download: <Download size={16} style={{ color: 'var(--info)' }} />,
            view: <Eye size={16} style={{ color: 'var(--text-muted)' }} />
        };
        return icons[action] || <Activity size={16} style={{ color: 'var(--text-muted)' }} />;
    };

    const getActionBadge = (action) => {
        const styles = {
            login: { bg: 'var(--success-bg)', color: 'var(--success)' },
            logout: { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
            create: { bg: 'var(--primary-bg)', color: 'var(--primary)' },
            update: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
            delete: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
            upload: { bg: 'var(--primary-bg)', color: 'var(--primary-light)' },
            download: { bg: 'var(--info-bg)', color: 'var(--info)' },
            view: { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
            register: { bg: 'var(--success-bg)', color: 'var(--success)' }
        };
        const style = styles[action] || styles.view;
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: style.bg,
                color: style.color,
                textTransform: 'capitalize'
            }}>
                {getActionIcon(action)}
                {action}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            entityType: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const hasActiveFilters = Object.values(filters).some(v => v);

    return (
        <Dashboard>
            <div className="scrollbar-modern" style={{ padding: '2rem', height: '100%', overflow: 'auto', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Error Display */}
                    {error && (
                        <div className="animate-fadeInUp" style={{
                            padding: '1rem 1.5rem',
                            marginBottom: '1.5rem',
                            background: 'var(--danger-bg)',
                            border: '1px solid var(--danger)',
                            borderRadius: '12px',
                            color: 'var(--danger-text)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>Error: {error}</span>
                            <button
                                onClick={() => setError(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-text)' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Activity Logs
                                </h1>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>
                                    Track all system activities and user actions
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`btn-modern ${showFilters ? 'btn-modern-primary' : 'btn-modern-secondary'}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Filter size={16} />
                                    Filters
                                    {hasActiveFilters && (
                                        <span style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 18,
                                            height: 18,
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            !
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="btn-modern btn-modern-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Download size={16} />
                                    Export CSV
                                </button>
                                <button
                                    onClick={fetchLogs}
                                    className="btn-modern btn-modern-secondary"
                                    style={{ padding: '0.625rem' }}
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="animate-fadeInUp" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            animationDelay: '50ms'
                        }}>
                            <StatCard
                                icon={Activity}
                                label="Total Activities"
                                value={stats.total?.toLocaleString() || 0}
                                gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                            />
                            <StatCard
                                icon={Clock}
                                label="Last 24 Hours"
                                value={stats.recentCount?.toLocaleString() || 0}
                                gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                            />
                            <StatCard
                                icon={Plus}
                                label="Creates"
                                value={stats.byAction?.create || 0}
                                gradient="linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)"
                            />
                            <StatCard
                                icon={LogIn}
                                label="Logins"
                                value={stats.byAction?.login || 0}
                                gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                            />
                        </div>
                    )}

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="card-modern animate-fadeInUp" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Filters</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--primary)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <X size={14} />
                                        Clear all
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Action
                                    </label>
                                    <select
                                        value={filters.action}
                                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                        className="input-modern"
                                    >
                                        <option value="">All Actions</option>
                                        <option value="login">Login</option>
                                        <option value="logout">Logout</option>
                                        <option value="create">Create</option>
                                        <option value="update">Update</option>
                                        <option value="delete">Delete</option>
                                        <option value="upload">Upload</option>
                                        <option value="download">Download</option>
                                        <option value="view">View</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Entity Type
                                    </label>
                                    <select
                                        value={filters.entityType}
                                        onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                                        className="input-modern"
                                    >
                                        <option value="">All Types</option>
                                        <option value="auth">Auth</option>
                                        <option value="task">Task</option>
                                        <option value="employee">Employee</option>
                                        <option value="document">Document</option>
                                        <option value="attendance">Attendance</option>
                                        <option value="leave">Leave</option>
                                        <option value="goal">Goal</option>
                                        <option value="department">Department</option>
                                        <option value="role">Role</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="input-modern"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="input-modern"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Search
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={filters.search}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                            placeholder="Search descriptions..."
                                            className="input-modern"
                                            style={{ paddingLeft: '38px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs Table */}
                    <div className="card-modern animate-fadeInUp" style={{ overflow: 'hidden', animationDelay: '100ms' }}>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <div className="animate-spin" style={{
                                    width: 40,
                                    height: 40,
                                    border: '4px solid var(--border-color)',
                                    borderTopColor: 'var(--primary)',
                                    borderRadius: '50%',
                                    margin: '0 auto 1rem'
                                }} />
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading activity logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <Activity size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>No activity logs found</h3>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'Activity will appear here as users interact with the system'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)' }}>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Entity</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Description</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    {getActionBadge(log.action)}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        background: 'var(--bg-tertiary)',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-primary)',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {log.entity_type}
                                                        {log.entity_id && <span style={{ color: 'var(--text-muted)' }}> #{log.entity_id.slice(0, 8)}</span>}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem', maxWidth: '400px' }}>
                                                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {log.description}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '8px',
                                                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700
                                                        }}>
                                                            {log.user?.email?.charAt(0).toUpperCase() || log.employee?.name?.charAt(0).toUpperCase() || '?'}
                                                        </span>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                            {log.user?.email || log.employee?.name || 'System'}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                    {formatDate(log.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div style={{
                                    padding: '1rem 1.5rem',
                                    borderTop: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--bg-secondary)'
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page <= 1}
                                            className="btn-modern btn-modern-secondary"
                                            style={{ padding: '0.5rem 0.75rem', opacity: pagination.page <= 1 ? 0.5 : 1 }}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0 1rem',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-primary)',
                                            fontWeight: 500
                                        }}>
                                            Page {pagination.page} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page >= pagination.totalPages}
                                            className="btn-modern btn-modern-secondary"
                                            style={{ padding: '0.5rem 0.75rem', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

const StatCard = ({ icon: Icon, label, value, gradient }) => (
    <div className="card-modern" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon size={20} color="white" />
        </div>
        <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
        </div>
    </div>
);

export default ActivityLogsPage;
