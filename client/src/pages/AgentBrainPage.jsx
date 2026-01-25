import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    Brain, Activity, CheckCircle2, XCircle, AlertTriangle, RotateCcw,
    ChevronDown, ChevronUp, Search, Filter, RefreshCw, Eye, Clock,
    Zap, Target, TrendingUp, BarChart3, User, Calendar, X, MessageSquare
} from 'lucide-react';

const AgentBrainPage = () => {
    const [actions, setActions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterAgent, setFilterAgent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [showReviewModal, setShowReviewModal] = useState(null);

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'success', label: 'Success' },
        { value: 'failed', label: 'Failed' },
        { value: 'flagged_for_review', label: 'Needs Review' },
        { value: 'rolled_back', label: 'Rolled Back' }
    ];

    const fetchStats = useCallback(async () => {
        try {
            const res = await http.get('/agent-actions/stats?days=30');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchActions = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '25'
            });
            if (filterStatus) params.append('status', filterStatus);
            if (filterAgent) params.append('agent_name', filterAgent);

            const res = await http.get(`/agent-actions?${params}`);
            setActions(res.data.actions || []);
            setPagination(res.data.pagination || { total: 0, totalPages: 1 });
        } catch (error) {
            console.error('Failed to fetch actions:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filterStatus, filterAgent]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchActions();
    }, [fetchActions]);

    const handleReview = async (actionId, reviewNotes, newStatus) => {
        try {
            await http.post(`/agent-actions/${actionId}/review`, {
                review_notes: reviewNotes,
                new_status: newStatus
            });
            fetchActions();
            fetchStats();
            setShowReviewModal(null);
        } catch (error) {
            console.error('Failed to review action:', error);
            alert('Failed to submit review');
        }
    };

    const handleRollback = async (actionId) => {
        if (!window.confirm('Are you sure you want to roll back this action?')) return;
        try {
            await http.post(`/agent-actions/${actionId}/rollback`, {
                reason: 'Manual rollback by user'
            });
            fetchActions();
            fetchStats();
        } catch (error) {
            console.error('Failed to rollback action:', error);
            alert('Failed to rollback action');
        }
    };

    const getConfidenceColor = (score) => {
        if (score >= 0.7) return { bg: '#dcfce7', color: '#16a34a', label: 'High' };
        if (score >= 0.5) return { bg: '#fef9c3', color: '#ca8a04', label: 'Medium' };
        return { bg: '#fee2e2', color: '#dc2626', label: 'Low' };
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#16a34a', icon: CheckCircle2, label: 'Success' },
            failed: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#dc2626', icon: XCircle, label: 'Failed' },
            flagged_for_review: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#d97706', icon: AlertTriangle, label: 'Needs Review' },
            rolled_back: { bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5', icon: RotateCcw, label: 'Rolled Back' }
        };
        const style = styles[status] || styles.failed;
        const Icon = style.icon;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.375rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem'
            }}>
                <Icon size={14} />
                {style.label}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const uniqueAgents = [...new Set(actions.map(a => a.agent_name).filter(Boolean))];

    const filteredActions = actions.filter(action => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            action.agent_name?.toLowerCase().includes(query) ||
            action.action?.toLowerCase().includes(query) ||
            action.entity_type?.toLowerCase().includes(query) ||
            action.reasoning?.toLowerCase().includes(query)
        );
    });

    return (
        <Dashboard>
            <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }} className="scrollbar-thin">
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div>
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                                    padding: '0.625rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Brain size={24} color="white" />
                                </div>
                                Agent Brain
                            </h1>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Monitor AI agent decisions, confidence scores, and review actions
                            </p>
                        </div>
                        <button
                            onClick={() => { fetchActions(); fetchStats(); }}
                            className="btn-modern"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div className="card-modern" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    padding: '0.75rem',
                                    borderRadius: '12px'
                                }}>
                                    <Activity size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {stats.totalActions}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Actions (30d)</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-modern" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                    padding: '0.75rem',
                                    borderRadius: '12px'
                                }}>
                                    <TrendingUp size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {stats.successRate}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Success Rate</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-modern" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                    padding: '0.75rem',
                                    borderRadius: '12px'
                                }}>
                                    <Target size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {(parseFloat(stats.averageConfidence) * 100).toFixed(0)}%
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Confidence</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-modern" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                                    padding: '0.75rem',
                                    borderRadius: '12px'
                                }}>
                                    <AlertTriangle size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {stats.needsReview}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Needs Review</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agent Breakdown */}
                {stats?.byAgent?.length > 0 && (
                    <div className="card-modern" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Agent Performance
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {stats.byAgent.map(agent => (
                                <div
                                    key={agent.agent}
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        flex: '1',
                                        minWidth: '180px'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                        {agent.agent}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span>{agent.count} actions</span>
                                        <span style={{
                                            color: parseFloat(agent.avgConfidence) >= 0.7 ? '#16a34a' :
                                                   parseFloat(agent.avgConfidence) >= 0.5 ? '#ca8a04' : '#dc2626'
                                        }}>
                                            {(parseFloat(agent.avgConfidence) * 100).toFixed(0)}% confidence
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card-modern" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{
                            flex: 1,
                            minWidth: '250px',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '10px',
                            padding: '0.5rem 1rem',
                            gap: '0.75rem'
                        }}>
                            <Search size={18} style={{ color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Search actions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem'
                                }}
                            />
                            {searchQuery && (
                                <X
                                    size={16}
                                    style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                                    onClick={() => setSearchQuery('')}
                                />
                            )}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="input-modern"
                            style={{ minWidth: '160px' }}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Agent Filter */}
                        <select
                            value={filterAgent}
                            onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }}
                            className="input-modern"
                            style={{ minWidth: '160px' }}
                        >
                            <option value="">All Agents</option>
                            {uniqueAgents.map(agent => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Actions Table */}
                <div className="card-modern" style={{ overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                            Loading agent actions...
                        </div>
                    ) : filteredActions.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Brain size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No agent actions found</p>
                        </div>
                    ) : (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', width: '30px' }}></th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agent</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredActions.map((action, index) => {
                                        const isExpanded = expandedId === action.id;
                                        const confidence = getConfidenceColor(action.confidence_score);

                                        return (
                                            <>
                                                <tr
                                                    key={action.id}
                                                    style={{
                                                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)',
                                                        transition: 'background 0.15s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setExpandedId(isExpanded ? null : action.id)}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '1rem', width: '30px' }}>
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                                                                padding: '0.5rem',
                                                                borderRadius: '8px'
                                                            }}>
                                                                <Zap size={16} color="white" />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                    {action.agent_name}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {action.entity_type}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                        {action.action}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {getStatusBadge(action.status)}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: '60px',
                                                                height: '8px',
                                                                background: 'var(--bg-tertiary)',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    width: `${(action.confidence_score || 0) * 100}%`,
                                                                    height: '100%',
                                                                    background: confidence.color,
                                                                    borderRadius: '4px',
                                                                    transition: 'width 0.3s ease'
                                                                }} />
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                color: confidence.color,
                                                                minWidth: '40px'
                                                            }}>
                                                                {((action.confidence_score || 0) * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                            <Clock size={14} />
                                                            {formatDate(action.created_at)}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            {action.status === 'flagged_for_review' && !action.reviewed_at && (
                                                                <button
                                                                    onClick={() => setShowReviewModal(action)}
                                                                    title="Review"
                                                                    className="btn-modern btn-modern-primary"
                                                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                                                                >
                                                                    <Eye size={14} />
                                                                    Review
                                                                </button>
                                                            )}
                                                            {action.status === 'success' && (
                                                                <button
                                                                    onClick={() => handleRollback(action.id)}
                                                                    title="Rollback"
                                                                    style={{
                                                                        background: 'var(--bg-tertiary)',
                                                                        border: 'none',
                                                                        padding: '0.5rem',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        color: 'var(--text-secondary)',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = 'var(--danger)';
                                                                        e.currentTarget.style.color = 'white';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                                    }}
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={7} style={{
                                                            padding: '0 1rem 1rem 1rem',
                                                            background: 'var(--bg-secondary)',
                                                            borderBottom: '1px solid var(--border-color)'
                                                        }}>
                                                            <div style={{
                                                                background: 'var(--bg-card)',
                                                                borderRadius: '12px',
                                                                padding: '1.25rem',
                                                                marginTop: '0.5rem'
                                                            }}>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                                    {/* Reasoning */}
                                                                    <div>
                                                                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <MessageSquare size={14} /> Reasoning
                                                                        </h4>
                                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                                            {action.reasoning || 'No reasoning provided'}
                                                                        </p>
                                                                    </div>

                                                                    {/* Input Data */}
                                                                    {action.input_data && (
                                                                        <div>
                                                                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                                Input Data
                                                                            </h4>
                                                                            <pre style={{
                                                                                margin: 0,
                                                                                fontSize: '0.75rem',
                                                                                color: 'var(--text-muted)',
                                                                                background: 'var(--bg-tertiary)',
                                                                                padding: '0.75rem',
                                                                                borderRadius: '8px',
                                                                                overflow: 'auto',
                                                                                maxHeight: '150px'
                                                                            }}>
                                                                                {typeof action.input_data === 'string'
                                                                                    ? action.input_data
                                                                                    : JSON.stringify(action.input_data, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}

                                                                    {/* Output Data */}
                                                                    {action.output_data && (
                                                                        <div>
                                                                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                                Output Data
                                                                            </h4>
                                                                            <pre style={{
                                                                                margin: 0,
                                                                                fontSize: '0.75rem',
                                                                                color: 'var(--text-muted)',
                                                                                background: 'var(--bg-tertiary)',
                                                                                padding: '0.75rem',
                                                                                borderRadius: '8px',
                                                                                overflow: 'auto',
                                                                                maxHeight: '150px'
                                                                            }}>
                                                                                {typeof action.output_data === 'string'
                                                                                    ? action.output_data
                                                                                    : JSON.stringify(action.output_data, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}

                                                                    {/* Review Info */}
                                                                    {action.reviewed_at && (
                                                                        <div>
                                                                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                                Review
                                                                            </h4>
                                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                                <p style={{ margin: '0 0 0.25rem' }}>
                                                                                    <strong>Reviewed by:</strong> {action.reviewer?.name || 'Unknown'}
                                                                                </p>
                                                                                <p style={{ margin: '0 0 0.25rem' }}>
                                                                                    <strong>Date:</strong> {formatDate(action.reviewed_at)}
                                                                                </p>
                                                                                {action.review_notes && (
                                                                                    <p style={{ margin: '0.5rem 0 0' }}>
                                                                                        <strong>Notes:</strong> {action.review_notes}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Action Metadata */}
                                                                <div style={{
                                                                    marginTop: '1rem',
                                                                    paddingTop: '1rem',
                                                                    borderTop: '1px solid var(--border-color)',
                                                                    display: 'flex',
                                                                    gap: '2rem',
                                                                    flexWrap: 'wrap',
                                                                    fontSize: '0.8rem',
                                                                    color: 'var(--text-muted)'
                                                                }}>
                                                                    <span><strong>ID:</strong> {action.id}</span>
                                                                    {action.entity_id && <span><strong>Entity ID:</strong> {action.entity_id}</span>}
                                                                    <span><strong>Created:</strong> {formatDate(action.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div style={{
                                    padding: '1rem',
                                    borderTop: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Showing {filteredActions.length} of {pagination.total} actions
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="btn-modern"
                                            style={{ opacity: page === 1 ? 0.5 : 1 }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{
                                            padding: '0.5rem 1rem',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            Page {page} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="btn-modern"
                                            style={{ opacity: page === pagination.totalPages ? 0.5 : 1 }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Review Modal */}
                {showReviewModal && (
                    <ReviewModal
                        action={showReviewModal}
                        onClose={() => setShowReviewModal(null)}
                        onSubmit={handleReview}
                    />
                )}
            </div>
        </Dashboard>
    );
};

// Review Modal Component
const ReviewModal = ({ action, onClose, onSubmit }) => {
    const [notes, setNotes] = useState('');
    const [newStatus, setNewStatus] = useState('success');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(action.id, notes, newStatus);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100%', maxWidth: '520px' }}>
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
                            Review Agent Action
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {action.agent_name} - {action.action}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-tertiary)',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Action Details */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <strong>Reasoning:</strong>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {action.reasoning || 'No reasoning provided'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span><strong>Confidence:</strong> {((action.confidence_score || 0) * 100).toFixed(0)}%</span>
                        <span><strong>Entity:</strong> {action.entity_type}</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            Decision
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <label style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                background: newStatus === 'success' ? 'var(--success-bg, #dcfce7)' : 'var(--bg-tertiary)',
                                border: newStatus === 'success' ? '2px solid var(--success, #16a34a)' : '2px solid transparent',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.15s ease'
                            }}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="success"
                                    checked={newStatus === 'success'}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    style={{ display: 'none' }}
                                />
                                <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Approve</span>
                            </label>
                            <label style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                background: newStatus === 'failed' ? 'var(--danger-bg, #fee2e2)' : 'var(--bg-tertiary)',
                                border: newStatus === 'failed' ? '2px solid var(--danger, #dc2626)' : '2px solid transparent',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.15s ease'
                            }}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="failed"
                                    checked={newStatus === 'failed'}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    style={{ display: 'none' }}
                                />
                                <XCircle size={18} style={{ color: '#dc2626' }} />
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Reject</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            Review Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input-modern"
                            placeholder="Add notes about your decision..."
                            rows={4}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end',
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <button type="button" onClick={onClose} className="btn-modern">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-modern btn-modern-primary"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentBrainPage;
