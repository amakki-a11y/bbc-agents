import { useState, useEffect } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import { Search, Plus, Shield, Users, X, Save, Loader2, Edit2, Trash2, Check } from 'lucide-react';

// Available permissions
const PERMISSIONS = [
    { key: 'manage_departments', label: 'Manage Departments', description: 'Create, edit, and delete departments' },
    { key: 'manage_employees', label: 'Manage Employees', description: 'Create, edit, and delete employees' },
    { key: 'manage_roles', label: 'Manage Roles', description: 'Create, edit, and delete roles' },
    { key: 'view_all_tasks', label: 'View All Tasks', description: 'View tasks across all departments' },
    { key: 'view_department_tasks', label: 'View Department Tasks', description: 'View tasks within own department' },
    { key: 'manage_attendance', label: 'Manage Attendance', description: 'Manage employee attendance records' },
    { key: 'view_reports', label: 'View Reports', description: 'Access analytics and reports' },
    { key: 'send_announcements', label: 'Send Announcements', description: 'Send company-wide announcements' }
];

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await http.get('/api/roles');
            setRoles(response.data || []);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const filteredRoles = roles.filter(role =>
        role.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPermissionCount = (permissions) => {
        if (!permissions || typeof permissions !== 'object') return 0;
        return Object.values(permissions).filter(Boolean).length;
    };

    const getRoleColor = (index) => {
        const colors = [
            { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', light: '#ede9fe' },
            { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', light: '#dbeafe' },
            { bg: 'linear-gradient(135deg, #10b981, #059669)', light: '#d1fae5' },
            { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', light: '#fef3c7' },
            { bg: 'linear-gradient(135deg, #ec4899, #db2777)', light: '#fce7f3' },
            { bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', light: '#ccfbf1' }
        ];
        return colors[index % colors.length];
    };

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: '#f9fafb' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Shield size={22} style={{ color: 'white' }} />
                                </div>
                                Roles & Permissions
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: '8px', marginLeft: '52px', fontSize: '14px' }}>
                                Manage roles and their permissions
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: '#7b68ee',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#6366f1';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#7b68ee';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Plus size={18} /> Add Role
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                background: 'white',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#7b68ee';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123, 104, 238, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f0edff', padding: '20px', borderRadius: '12px', border: '1px solid #d4ccff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#7b68ee', fontSize: '14px', fontWeight: 500 }}>Total Roles</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#5b4dc7' }}>{roles.length}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Available Permissions</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#14532d' }}>{PERMISSIONS.length}</div>
                    </div>
                    <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#0369a1', fontSize: '14px', fontWeight: 500 }}>Employees Assigned</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#0c4a6e' }}>
                            {roles.reduce((sum, role) => sum + (role._count?.employees || 0), 0)}
                        </div>
                    </div>
                </div>

                {/* Roles Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        Loading roles...
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        No roles found
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {filteredRoles.map((role, index) => {
                            const color = getRoleColor(index);
                            const permCount = getPermissionCount(role.permissions);
                            return (
                                <div
                                    key={role.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #e5e7eb',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {/* Color Header */}
                                    <div style={{ height: '8px', background: color.bg }} />

                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: color.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white'
                                            }}>
                                                <Shield size={24} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => setSelectedRole(role)}
                                                    style={{
                                                        padding: '8px',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        background: 'white',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Edit role"
                                                >
                                                    <Edit2 size={16} color="#6b7280" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 8px' }}>
                                            {role.name}
                                        </h3>

                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px' }}>
                                                <Check size={16} />
                                                <span>{permCount} permission{permCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px' }}>
                                                <Users size={16} />
                                                <span>{role._count?.employees || 0} employee{(role._count?.employees || 0) !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>

                                        {/* Permission badges */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {PERMISSIONS.filter(p => role.permissions?.[p.key]).slice(0, 3).map(p => (
                                                <span key={p.key} style={{
                                                    padding: '4px 10px',
                                                    background: color.light,
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: '#374151'
                                                }}>
                                                    {p.label}
                                                </span>
                                            ))}
                                            {permCount > 3 && (
                                                <span style={{
                                                    padding: '4px 10px',
                                                    background: '#f3f4f6',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: '#6b7280'
                                                }}>
                                                    +{permCount - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Role Detail/Edit Modal */}
            {selectedRole && (
                <RoleDetailModal
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    onUpdate={fetchRoles}
                />
            )}

            {/* Add Role Modal */}
            {showAddForm && (
                <RoleFormModal
                    onClose={() => setShowAddForm(false)}
                    onSave={() => {
                        setShowAddForm(false);
                        fetchRoles();
                    }}
                />
            )}
        </Dashboard>
    );
};

// Role Detail/Edit Modal Component
const RoleDetailModal = ({ role, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: role.name,
        permissions: role.permissions || {}
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handlePermissionChange = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Role name is required');
            return;
        }
        try {
            setSaving(true);
            setError('');
            await http.put(`/api/roles/${role.id}`, formData);
            onUpdate();
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update role:', error);
            setError(error.response?.data?.error || 'Failed to update role');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            return;
        }
        try {
            setDeleting(true);
            setError('');
            await http.delete(`/api/roles/${role.id}`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to delete role:', error);
            setError(error.response?.data?.error || 'Failed to delete role');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '550px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Shield size={28} />
                        </div>
                        <div>
                            {isEditing ? (
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        width: '100%'
                                    }}
                                />
                            ) : (
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>
                                    {role.name}
                                </h2>
                            )}
                            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                                {role._count?.employees || 0} employee{(role._count?.employees || 0) !== 1 ? 's' : ''} with this role
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                    >
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {error && (
                        <div style={{
                            padding: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                        Permissions
                    </h3>

                    <div style={{ display: 'grid', gap: '8px' }}>
                        {PERMISSIONS.map(perm => {
                            const isChecked = isEditing ? formData.permissions[perm.key] : role.permissions?.[perm.key];
                            return (
                                <label
                                    key={perm.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: isChecked ? '#f5f3ff' : '#f9fafb',
                                        borderRadius: '8px',
                                        cursor: isEditing ? 'pointer' : 'default',
                                        border: isChecked ? '1px solid #ddd6fe' : '1px solid transparent'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => isEditing && handlePermissionChange(perm.key)}
                                        disabled={!isEditing}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            marginTop: '2px',
                                            cursor: isEditing ? 'pointer' : 'default'
                                        }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 500, color: '#1f2937' }}>{perm.label}</div>
                                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                            {perm.description}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div>
                        {!isEditing && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting || (role._count?.employees || 0) > 0}
                                style={{
                                    padding: '10px 16px',
                                    border: '1px solid #fecaca',
                                    background: '#fef2f2',
                                    borderRadius: '8px',
                                    cursor: (role._count?.employees || 0) > 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: 500,
                                    color: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: (role._count?.employees || 0) > 0 ? 0.5 : 1
                                }}
                                title={(role._count?.employees || 0) > 0 ? 'Cannot delete role with assigned employees' : 'Delete role'}
                            >
                                {deleting ? <Loader2 size={16} /> : <Trash2 size={16} />}
                                Delete
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({ name: role.name, permissions: role.permissions || {} });
                                        setError('');
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #e5e7eb',
                                        background: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {saving ? <Loader2 size={16} /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Edit2 size={16} />
                                Edit Role
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add Role Form Modal
const RoleFormModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        permissions: {}
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handlePermissionChange = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Role name is required');
            return;
        }
        try {
            setSaving(true);
            setError('');
            await http.post('/api/roles', formData);
            onSave();
        } catch (error) {
            console.error('Failed to create role:', error);
            setError(error.response?.data?.error || 'Failed to create role');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '550px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                        Add New Role
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                    >
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {error && (
                        <div style={{
                            padding: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                            Role Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                            placeholder="e.g., HR Manager"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>
                            Permissions
                        </label>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {PERMISSIONS.map(perm => (
                                <label
                                    key={perm.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: formData.permissions[perm.key] ? '#f5f3ff' : '#f9fafb',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        border: formData.permissions[perm.key] ? '1px solid #ddd6fe' : '1px solid transparent'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions[perm.key] || false}
                                        onChange={() => handlePermissionChange(perm.key)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            marginTop: '2px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 500, color: '#1f2937' }}>{perm.label}</div>
                                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                            {perm.description}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </form>

                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {saving ? <Loader2 size={16} /> : <Plus size={16} />}
                        Add Role
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RolesPage;
