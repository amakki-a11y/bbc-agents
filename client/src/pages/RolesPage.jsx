import { useState, useEffect } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import { Search, Plus, Shield, Users, FileText, Loader2 } from 'lucide-react';
import RoleCard from '../components/roles/RoleCard';
import RoleFormModal from '../components/roles/RoleFormModal';
import RoleTemplateSelector from '../components/roles/RoleTemplateSelector';
import { getAllPermissionKeys } from '../config/permissions';

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [templateData, setTemplateData] = useState(null);
    const [duplicatingRole, setDuplicatingRole] = useState(null);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await http.get('/roles');
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
        role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDuplicate = async (role) => {
        try {
            setDuplicatingRole(role.id);
            await http.post(`/roles/${role.id}/duplicate`);
            fetchRoles();
        } catch (error) {
            console.error('Failed to duplicate role:', error);
            alert(error.response?.data?.error || 'Failed to duplicate role');
        } finally {
            setDuplicatingRole(null);
        }
    };

    const handleTemplateSelect = (template) => {
        // Close template selector and open form with template data
        setShowTemplateSelector(false);
        setTemplateData({
            name: `${template.name}`,
            description: template.description,
            color: template.color,
            icon: template.icon || 'shield',
            isDefault: template.isDefault || false,
            permissionKeys: template.permissions.includes('*')
                ? getAllPermissionKeys()
                : template.permissions
        });
        setShowAddForm(true);
    };

    // Calculate stats
    const totalPermissions = getAllPermissionKeys().length;
    const totalEmployees = roles.reduce((sum, role) => sum + (role.employeeCount || role._count?.employees || 0), 0);

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: '#f9fafb' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Shield size={22} style={{ color: 'white' }} />
                                </div>
                                Roles & Permissions
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: '8px', marginLeft: '52px', fontSize: '14px' }}>
                                Manage roles and their permissions
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowTemplateSelector(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', background: 'white',
                                    border: '1px solid #e5e7eb', borderRadius: '8px',
                                    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    color: '#374151'
                                }}
                            >
                                <FileText size={18} /> From Template
                            </button>
                            <button
                                onClick={() => {
                                    setTemplateData(null);
                                    setShowAddForm(true);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 20px', background: '#7b68ee',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)'
                                }}
                            >
                                <Plus size={18} /> Add Role
                            </button>
                        </div>
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
                                width: '100%', padding: '10px 12px 10px 40px',
                                border: '1px solid #e5e7eb', borderRadius: '8px',
                                fontSize: '14px', outline: 'none', background: 'white'
                            }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                        background: '#f0edff', padding: '20px', borderRadius: '12px',
                        border: '1px solid #d4ccff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ color: '#7b68ee', fontSize: '14px', fontWeight: 500 }}>Total Roles</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#5b4dc7' }}>{roles.length}</div>
                    </div>
                    <div style={{
                        background: '#f0fdf4', padding: '20px', borderRadius: '12px',
                        border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Available Permissions</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#14532d' }}>{totalPermissions}</div>
                    </div>
                    <div style={{
                        background: '#f0f9ff', padding: '20px', borderRadius: '12px',
                        border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ color: '#0369a1', fontSize: '14px', fontWeight: 500 }}>Employees Assigned</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#0c4a6e' }}>{totalEmployees}</div>
                    </div>
                </div>

                {/* Roles Grid */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
                        <Loader2 size={40} className="animate-spin" color="#6366f1" />
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        {searchTerm ? 'No roles found matching your search' : 'No roles created yet'}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {filteredRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={(r) => setSelectedRole(r)}
                                onDuplicate={handleDuplicate}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Role Modal */}
            {selectedRole && (
                <RoleFormModal
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    onSave={() => {
                        setSelectedRole(null);
                        fetchRoles();
                    }}
                />
            )}

            {/* Add Role Modal (with optional template data) */}
            {showAddForm && (
                <RoleFormModal
                    role={templateData}
                    onClose={() => {
                        setShowAddForm(false);
                        setTemplateData(null);
                    }}
                    onSave={() => {
                        setShowAddForm(false);
                        setTemplateData(null);
                        fetchRoles();
                    }}
                />
            )}

            {/* Template Selector */}
            {showTemplateSelector && (
                <RoleTemplateSelector
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}
        </Dashboard>
    );
};

export default RolesPage;
