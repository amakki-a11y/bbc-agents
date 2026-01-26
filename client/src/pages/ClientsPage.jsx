import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientsContext';
import Dashboard from './Dashboard';
import AddClientModal from '../components/clients/AddClientModal';
import ImportClientsModal from '../components/clients/ImportClientsModal';
import {
    Users, UserPlus, Upload, Download, Search, Filter, MoreHorizontal,
    Phone, Mail, Building2, ChevronLeft, ChevronRight, TrendingUp,
    UserCheck, UserX, Clock, Flame, Thermometer, Snowflake
} from 'lucide-react';

const ClientsPage = () => {
    const navigate = useNavigate();
    const {
        clients,
        stats,
        loading,
        pagination,
        filters,
        setFilters,
        fetchClients,
        fetchStats,
        moveClient
    } = useClients();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchClients();
        fetchStats();
    }, []);

    useEffect(() => {
        const statusMap = {
            all: 'all',
            leads: 'LEAD',
            active: 'ACTIVE',
            lost: 'LOST',
            dormant: 'DORMANT'
        };
        setFilters(prev => ({ ...prev, status: statusMap[activeTab] }));
    }, [activeTab, setFilters]);

    useEffect(() => {
        fetchClients();
    }, [filters]);

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handleExport = () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        window.open(`${API_URL}/clients/export?format=csv&status=${filters.status}`, '_blank');
    };

    const handleMoveStatus = async (clientId, newStage) => {
        try {
            await moveClient(clientId, null, newStage);
            fetchClients();
        } catch (err) {
            console.error('Failed to move client:', err);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            LEAD: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'Lead' },
            ACTIVE: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', label: 'Active' },
            INACTIVE: { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', label: 'Inactive' },
            LOST: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Lost' },
            DORMANT: { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', label: 'Dormant' },
            BLACKLISTED: { bg: 'rgba(0, 0, 0, 0.15)', color: '#000', label: 'Blacklisted' }
        };
        const style = styles[status] || styles.INACTIVE;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                {style.label}
            </span>
        );
    };

    const getStageBadge = (stage) => {
        const styles = {
            NEW: { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },
            CONTACTED: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
            QUALIFIED: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' },
            PROPOSAL: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
            NEGOTIATION: { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308' },
            WON: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
            LOST: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
            RECONNECTED: { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }
        };
        const style = styles[stage] || { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af' };
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                {stage}
            </span>
        );
    };

    const getRatingIcon = (rating) => {
        if (rating === 'HOT') return <Flame size={14} style={{ color: '#ef4444' }} />;
        if (rating === 'WARM') return <Thermometer size={14} style={{ color: '#f97316' }} />;
        if (rating === 'COLD') return <Snowflake size={14} style={{ color: '#3b82f6' }} />;
        return null;
    };

    const tabs = [
        { id: 'all', label: 'All Contacts', count: stats?.total || 0, icon: Users },
        { id: 'leads', label: 'Leads', count: stats?.byStatus?.LEAD || 0, icon: TrendingUp },
        { id: 'active', label: 'Active', count: stats?.byStatus?.ACTIVE || 0, icon: UserCheck },
        { id: 'lost', label: 'Lost', count: stats?.byStatus?.LOST || 0, icon: UserX },
        { id: 'dormant', label: 'Dormant', count: stats?.byStatus?.DORMANT || 0, icon: Clock }
    ];

    const stages = [
        { value: 'NEW', label: 'New' },
        { value: 'CONTACTED', label: 'Contacted' },
        { value: 'QUALIFIED', label: 'Qualified' },
        { value: 'PROPOSAL', label: 'Proposal' },
        { value: 'NEGOTIATION', label: 'Negotiation' },
        { value: 'WON', label: 'Won' },
        { value: 'LOST', label: 'Lost' },
        { value: 'RECONNECTED', label: 'Reconnected' }
    ];

    return (
        <Dashboard>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Users size={28} color="var(--primary)" />
                                CRM
                            </h1>
                            <p style={{
                                color: 'var(--text-muted)',
                                margin: '0.5rem 0 0 0',
                                fontSize: '0.95rem'
                            }}>
                                Manage your clients and leads
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-modern btn-modern-primary"
                            >
                                <UserPlus size={18} />
                                Add Contact
                            </button>
                            <button
                                onClick={() => setShowImportModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                <Upload size={18} />
                                Import
                            </button>
                            <button
                                onClick={handleExport}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                <Download size={18} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            padding: '1rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Total Contacts</p>
                            <p style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                                {stats?.total || 0}
                            </p>
                        </div>
                        <div style={{
                            padding: '1rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>New This Month</p>
                            <p style={{ color: 'var(--primary)', fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                                {stats?.newThisMonth || 0}
                            </p>
                        </div>
                        <div style={{
                            padding: '1rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Converted</p>
                            <p style={{ color: '#22c55e', fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                                {stats?.convertedThisMonth || 0}
                            </p>
                        </div>
                        <div style={{
                            padding: '1rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Active Leads</p>
                            <p style={{ color: '#f97316', fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                                {stats?.byStatus?.LEAD || 0}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-secondary)',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                <span style={{
                                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem'
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters & Search */}
                <div style={{
                    padding: '1rem 2rem',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'var(--bg-secondary)',
                        padding: '0.625rem 1rem',
                        borderRadius: '10px',
                        width: '320px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <Search size={18} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={handleSearch}
                            placeholder="Search clients..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                width: '100%',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <select
                            value={filters.stage}
                            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
                            style={{
                                padding: '0.625rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Stages</option>
                            {stages.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden'
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '3fr 2fr 2fr 2fr 1.5fr 1fr',
                            gap: '1rem',
                            padding: '1rem 1.5rem',
                            background: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <div>Contact</div>
                            <div>Phone</div>
                            <div>Owner</div>
                            <div>Stage</div>
                            <div>Last Activity</div>
                            <div>Actions</div>
                        </div>

                        {/* Table Body */}
                        {loading ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: 'var(--text-muted)'
                            }}>
                                Loading clients...
                            </div>
                        ) : clients.length === 0 ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: 'var(--text-muted)'
                            }}>
                                <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ margin: 0 }}>No clients found</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn-modern btn-modern-primary"
                                    style={{ marginTop: '1rem' }}
                                >
                                    <UserPlus size={16} />
                                    Add Your First Contact
                                </button>
                            </div>
                        ) : (
                            clients.map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '3fr 2fr 2fr 2fr 1.5fr 1fr',
                                        gap: '1rem',
                                        padding: '1rem 1.5rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Contact */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'var(--primary-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}>
                                            {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {client.firstName} {client.lastName}
                                                </span>
                                                {getRatingIcon(client.rating)}
                                            </div>
                                            {client.companyName && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    <Building2 size={12} />
                                                    {client.companyName}
                                                </div>
                                            )}
                                            {client.email && (
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    {client.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        {client.phone || '-'}
                                    </div>

                                    {/* Owner */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            fontWeight: 600
                                        }}>
                                            {client.owner?.name?.charAt(0) || '?'}
                                        </div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {client.owner?.name || 'Unassigned'}
                                        </span>
                                    </div>

                                    {/* Stage */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={client.stage}
                                            onChange={(e) => handleMoveStatus(client.id, e.target.value)}
                                            style={{
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {stages.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Last Activity */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        }) : '-'}
                                    </div>

                                    {/* Actions */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: 500
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '1rem',
                            padding: '0 0.5rem'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchClients({ page: pagination.page - 1 })}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-card)',
                                        cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                                        opacity: pagination.page === 1 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => fetchClients({ page: pagination.page + 1 })}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-card)',
                                        cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                                        opacity: pagination.page === pagination.totalPages ? 0.5 : 1
                                    }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {showAddModal && (
                    <AddClientModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchClients();
                            fetchStats();
                        }}
                    />
                )}

                {showImportModal && (
                    <ImportClientsModal
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            setShowImportModal(false);
                            fetchClients();
                            fetchStats();
                        }}
                    />
                )}
            </div>
        </Dashboard>
    );
};

export default ClientsPage;
