import { useState, useEffect } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import { Search, Plus, Building2, Users, X, Save, Loader2, ChevronRight } from 'lucide-react';

const DepartmentsPage = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [employees, setEmployees] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, empRes] = await Promise.all([
                http.get('/api/departments'),
                http.get('/api/employees?limit=1000')
            ]);
            setDepartments(deptRes.data || []);
            // Handle paginated response: { data: [], pagination: {...} } or plain array
            const employeesData = empRes.data?.data || empRes.data || [];
            setEmployees(Array.isArray(employeesData) ? employeesData : []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredDepartments = departments.filter(dept =>
        dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDepartmentEmployees = (deptId) => {
        return (employees || []).filter(emp => emp.department_id === deptId);
    };

    const getDepartmentColor = (index) => {
        const colors = [
            { bg: 'linear-gradient(135deg, #7b68ee, #6366f1)', light: '#ede9fe' },
            { bg: 'linear-gradient(135deg, #10b981, #059669)', light: '#d1fae5' },
            { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', light: '#fef3c7' },
            { bg: 'linear-gradient(135deg, #ec4899, #db2777)', light: '#fce7f3' },
            { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', light: '#dbeafe' },
            { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', light: '#ede9fe' },
            { bg: 'linear-gradient(135deg, #14b8a6, #0d9488)', light: '#ccfbf1' },
            { bg: 'linear-gradient(135deg, #f97316, #ea580c)', light: '#ffedd5' }
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
                                    <Building2 size={22} style={{ color: 'white' }} />
                                </div>
                                Departments
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: '8px', marginLeft: '52px', fontSize: '14px' }}>
                                Organize your company structure
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
                            <Plus size={18} /> Add Department
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Search departments..."
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
                        <div style={{ color: '#7b68ee', fontSize: '14px', fontWeight: 500 }}>Total Departments</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#5b4dc7' }}>{(departments || []).length}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Total Employees</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#14532d' }}>{(employees || []).length}</div>
                    </div>
                    <div style={{ background: '#fdf4ff', padding: '20px', borderRadius: '12px', border: '1px solid #f0abfc', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#a21caf', fontSize: '14px', fontWeight: 500 }}>Avg. per Dept</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#701a75' }}>
                            {(departments || []).length ? Math.round((employees || []).length / (departments || []).length) : 0}
                        </div>
                    </div>
                </div>

                {/* Department Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        Loading departments...
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        No departments found
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {filteredDepartments.map((dept, index) => {
                            const color = getDepartmentColor(index);
                            const deptEmployees = getDepartmentEmployees(dept.id);
                            return (
                                <div
                                    key={dept.id}
                                    onClick={() => setSelectedDepartment(dept)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #e5e7eb',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                    className="task-row"
                                >
                                    {/* Color Header */}
                                    <div style={{
                                        height: '8px',
                                        background: color.bg
                                    }} />

                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                                                <Building2 size={24} />
                                            </div>
                                            <ChevronRight size={20} color="#9ca3af" />
                                        </div>

                                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 8px' }}>
                                            {dept.name}
                                        </h3>
                                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px', lineHeight: '1.5' }}>
                                            {dept.description || 'No description'}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px',
                                            background: color.light,
                                            borderRadius: '8px'
                                        }}>
                                            <Users size={18} color="#6b7280" />
                                            <span style={{ fontWeight: 600, color: '#374151' }}>
                                                {deptEmployees.length}
                                            </span>
                                            <span style={{ color: '#6b7280' }}>
                                                {deptEmployees.length === 1 ? 'employee' : 'employees'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Department Detail Modal */}
            {selectedDepartment && (
                <DepartmentDetailModal
                    department={selectedDepartment}
                    employees={getDepartmentEmployees(selectedDepartment.id)}
                    onClose={() => setSelectedDepartment(null)}
                    onUpdate={fetchData}
                />
            )}

            {/* Add Department Modal */}
            {showAddForm && (
                <DepartmentFormModal
                    onClose={() => setShowAddForm(false)}
                    onSave={() => {
                        setShowAddForm(false);
                        fetchData();
                    }}
                />
            )}
        </Dashboard>
    );
};

// Department Detail Modal Component
const DepartmentDetailModal = ({ department, employees, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: department.name,
        description: department.description || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        try {
            setSaving(true);
            await http.put(`/api/departments/${department.id}`, formData);
            onUpdate();
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update department:', error);
            alert('Failed to update department');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: { bg: '#dcfce7', color: '#166534' },
            inactive: { bg: '#fee2e2', color: '#991b1b' },
            on_leave: { bg: '#fef3c7', color: '#92400e' }
        };
        const style = styles[status] || styles.active;
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                background: style.bg,
                color: style.color,
                textTransform: 'capitalize'
            }}>
                {status?.replace('_', ' ') || 'Active'}
            </span>
        );
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
                maxWidth: '600px',
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
                            background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Building2 size={28} />
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
                                    {department.name}
                                </h2>
                            )}
                            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                                {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
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
                    {/* Description */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Description
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    minHeight: '80px',
                                    fontSize: '14px'
                                }}
                                placeholder="Add a description..."
                            />
                        ) : (
                            <p style={{ color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                                {department.description || 'No description provided'}
                            </p>
                        )}
                    </div>

                    {/* Employees List */}
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                            Team Members
                        </h3>
                        {employees.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '32px',
                                background: '#f9fafb',
                                borderRadius: '12px',
                                color: '#6b7280'
                            }}>
                                No employees in this department
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {employees.map(emp => (
                                    <div key={emp.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: '#f9fafb',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '14px'
                                        }}>
                                            {emp.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, color: '#1f2937' }}>{emp.name}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{emp.role?.name || 'Employee'}</div>
                                        </div>
                                        {getStatusBadge(emp.status)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
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
                        >
                            Edit Department
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add Department Form Modal
const DepartmentFormModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Department name is required');
            return;
        }
        try {
            setSaving(true);
            await http.post('/api/departments', formData);
            onSave();
        } catch (error) {
            console.error('Failed to create department:', error);
            setError(error.response?.data?.error || 'Failed to create department');
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
                maxWidth: '450px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                        Add New Department
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                    >
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                            Department Name *
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
                            placeholder="e.g., Engineering"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                resize: 'vertical',
                                minHeight: '80px'
                            }}
                            placeholder="Describe the department's responsibilities..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {saving ? <Loader2 size={16} /> : <Plus size={16} />}
                            Add Department
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentsPage;
