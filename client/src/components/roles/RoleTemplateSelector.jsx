import { useState, useEffect } from 'react';
import { X, Check, FileText, Loader2, Shield, Users, User, UserCheck, Heart, Eye, Crown, Star } from 'lucide-react';
import { http } from '../../api/http';
import { getAllPermissionKeys } from '../../config/permissions';

// Icon component mapper
const IconComponent = ({ name, size = 24, ...props }) => {
    const icons = {
        shield: Shield, users: Users, user: User, 'user-check': UserCheck,
        'heart-handshake': Heart, eye: Eye, crown: Crown, star: Star
    };
    const Icon = icons[name?.toLowerCase()] || Shield;
    return <Icon size={size} {...props} />;
};

const RoleTemplateSelector = ({ onSelect, onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await http.get('/roles/templates');
            setTemplates(response.data || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            // Use default templates from config if API fails
            setTemplates([
                {
                    name: 'Super Admin',
                    description: 'Full system access with all permissions',
                    color: '#dc2626',
                    icon: 'shield',
                    isSystemRole: true,
                    permissions: ['*'],
                    permissionCount: getAllPermissionKeys().length
                },
                {
                    name: 'Department Manager',
                    description: 'Manage department employees, tasks, and attendance',
                    color: '#7c3aed',
                    icon: 'users',
                    permissions: [],
                    permissionCount: 24
                },
                {
                    name: 'Team Lead',
                    description: 'Lead a team with task and goal management',
                    color: '#2563eb',
                    icon: 'user-check',
                    permissions: [],
                    permissionCount: 15
                },
                {
                    name: 'HR Manager',
                    description: 'Full employee and attendance management',
                    color: '#059669',
                    icon: 'heart-handshake',
                    permissions: [],
                    permissionCount: 20
                },
                {
                    name: 'Employee',
                    description: 'Standard employee access',
                    color: '#6366f1',
                    icon: 'user',
                    isDefault: true,
                    permissions: [],
                    permissionCount: 10
                },
                {
                    name: 'Viewer',
                    description: 'Read-only access to view data',
                    color: '#64748b',
                    icon: 'eye',
                    permissions: [],
                    permissionCount: 6
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = () => {
        if (selectedTemplate) {
            onSelect(selectedTemplate);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                width: '100%', maxWidth: '700px', maxHeight: '90vh',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FileText size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                                Create from Template
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                Choose a predefined role template to get started quickly
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
                            <Loader2 size={32} color="#6366f1" className="animate-spin" />
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {templates.map((template, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedTemplate(template)}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: selectedTemplate?.name === template.name
                                            ? `2px solid ${template.color}`
                                            : '2px solid #e5e7eb',
                                        background: selectedTemplate?.name === template.name
                                            ? `${template.color}08`
                                            : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '10px',
                                            background: template.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <IconComponent name={template.icon} size={22} color="white" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                                                    {template.name}
                                                </h4>
                                                {template.isSystemRole && (
                                                    <span style={{
                                                        padding: '2px 6px', background: '#fef3c7',
                                                        color: '#92400e', fontSize: '9px', fontWeight: 600,
                                                        borderRadius: '8px', textTransform: 'uppercase'
                                                    }}>
                                                        System
                                                    </span>
                                                )}
                                                {template.isDefault && (
                                                    <span style={{
                                                        padding: '2px 6px', background: '#dbeafe',
                                                        color: '#1e40af', fontSize: '9px', fontWeight: 600,
                                                        borderRadius: '8px', textTransform: 'uppercase'
                                                    }}>
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                                                {template.description}
                                            </p>
                                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Check size={14} />
                                                {template.permissionCount || template.permissions?.length || 0} permissions
                                            </div>
                                        </div>
                                        {selectedTemplate?.name === template.name && (
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: template.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Check size={14} color="white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'flex-end', gap: '12px',
                    background: '#f9fafb'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', border: '1px solid #d1d5db',
                            background: 'white', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSelect}
                        disabled={!selectedTemplate}
                        style={{
                            padding: '10px 24px', border: 'none',
                            background: selectedTemplate ? '#6366f1' : '#9ca3af',
                            color: 'white', borderRadius: '8px',
                            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                            fontWeight: 600, fontSize: '14px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        Use Template
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleTemplateSelector;
