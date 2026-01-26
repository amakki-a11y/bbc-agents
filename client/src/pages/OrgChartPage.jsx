import { useState, useEffect } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import { GitBranch, Users, ChevronDown, ChevronRight, Building2, Shield, Mail, Phone, X } from 'lucide-react';

const OrgChartPage = () => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'department'
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, deptRes] = await Promise.all([
                http.get('/employees?limit=1000'),
                http.get('/departments')
            ]);
            // Handle paginated response: { data: [], pagination: {...} } or plain array
            const employeesData = empRes.data?.data || empRes.data || [];
            setEmployees(Array.isArray(employeesData) ? employeesData : []);
            setDepartments(deptRes.data || []);

            // Expand all top-level nodes by default
            const topLevel = (Array.isArray(employeesData) ? employeesData : []).filter(e => !e.manager_id);
            setExpandedNodes(new Set(topLevel.map(e => e.id)));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Build hierarchy tree
    const buildTree = () => {
        const topLevel = (employees || []).filter(e => !e.manager_id);
        return topLevel;
    };

    const getSubordinates = (managerId) => {
        return (employees || []).filter(e => e.manager_id === managerId);
    };

    const toggleNode = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const getDepartmentEmployees = (deptId) => {
        return (employees || []).filter(e => e.department_id === deptId);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#16a34a';
            case 'inactive': return '#dc2626';
            case 'on_leave': return '#d97706';
            default: return '#6b7280';
        }
    };

    // Tree Node Component
    const TreeNode = ({ employee, level = 0 }) => {
        const subordinates = getSubordinates(employee.id);
        const hasChildren = subordinates.length > 0;
        const isExpanded = expandedNodes.has(employee.id);

        return (
            <div style={{ marginLeft: level > 0 ? '32px' : 0 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => setSelectedEmployee(employee)}
                    className="task-row"
                >
                    {/* Expand/Collapse Button */}
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(employee.id);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                color: '#6b7280'
                            }}
                        >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    )}
                    {!hasChildren && <div style={{ width: '24px' }} />}

                    {/* Avatar */}
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${level === 0 ? '#10b981' : '#7b68ee'}, ${level === 0 ? '#059669' : '#6366f1'})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '16px',
                        flexShrink: 0,
                        border: `3px solid ${getStatusColor(employee.status)}`
                    }}>
                        {employee.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '2px' }}>
                            {employee.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span>{employee.role?.name || 'Employee'}</span>
                            <span style={{ color: '#d1d5db' }}>|</span>
                            <span>{employee.department?.name || 'Unassigned'}</span>
                        </div>
                    </div>

                    {/* Subordinate Count */}
                    {hasChildren && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: '#f3f4f6',
                            borderRadius: '20px',
                            fontSize: '12px',
                            color: '#6b7280'
                        }}>
                            <Users size={14} />
                            {subordinates.length}
                        </div>
                    )}
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div style={{
                        position: 'relative',
                        marginLeft: '12px',
                        paddingLeft: '20px',
                        borderLeft: '2px solid #e5e7eb'
                    }}>
                        {subordinates.map(sub => (
                            <TreeNode key={sub.id} employee={sub} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Department View Card
    const DepartmentCard = ({ department }) => {
        const deptEmployees = getDepartmentEmployees(department.id);
        const [isExpanded, setIsExpanded] = useState(true);

        return (
            <div style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                marginBottom: '16px'
            }}>
                {/* Department Header */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Building2 size={20} />
                        <span style={{ fontWeight: 600, fontSize: '16px' }}>{department.name}</span>
                        <span style={{
                            padding: '2px 10px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '20px',
                            fontSize: '12px'
                        }}>
                            {deptEmployees.length} members
                        </span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                {/* Employees List */}
                {isExpanded && (
                    <div style={{ padding: '12px' }}>
                        {deptEmployees.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                                No employees in this department
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {deptEmployees.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => setSelectedEmployee(emp)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            background: '#f9fafb',
                                            borderRadius: '10px',
                                            cursor: 'pointer'
                                        }}
                                        className="task-row"
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            border: `3px solid ${getStatusColor(emp.status)}`
                                        }}>
                                            {emp.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, color: '#1f2937' }}>{emp.name}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{emp.role?.name}</div>
                                        </div>
                                        {emp.manager && (
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                Reports to: {emp.manager.name}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: '#f9fafb' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(123, 104, 238, 0.3)'
                            }}>
                                <GitBranch size={24} color="white" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                    Organization Chart
                                </h1>
                                <p style={{ color: '#6b7280', marginTop: '4px', margin: 0 }}>
                                    View your company&apos;s reporting structure
                                </p>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setViewMode('tree')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    background: viewMode === 'tree' ? 'white' : 'transparent',
                                    color: viewMode === 'tree' ? '#1f2937' : '#6b7280',
                                    boxShadow: viewMode === 'tree' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <GitBranch size={16} />
                                Hierarchy
                            </button>
                            <button
                                onClick={() => setViewMode('department')}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    background: viewMode === 'department' ? 'white' : 'transparent',
                                    color: viewMode === 'department' ? '#1f2937' : '#6b7280',
                                    boxShadow: viewMode === 'department' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Building2 size={16} />
                                By Department
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f0edff', padding: '20px', borderRadius: '12px', border: '1px solid #c4b5fd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#7b68ee', fontSize: '14px', fontWeight: 500 }}>Total Employees</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#4c1d95' }}>{(employees || []).length}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Departments</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#14532d' }}>{(departments || []).length}</div>
                    </div>
                    <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#b45309', fontSize: '14px', fontWeight: 500 }}>Managers</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#78350f' }}>
                            {new Set((employees || []).filter(e => e.manager_id).map(e => e.manager_id)).size}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        Loading organization chart...
                    </div>
                ) : viewMode === 'tree' ? (
                    <div style={{ padding: '8px' }}>
                        {buildTree().length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                                No employees found. Add employees to see the organization chart.
                            </div>
                        ) : (
                            buildTree().map(emp => (
                                <TreeNode key={emp.id} employee={emp} />
                            ))
                        )}
                    </div>
                ) : (
                    <div>
                        {departments.map(dept => (
                            <DepartmentCard key={dept.id} department={dept} />
                        ))}
                    </div>
                )}
            </div>

            {/* Employee Quick View Modal */}
            {selectedEmployee && (
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
                        maxWidth: '400px',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                            padding: '24px',
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <X size={20} />
                            </button>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: '#7b68ee',
                                fontWeight: 700,
                                fontSize: '32px'
                            }}>
                                {selectedEmployee.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 600 }}>
                                {selectedEmployee.name}
                            </h2>
                            <p style={{ margin: 0, opacity: 0.9 }}>
                                {selectedEmployee.role?.name || 'Employee'}
                            </p>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Mail size={18} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Email</div>
                                        <div style={{ fontWeight: 500 }}>{selectedEmployee.email}</div>
                                    </div>
                                </div>
                                {selectedEmployee.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Phone size={18} color="#7b68ee" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Phone</div>
                                            <div style={{ fontWeight: 500 }}>{selectedEmployee.phone}</div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Building2 size={18} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Department</div>
                                        <div style={{ fontWeight: 500 }}>{selectedEmployee.department?.name || 'Unassigned'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Shield size={18} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Role</div>
                                        <div style={{ fontWeight: 500 }}>{selectedEmployee.role?.name || 'Employee'}</div>
                                    </div>
                                </div>
                                {selectedEmployee.manager && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Users size={18} color="#7b68ee" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Reports To</div>
                                            <div style={{ fontWeight: 500 }}>{selectedEmployee.manager.name}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Subordinates */}
                            {getSubordinates(selectedEmployee.id).length > 0 && (
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                        Direct Reports ({getSubordinates(selectedEmployee.id).length})
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {getSubordinates(selectedEmployee.id).slice(0, 5).map(sub => (
                                            <div
                                                key={sub.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px 12px',
                                                    background: '#f3f4f6',
                                                    borderRadius: '20px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#7b68ee',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 600
                                                }}>
                                                    {sub.name?.charAt(0).toUpperCase()}
                                                </div>
                                                {sub.name}
                                            </div>
                                        ))}
                                        {getSubordinates(selectedEmployee.id).length > 5 && (
                                            <div style={{
                                                padding: '6px 12px',
                                                background: '#f3f4f6',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                color: '#6b7280'
                                            }}>
                                                +{getSubordinates(selectedEmployee.id).length - 5} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
                            <button
                                onClick={() => {
                                    setSelectedEmployee(null);
                                    window.location.href = '/employees';
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#6366f1';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#7b68ee';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 24px',
                                    background: '#7b68ee',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Dashboard>
    );
};

export default OrgChartPage;
