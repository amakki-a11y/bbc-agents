import { useState, useEffect } from 'react';
import { X, Share2, Users, Briefcase, Building2, Trash2, Loader2 } from 'lucide-react';
import http from '../../api/http';

const PERMISSION_OPTIONS = [
    { value: 'VIEWER', label: 'Viewer', description: 'Can view project and tasks' },
    { value: 'EDITOR', label: 'Editor', description: 'Can edit tasks and add comments' },
    { value: 'ADMIN', label: 'Admin', description: 'Full access including sharing' }
];

function ShareModal({ isOpen, onClose, project, onShareUpdated }) {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [shareType, setShareType] = useState('user');
    const [selectedId, setSelectedId] = useState('');
    const [permission, setPermission] = useState('VIEWER');

    // Available options for sharing
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        if (isOpen && project) {
            fetchShares();
            fetchOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, project]);

    const fetchShares = async () => {
        try {
            setLoading(true);
            const response = await http.get(`/projects/${project.id}/shares`);
            setShares(response.data || []);
        } catch (err) {
            console.error('Error fetching shares:', err);
            setError('Failed to load sharing settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [usersRes, rolesRes, deptsRes] = await Promise.all([
                http.get('/employees').catch(() => ({ data: [] })),
                http.get('/roles').catch(() => ({ data: [] })),
                http.get('/departments').catch(() => ({ data: [] }))
            ]);
            setUsers(usersRes.data || []);
            setRoles(rolesRes.data || []);
            setDepartments(deptsRes.data || []);
        } catch (err) {
            console.error('Error fetching options:', err);
        }
    };

    const handleShare = async () => {
        if (!selectedId) {
            setError('Please select who to share with');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const shareData = { permission };

            if (shareType === 'user') {
                shareData.userId = selectedId;
            } else if (shareType === 'role') {
                shareData.roleId = selectedId;
            } else if (shareType === 'department') {
                shareData.departmentId = selectedId;
            }

            await http.post(`/projects/${project.id}/share`, shareData);
            await fetchShares();
            setSelectedId('');
            setPermission('VIEWER');

            if (onShareUpdated) {
                onShareUpdated();
            }
        } catch (err) {
            console.error('Error sharing project:', err);
            setError(err.response?.data?.error || 'Failed to share project');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveShare = async (shareId) => {
        try {
            await http.delete(`/projects/${project.id}/share/${shareId}`);
            await fetchShares();

            if (onShareUpdated) {
                onShareUpdated();
            }
        } catch (err) {
            console.error('Error removing share:', err);
            setError(err.response?.data?.error || 'Failed to remove share');
        }
    };

    const getShareOptions = () => {
        switch (shareType) {
            case 'user':
                return users.filter(u =>
                    u.id !== project.creatorId &&
                    !shares.some(s => s.sharedWithUserId === u.id)
                );
            case 'role':
                return roles.filter(r =>
                    !shares.some(s => s.sharedWithRoleId === r.id)
                );
            case 'department':
                return departments.filter(d =>
                    !shares.some(s => s.sharedWithDeptId === d.id)
                );
            default:
                return [];
        }
    };

    const getShareIcon = (share) => {
        if (share.sharedWithUserId) return <Users size={16} />;
        if (share.sharedWithRoleId) return <Briefcase size={16} />;
        if (share.sharedWithDeptId) return <Building2 size={16} />;
        return <Users size={16} />;
    };

    const getShareName = (share) => {
        if (share.sharedWithUser) return share.sharedWithUser.name;
        if (share.sharedWithRole) return share.sharedWithRole.name;
        if (share.sharedWithDept) return share.sharedWithDept.name;
        return 'Unknown';
    };

    const getShareType = (share) => {
        if (share.sharedWithUserId) return 'User';
        if (share.sharedWithRoleId) return 'Role';
        if (share.sharedWithDeptId) return 'Department';
        return '';
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '550px',
                    margin: '1rem',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Share2 size={20} color="#6366f1" />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>
                                Share Project
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                                {project?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Share Form */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#374151',
                            margin: '0 0 0.75rem 0'
                        }}>
                            Add people or groups
                        </h3>

                        {/* Share Type Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            {[
                                { value: 'user', label: 'User', icon: Users },
                                { value: 'role', label: 'Role', icon: Briefcase },
                                { value: 'department', label: 'Department', icon: Building2 }
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => { setShareType(value); setSelectedId(''); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        background: shareType === value ? '#eef2ff' : '#f9fafb',
                                        color: shareType === value ? '#6366f1' : '#6b7280',
                                        border: shareType === value ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Select & Permission */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    background: 'white'
                                }}
                            >
                                <option value="">Select {shareType}...</option>
                                {getShareOptions().map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={permission}
                                onChange={(e) => setPermission(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    background: 'white',
                                    minWidth: '120px'
                                }}
                            >
                                {PERMISSION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleShare}
                                disabled={saving || !selectedId}
                                style={{
                                    padding: '10px 18px',
                                    background: saving || !selectedId ? '#a5b4fc' : '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    cursor: saving || !selectedId ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {saving ? (
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Share2 size={16} />
                                )}
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Current Shares */}
                    <div>
                        <h3 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#374151',
                            margin: '0 0 0.75rem 0'
                        }}>
                            People with access
                        </h3>

                        {loading ? (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}>
                                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : shares.length === 0 ? (
                            <div style={{
                                padding: '1.5rem',
                                textAlign: 'center',
                                color: '#9ca3af',
                                fontSize: '0.9rem',
                                background: '#f9fafb',
                                borderRadius: '8px'
                            }}>
                                No one else has access to this project yet
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                {/* Project Owner */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: '#6366f1',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}>
                                            {project.creator?.name?.charAt(0) || 'O'}
                                        </div>
                                        <div>
                                            <p style={{
                                                margin: 0,
                                                fontWeight: 500,
                                                color: '#1f2937',
                                                fontSize: '0.9rem'
                                            }}>
                                                {project.creator?.name || 'Project Owner'}
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.75rem',
                                                color: '#6b7280'
                                            }}>
                                                Owner
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: '#6366f1',
                                        fontWeight: 500
                                    }}>
                                        Owner
                                    </span>
                                </div>

                                {/* Shared With */}
                                {shares.map(share => (
                                    <div
                                        key={share.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem 1rem',
                                            background: '#f9fafb',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: '#e5e7eb',
                                                color: '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {getShareIcon(share)}
                                            </div>
                                            <div>
                                                <p style={{
                                                    margin: 0,
                                                    fontWeight: 500,
                                                    color: '#1f2937',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {getShareName(share)}
                                                </p>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280'
                                                }}>
                                                    {getShareType(share)}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                padding: '4px 10px',
                                                background: '#eef2ff',
                                                color: '#6366f1',
                                                borderRadius: '4px',
                                                fontWeight: 500
                                            }}>
                                                {share.permission}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveShare(share.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#9ca3af',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '4px',
                                                    transition: 'color 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default ShareModal;
