import React, { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import {
    Users,
    Search,
    Link as LinkIcon,
    Unlink,
    Trash2,
    User,
    Building2,
    Shield,
    CheckCircle,
    XCircle,
    Loader2,
    X,
    AlertCircle
} from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [unlinkedEmployees, setUnlinkedEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, linked, unlinked
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await http.get('/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            alert(error.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnlinkedEmployees = useCallback(async () => {
        try {
            const response = await http.get('/users/unlinked-employees');
            setUnlinkedEmployees(response.data || []);
        } catch (error) {
            console.error('Failed to fetch unlinked employees:', error);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchUnlinkedEmployees();
    }, [fetchUsers, fetchUnlinkedEmployees]);

    const handleLinkUser = async (userId, employeeId) => {
        try {
            setActionLoading(true);
            await http.post(`/users/${userId}/link`, { employeeId });
            setShowLinkModal(false);
            setSelectedUser(null);
            fetchUsers();
            fetchUnlinkedEmployees();
        } catch (error) {
            console.error('Failed to link user:', error);
            alert(error.response?.data?.error || 'Failed to link user to employee');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlinkUser = async (userId) => {
        if (!confirm('Are you sure you want to unlink this user from their employee profile?')) {
            return;
        }
        try {
            setActionLoading(true);
            await http.post(`/users/${userId}/unlink`);
            fetchUsers();
            fetchUnlinkedEmployees();
        } catch (error) {
            console.error('Failed to unlink user:', error);
            alert(error.response?.data?.error || 'Failed to unlink user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            setActionLoading(true);
            await http.delete(`/users/${userId}`);
            fetchUsers();
            fetchUnlinkedEmployees();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert(error.response?.data?.error || 'Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'linked') return matchesSearch && user.employee;
        if (filterStatus === 'unlinked') return matchesSearch && !user.employee;
        return matchesSearch;
    });

    const stats = {
        total: users.length,
        linked: users.filter(u => u.employee).length,
        unlinked: users.filter(u => !u.employee).length
    };

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            margin: 0
                        }}>
                            User Accounts
                        </h1>
                        <p style={{
                            color: 'var(--text-secondary)',
                            margin: '4px 0 0 0',
                            fontSize: '0.9rem'
                        }}>
                            Manage user accounts and link them to employee profiles
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Users size={20} color="#6366f1" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {stats.total}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Total Users
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <CheckCircle size={20} color="#10b981" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {stats.linked}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Linked to Employee
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <XCircle size={20} color="#f59e0b" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {stats.unlinked}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Not Linked
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        position: 'relative',
                        flex: '1',
                        minWidth: '250px'
                    }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search by email or employee name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Users</option>
                        <option value="linked">Linked Only</option>
                        <option value="unlinked">Unlinked Only</option>
                    </select>
                </div>

                {/* Users Table */}
                <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden'
                }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '60px',
                            color: 'var(--text-secondary)'
                        }}>
                            <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ marginLeft: '12px' }}>Loading users...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px',
                            color: 'var(--text-secondary)'
                        }}>
                            <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>No users found</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)' }}>
                                    <th style={{
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>User</th>
                                    <th style={{
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Linked Employee</th>
                                    <th style={{
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Department / Role</th>
                                    <th style={{
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Status</th>
                                    <th style={{
                                        padding: '14px 16px',
                                        textAlign: 'right',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        style={{
                                            borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    background: 'var(--primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontWeight: '500',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {user.email}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        ID: {user.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {user.employee ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={16} color="var(--text-secondary)" />
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                                                        {user.employee.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    Not linked
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {user.employee ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Building2 size={14} color="var(--text-secondary)" />
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                            {user.employee.department?.name || '-'}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Shield size={14} color="var(--text-secondary)" />
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                            {user.employee.role?.name || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {user.employee ? (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '500'
                                                }}>
                                                    <CheckCircle size={14} />
                                                    Linked
                                                </span>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                    color: '#f59e0b',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '500'
                                                }}>
                                                    <AlertCircle size={14} />
                                                    Unlinked
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                {user.employee ? (
                                                    <button
                                                        onClick={() => handleUnlinkUser(user.id)}
                                                        disabled={actionLoading}
                                                        title="Unlink from employee"
                                                        style={{
                                                            padding: '8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-primary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#f59e0b',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        <Unlink size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowLinkModal(true);
                                                        }}
                                                        disabled={actionLoading}
                                                        title="Link to employee"
                                                        style={{
                                                            padding: '8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-primary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#10b981',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        <LinkIcon size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={actionLoading}
                                                    title="Delete user"
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-primary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#ef4444',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Link User Modal */}
            {showLinkModal && selectedUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)'
                                }}>
                                    Link User to Employee
                                </h2>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {selectedUser.email}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowLinkModal(false);
                                    setSelectedUser(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            padding: '24px',
                            overflow: 'auto',
                            flex: 1
                        }}>
                            {unlinkedEmployees.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p>No unlinked employees available</p>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        All employees are already linked to user accounts
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Select an employee to link:
                                    </p>
                                    {unlinkedEmployees.map(employee => (
                                        <div
                                            key={employee.id}
                                            onClick={() => handleLinkUser(selectedUser.id, employee.id)}
                                            style={{
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                            }}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '600'
                                            }}>
                                                {employee.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontWeight: '500',
                                                    color: 'var(--text-primary)',
                                                    marginBottom: '2px'
                                                }}>
                                                    {employee.name}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {employee.email}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '4px'
                                                }}>
                                                    {employee.department?.name} - {employee.role?.name}
                                                </div>
                                            </div>
                                            <LinkIcon size={18} color="var(--primary)" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </Dashboard>
    );
};

export default UsersPage;
