import { useState, useEffect } from 'react';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import EmployeeDetailsModal from '../components/employees/EmployeeDetailsModal';
import EmployeeForm from '../components/employees/EmployeeForm';
import { Search, Plus, Filter, Users, Building2, Shield } from 'lucide-react';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, deptRes, rolesRes] = await Promise.all([
                http.get('/api/employees'),
                http.get('/api/departments'),
                http.get('/api/roles')
            ]);
            setEmployees(empRes.data);
            setDepartments(deptRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = !filterDepartment || emp.department_id === filterDepartment;
        const matchesRole = !filterRole || emp.role_id === filterRole;
        const matchesStatus = !filterStatus || emp.status === filterStatus;
        return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            active: { bg: '#dcfce7', color: '#166534' },
            inactive: { bg: '#fee2e2', color: '#991b1b' },
            on_leave: { bg: '#fef3c7', color: '#92400e' }
        };
        const style = styles[status] || styles.active;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
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
        <Dashboard>
            <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                <Users size={28} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
                                Employees
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: '4px' }}>
                                Manage your team members and their information
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={18} /> Add Employee
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{
                            flex: 1,
                            minWidth: '250px',
                            position: 'relative'
                        }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 40px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                background: showFilters ? '#f3f4f6' : 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <Filter size={16} /> Filters
                        </button>
                    </div>

                    {/* Filter Dropdowns */}
                    {showFilters && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="">All Roles</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="on_leave">On Leave</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Employee Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                        <div style={{ color: '#0369a1', fontSize: '14px', fontWeight: 500 }}>Total Employees</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#0c4a6e' }}>{employees.length}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                        <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Active</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#14532d' }}>
                            {employees.filter(e => e.status === 'active').length}
                        </div>
                    </div>
                    <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                        <div style={{ color: '#b45309', fontSize: '14px', fontWeight: 500 }}>On Leave</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#78350f' }}>
                            {employees.filter(e => e.status === 'on_leave').length}
                        </div>
                    </div>
                    <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                        <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>Departments</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#7f1d1d' }}>{departments.length}</div>
                    </div>
                </div>

                {/* Employees Table */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                            Loading employees...
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                            No employees found
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Employee</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Department</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Manager</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(employee => (
                                    <tr
                                        key={employee.id}
                                        onClick={() => setSelectedEmployee(employee)}
                                        style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                        className="task-row"
                                    >
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                                                    fontSize: '14px'
                                                }}>
                                                    {employee.name?.charAt(0).toUpperCase() || 'E'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{employee.name}</div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{employee.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Building2 size={16} style={{ color: '#9ca3af' }} />
                                                <span>{employee.department?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Shield size={16} style={{ color: '#9ca3af' }} />
                                                <span>{employee.role?.name || 'Employee'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#6b7280' }}>
                                            {employee.manager?.name || '-'}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {getStatusBadge(employee.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Employee Details Modal */}
            {selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                    onUpdate={fetchData}
                    departments={departments}
                    roles={roles}
                    employees={employees}
                />
            )}

            {/* Add Employee Form Modal */}
            {showAddForm && (
                <EmployeeForm
                    onClose={() => setShowAddForm(false)}
                    onSave={() => {
                        setShowAddForm(false);
                        fetchData();
                    }}
                    departments={departments}
                    roles={roles}
                    employees={employees}
                />
            )}
        </Dashboard>
    );
};

export default EmployeesPage;
