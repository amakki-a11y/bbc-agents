import { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Shield, Eye, Edit3, Crown, Loader2, Search } from 'lucide-react';
import { http } from '../api/http';

const ROLE_CONFIG = {
    viewer: { icon: Eye, label: 'Viewer', description: 'Can view tasks and progress', color: '#6b7280' },
    editor: { icon: Edit3, label: 'Editor', description: 'Can edit tasks and add new ones', color: '#3b82f6' },
    admin: { icon: Shield, label: 'Admin', description: 'Full access including settings', color: '#7c3aed' }
};

const ProjectShareModal = ({ isOpen, onClose, project, onMembersUpdate }) => {
    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [_loading, _setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('editor');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && project) {
            fetchMembers();
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, project]);

    const fetchMembers = async () => {
        try {
            const res = await http.get(`/projects/${project.id}/members`);
            setMembers(res.data || []);
        } catch (err) {
            // Endpoint might not exist yet, silently fail
            console.log('Members endpoint not available');
            setMembers([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await http.get('/users');
            setUsers(res.data || []);
        } catch (err) {
            console.log('Users endpoint not available');
            setUsers([]);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUser) return;

        setAdding(true);
        setError(null);

        try {
            await http.post(`/projects/${project.id}/members`, {
                userId: selectedUser.id,
                role: selectedRole
            });
            await fetchMembers();
            setSelectedUser(null);
            setSearchQuery('');
            onMembersUpdate?.();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Remove this member from the project?')) return;

        try {
            await http.delete(`/projects/${project.id}/members/${memberId}`);
            setMembers(prev => prev.filter(m => m.id !== memberId));
            onMembersUpdate?.();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove member');
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await http.patch(`/projects/${project.id}/members/${memberId}`, { role: newRole });
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
            onMembersUpdate?.();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update role');
        }
    };

    const filteredUsers = users.filter(u => {
        const isMember = members.some(m => m.user_id === u.id);
        const isOwner = u.id === project?.user_id;
        const matchesSearch = u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchQuery.toLowerCase());
        return !isMember && !isOwner && matchesSearch;
    });

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '85vh',
                overflow: 'hidden',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            background: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280'
                        }}>
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                                Share Project
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                                {project?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', flex: 1, overflow: 'auto' }}>
                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Add Member Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#374151'
                        }}>
                            Add people
                        </label>

                        {/* Search Input */}
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <Search size={16} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by email or name..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.15s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#a78bfa'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {/* User Search Results */}
                        {searchQuery && filteredUsers.length > 0 && (
                            <div style={{
                                maxHeight: '150px',
                                overflow: 'auto',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                marginBottom: '12px'
                            }}>
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => { setSelectedUser(user); setSearchQuery(''); }}
                                        style={{
                                            padding: '10px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            background: selectedUser?.id === user.id ? '#f3f4f6' : 'white',
                                            borderBottom: '1px solid #f3f4f6'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={e => e.currentTarget.style.background = selectedUser?.id === user.id ? '#f3f4f6' : 'white'}
                                    >
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: '#6b7280'
                                        }}>
                                            {(user.username || user.email)?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1f2937' }}>
                                                {user.username || 'User'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected User & Role */}
                        {selectedUser && (
                            <div style={{
                                padding: '12px',
                                background: '#f9fafb',
                                borderRadius: '10px',
                                marginBottom: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: '#7c3aed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600
                                        }}>
                                            {(selectedUser.username || selectedUser.email)?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#1f2937' }}>
                                                {selectedUser.username || 'User'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {selectedUser.email}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#9ca3af',
                                            padding: '4px'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Role Selection */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                border: selectedRole === role ? `2px solid ${config.color}` : '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                background: selectedRole === role ? `${config.color}10` : 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <config.icon size={16} style={{ color: config.color }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: config.color }}>
                                                {config.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleAddMember}
                                    disabled={adding}
                                    style={{
                                        width: '100%',
                                        marginTop: '12px',
                                        padding: '10px',
                                        background: '#7c3aed',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: adding ? 'not-allowed' : 'pointer',
                                        opacity: adding ? 0.7 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {adding ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={16} />}
                                    {adding ? 'Adding...' : 'Add Member'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Current Members */}
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#374151'
                        }}>
                            Project members ({members.length + 1})
                        </label>

                        {/* Owner */}
                        <div style={{
                            padding: '12px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600
                                }}>
                                    <Crown size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>You (Owner)</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Full control</div>
                                </div>
                            </div>
                        </div>

                        {/* Members List */}
                        {members.map(member => {
                            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                            return (
                                <div
                                    key={member.id}
                                    style={{
                                        padding: '12px',
                                        background: '#f9fafb',
                                        borderRadius: '10px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: '#6b7280'
                                        }}>
                                            {(member.user?.username || member.user?.email || 'U')?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#1f2937' }}>
                                                {member.user?.username || 'User'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {member.user?.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <select
                                            value={member.role}
                                            onChange={e => handleUpdateRole(member.id, e.target.value)}
                                            style={{
                                                padding: '6px 10px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                color: roleConfig.color,
                                                fontWeight: 600,
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                                                <option key={role} value={role}>{config.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '6px'
                                            }}
                                            title="Remove member"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {members.length === 0 && (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#9ca3af',
                                fontSize: '0.9rem'
                            }}>
                                No members yet. Add someone above!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default ProjectShareModal;
