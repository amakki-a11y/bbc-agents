import { Shield, Users, Check, Edit2, Copy, ExternalLink, Crown, Star, User, UserCheck, Heart, Eye, Building, CheckSquare, Clock, Target, MessageCircle, BarChart2, Bot, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PERMISSION_CATEGORIES, getPermissionName } from '../../config/permissions';

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

const RoleCard = ({ role, onEdit, onDuplicate }) => {
    const permCount = role.permissionCount || role.permissionKeys?.length || 0;
    const employeeCount = role.employeeCount || role._count?.employees || 0;

    // Get first 3 permission names for display
    const displayPermissions = (role.permissionKeys || [])
        .slice(0, 3)
        .map(key => getPermissionName(key));

    // Calculate light version of the color for background
    const getLightColor = (hex) => {
        if (!hex) return '#f3f4f6';
        return hex + '15'; // Add 15% opacity
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            {/* Color Header */}
            <div style={{ height: '8px', background: role.color || '#6366f1' }} />

            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: role.color || '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white'
                    }}>
                        <IconComponent name={role.icon || 'shield'} size={24} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {onEdit && (
                            <button
                                onClick={() => onEdit(role)}
                                style={{
                                    padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                                title="Edit role"
                            >
                                <Edit2 size={16} color="#6b7280" />
                            </button>
                        )}
                        {onDuplicate && (
                            <button
                                onClick={() => onDuplicate(role)}
                                style={{
                                    padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px',
                                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                                title="Duplicate role"
                            >
                                <Copy size={16} color="#6b7280" />
                            </button>
                        )}
                        <Link
                            to={`/roles/${role.id}`}
                            style={{
                                padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px',
                                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                textDecoration: 'none'
                            }}
                            title="View details"
                        >
                            <ExternalLink size={16} color="#6b7280" />
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                        {role.name}
                    </h3>
                    {role.isSystemRole && (
                        <span style={{
                            padding: '2px 8px', background: '#fef3c7', color: '#92400e',
                            fontSize: '10px', fontWeight: 600, borderRadius: '12px', textTransform: 'uppercase'
                        }}>
                            System
                        </span>
                    )}
                    {role.isDefault && (
                        <span style={{
                            padding: '2px 8px', background: '#dbeafe', color: '#1e40af',
                            fontSize: '10px', fontWeight: 600, borderRadius: '12px', textTransform: 'uppercase'
                        }}>
                            Default
                        </span>
                    )}
                </div>

                {role.description && (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.4 }}>
                        {role.description}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px' }}>
                        <Check size={16} />
                        <span>{permCount} permission{permCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px' }}>
                        <Users size={16} />
                        <span>{employeeCount} employee{employeeCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Permission badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {displayPermissions.map((name, i) => (
                        <span key={i} style={{
                            padding: '4px 10px',
                            background: getLightColor(role.color),
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#374151'
                        }}>
                            {name}
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
};

export default RoleCard;
