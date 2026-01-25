import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Shield, Users, Edit2, Copy, Trash2, Check, Clock, User,
    ChevronRight, Loader2, AlertTriangle, UserCheck, Heart, Eye, Crown, Star,
    Building, CheckSquare, Target, MessageCircle, BarChart2, Bot, Settings
} from 'lucide-react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import { PERMISSION_CATEGORIES, getPermissionName } from '../config/permissions';
import RoleFormModal from '../components/roles/RoleFormModal';

// Icon component mapper
const IconComponent = ({ name, size = 24, ...props }) => {
    const icons = {
        shield: Shield, users: Users, user: User, 'user-check': UserCheck,
        'heart-handshake': Heart, eye: Eye, crown: Crown, star: Star,
        building: Building, 'check-square': CheckSquare, clock: Clock,
        target: Target, 'message-circle': MessageCircle, 'bar-chart-2': BarChart2,
        bot: Bot, settings: Settings
    };
    const Icon = icons[name?.toLowerCase()] || Shield;
    return <Icon size={size} {...props} />;
};

const RoleDetailsPage = () => {
    const { roleId } = useParams();
    const navigate = useNavigate();

    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('permissions');
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activityLog, setActivityLog] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    useEffect(() => {
        fetchRole();
    }, [roleId]);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivityLog();
        }
    }, [activeTab, roleId]);

    const fetchRole = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await http.get(`/roles/${roleId}`);
            setRole(response.data);
        } catch (error) {
            console.error('Failed to fetch role:', error);
            setError('Failed to load role details');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLog = async () => {
        try {
            setActivityLoading(true);
            const response = await http.get(`/roles/${roleId}/activity`);
            setActivityLog(response.data.activities || []);
        } catch (error) {
            console.error('Failed to fetch activity log:', error);
        } finally {
            setActivityLoading(false);
        }
    };

    const handleDuplicate = async () => {
        try {
            const response = await http.post(`/roles/${roleId}/duplicate`);
            navigate(`/roles/${response.data.id}`);
        } catch (error) {
            console.error('Failed to duplicate role:', error);
            alert(error.response?.data?.error || 'Failed to duplicate role');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(true);
            await http.delete(`/roles/${roleId}`);
            navigate('/roles');
        } catch (error) {
            console.error('Failed to delete role:', error);
            alert(error.response?.data?.error || 'Failed to delete role');
        } finally {
            setDeleting(false);
        }
    };

    const getPermissionsByCategory = () => {
        if (!role?.permissionKeys) return {};

        const grouped = {};
        Object.entries(PERMISSION_CATEGORIES).forEach(([catKey, category]) => {
            const catPermKeys = Object.keys(category.permissions);
            const matching = role.permissionKeys.filter(k => catPermKeys.includes(k));
            if (matching.length > 0) {
                grouped[catKey] = {
                    name: category.name,
                    icon: category.icon,
                    permissions: matching.map(k => ({
                        key: k,
                        name: category.permissions[k]?.name || k
                    }))
                };
            }
        });
        return grouped;
    };

    const formatActivityAction = (action) => {
        const actions = {
            created: 'Created role',
            updated: 'Updated role details',
            permissions_changed: 'Modified permissions',
            employees_assigned: 'Assigned employees',
            employee_removed: 'Removed employee'
        };
        return actions[action] || action;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Dashboard>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Loader2 size={40} className="animate-spin" color="#6366f1" />
                </div>
            </Dashboard>
        );
    }

    if (error || !role) {
        return (
            <Dashboard>
                <div style={{ padding: '24px' }}>
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                        padding: '24px', textAlign: 'center', color: '#dc2626'
                    }}>
                        <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px' }}>{error || 'Role not found'}</h3>
                        <Link to="/roles" style={{ color: '#6366f1', textDecoration: 'none' }}>
                            ← Back to Roles
                        </Link>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const permissionsByCategory = getPermissionsByCategory();

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: '#f9fafb' }}>
                {/* Back Button */}
                <Link
                    to="/roles"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: '#6b7280', textDecoration: 'none', fontSize: '14px',
                        marginBottom: '20px'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Roles
                </Link>

                {/* Header */}
                <div style={{
                    background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb',
                    padding: '24px', marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '16px',
                                background: role.color || '#6366f1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <IconComponent name={role.icon || 'shield'} size={36} color="white" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{role.name}</h1>
                                    {role.isSystemRole && (
                                        <span style={{
                                            padding: '4px 10px', background: '#fef3c7', color: '#92400e',
                                            fontSize: '11px', fontWeight: 600, borderRadius: '16px'
                                        }}>
                                            SYSTEM ROLE
                                        </span>
                                    )}
                                    {role.isDefault && (
                                        <span style={{
                                            padding: '4px 10px', background: '#dbeafe', color: '#1e40af',
                                            fontSize: '11px', fontWeight: 600, borderRadius: '16px'
                                        }}>
                                            DEFAULT
                                        </span>
                                    )}
                                </div>
                                {role.description && (
                                    <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
                                        {role.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                                        <Check size={18} />
                                        <span>{role.permissionCount || 0} permissions</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                                        <Users size={18} />
                                        <span>{role.employeeCount || 0} employees</span>
                                    </div>
                                    {role.created_at && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                                            <Clock size={18} />
                                            <span>Created {new Date(role.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowEditModal(true)}
                                style={{
                                    padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    gap: '8px', fontWeight: 500, fontSize: '14px'
                                }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={handleDuplicate}
                                style={{
                                    padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    gap: '8px', fontWeight: 500, fontSize: '14px'
                                }}
                            >
                                <Copy size={16} /> Duplicate
                            </button>
                            {!role.isSystemRole && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting || role.employeeCount > 0}
                                    style={{
                                        padding: '10px 16px', border: '1px solid #fecaca', borderRadius: '8px',
                                        background: '#fef2f2', cursor: role.employeeCount > 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500,
                                        fontSize: '14px', color: '#dc2626',
                                        opacity: role.employeeCount > 0 ? 0.5 : 1
                                    }}
                                    title={role.employeeCount > 0 ? 'Cannot delete role with assigned employees' : 'Delete role'}
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: '4px', marginBottom: '20px',
                    background: 'white', padding: '6px', borderRadius: '10px',
                    border: '1px solid #e5e7eb', width: 'fit-content'
                }}>
                    {['permissions', 'employees', 'activity'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 20px', border: 'none',
                                background: activeTab === tab ? '#6366f1' : 'transparent',
                                color: activeTab === tab ? 'white' : '#6b7280',
                                borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 500, fontSize: '14px', textTransform: 'capitalize'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px' }}>
                    {activeTab === 'permissions' && (
                        <div>
                            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>
                                Granted Permissions
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {Object.entries(permissionsByCategory).map(([catKey, category]) => (
                                    <div key={catKey} style={{
                                        padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px'
                                    }}>
                                        <h4 style={{
                                            margin: '0 0 12px', fontSize: '14px', fontWeight: 600,
                                            color: '#374151', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            {category.name}
                                            <span style={{
                                                fontSize: '11px', fontWeight: 500, color: '#6b7280',
                                                background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px'
                                            }}>
                                                {category.permissions.length}
                                            </span>
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {category.permissions.map(perm => (
                                                <span key={perm.key} style={{
                                                    padding: '4px 10px', background: '#f0fdf4',
                                                    color: '#166534', borderRadius: '16px',
                                                    fontSize: '12px', fontWeight: 500,
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    <Check size={12} /> {perm.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {Object.keys(permissionsByCategory).length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No permissions assigned to this role
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'employees' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                    Assigned Employees ({role.employees?.length || 0})
                                </h3>
                            </div>
                            {role.employees?.length > 0 ? (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {role.employees.map(emp => (
                                        <Link
                                            key={emp.id}
                                            to={`/employees/${emp.id}`}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '16px', border: '1px solid #e5e7eb', borderRadius: '10px',
                                                textDecoration: 'none', color: 'inherit', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '10px',
                                                    background: '#f3f4f6', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', overflow: 'hidden'
                                                }}>
                                                    {emp.photo ? (
                                                        <img src={emp.photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={22} color="#6b7280" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>
                                                        {emp.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                        {emp.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                                    {emp.department?.name || 'No department'}
                                                </span>
                                                <ChevronRight size={18} color="#9ca3af" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No employees assigned to this role
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div>
                            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>
                                Activity Log
                            </h3>
                            {activityLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                    <Loader2 size={24} className="animate-spin" color="#6366f1" />
                                </div>
                            ) : activityLog.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {activityLog.map(activity => (
                                        <div key={activity.id} style={{
                                            display: 'flex', gap: '16px', padding: '16px',
                                            background: '#f9fafb', borderRadius: '10px'
                                        }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                background: '#e5e7eb', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Clock size={18} color="#6b7280" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
                                                    {formatActivityAction(activity.action)}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                    {activity.performedBy?.name || 'System'} • {formatDate(activity.performed_at)}
                                                </div>
                                                {activity.details && (
                                                    <div style={{
                                                        marginTop: '8px', padding: '8px', background: 'white',
                                                        borderRadius: '6px', fontSize: '12px', color: '#6b7280'
                                                    }}>
                                                        {JSON.stringify(activity.details, null, 2).slice(0, 200)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No activity recorded yet
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <RoleFormModal
                    role={role}
                    onClose={() => setShowEditModal(false)}
                    onSave={() => {
                        setShowEditModal(false);
                        fetchRole();
                    }}
                />
            )}
        </Dashboard>
    );
};

export default RoleDetailsPage;
