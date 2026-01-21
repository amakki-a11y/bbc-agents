import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import Dashboard from './Dashboard';
import EmployeeDetailsModal from '../components/employees/EmployeeDetailsModal';
import EmployeeForm from '../components/employees/EmployeeForm';
import { Search, Plus, Filter, Users, Building2, Shield, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const EmployeesPage = () => {
    const navigate = useNavigate();
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Stats (separate from paginated data)
    const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });

    // Fetch departments and roles (one-time)
    const fetchMetadata = useCallback(async () => {
        try {
            const [deptRes, rolesRes] = await Promise.all([
                http.get('/departments'),
                http.get('/roles')
            ]);
            setDepartments(deptRes.data || []);
            setRoles(rolesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    }, []);

    // Fetch employees with pagination and filters
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString()
            });

            if (searchTerm) params.append('search', searchTerm);
            if (filterDepartment) params.append('department_id', filterDepartment);
            if (filterRole) params.append('role_id', filterRole);
            if (filterStatus) params.append('status', filterStatus);

            const response = await http.get(`/employees?${params.toString()}`);
            const { data, pagination } = response.data;

            setEmployees(data || []);
            setTotalEmployees(pagination?.total || 0);
            setTotalPages(pagination?.totalPages || 0);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, filterDepartment, filterRole, filterStatus]);

    // Fetch stats (total counts regardless of filters)
    const fetchStats = useCallback(async () => {
        try {
            const response = await http.get('/employees?limit=1000');
            const allEmployees = response.data?.data || [];
            setStats({
                total: response.data?.pagination?.total || allEmployees.length,
                active: allEmployees.filter(e => e.status === 'active').length,
                onLeave: allEmployees.filter(e => e.status === 'on_leave').length
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchMetadata();
        fetchStats();
    }, [fetchMetadata, fetchStats]);

    // Fetch employees when pagination or filters change
    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDepartment, filterRole, filterStatus, itemsPerPage]);

    // Handle data refresh after add/edit/delete
    const handleRefresh = () => {
        fetchEmployees();
        fetchStats();
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
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

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalEmployees);

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
                                    <Users size={22} style={{ color: 'white' }} />
                                </div>
                                Employees
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: '8px', marginLeft: '52px', fontSize: '14px' }}>
                                Manage your team members and their information
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
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                background: showFilters ? '#f0edff' : 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: showFilters ? '#7b68ee' : '#4b5563',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
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
                    <div style={{ background: '#f0edff', padding: '20px', borderRadius: '12px', border: '1px solid #d4ccff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#7b68ee', fontSize: '14px', fontWeight: 500 }}>Total Employees</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#5b4dc7' }}>{stats.total}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#15803d', fontSize: '14px', fontWeight: 500 }}>Active</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#14532d' }}>{stats.active}</div>
                    </div>
                    <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#b45309', fontSize: '14px', fontWeight: 500 }}>On Leave</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#78350f' }}>{stats.onLeave}</div>
                    </div>
                    <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>Departments</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#7f1d1d' }}>{departments.length}</div>
                    </div>
                </div>

                {/* Employees Table */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                            Loading employees...
                        </div>
                    ) : employees.length === 0 ? (
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
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(employee => (
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
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/employees/${employee.id}`);
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <ExternalLink size={14} />
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {!loading && totalEmployees > 0 && (
                        <div style={{
                            padding: '16px 20px',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            {/* Showing info */}
                            <div style={{ color: '#6b7280', fontSize: '14px' }}>
                                Showing {startIndex}-{endIndex} of {totalEmployees} employees
                            </div>

                            {/* Page controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Items per page */}
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        marginRight: '16px'
                                    }}
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>

                                {/* Previous button */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: currentPage === 1 ? '#f9fafb' : 'white',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        color: currentPage === 1 ? '#9ca3af' : '#374151',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {/* Page numbers */}
                                {getPageNumbers().map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid',
                                            borderColor: currentPage === page ? '#7b68ee' : '#e5e7eb',
                                            borderRadius: '6px',
                                            background: currentPage === page ? '#7b68ee' : 'white',
                                            color: currentPage === page ? 'white' : '#374151',
                                            cursor: 'pointer',
                                            fontWeight: currentPage === page ? 600 : 400,
                                            fontSize: '14px',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {/* Next button */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: currentPage === totalPages ? '#f9fafb' : 'white',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        color: currentPage === totalPages ? '#9ca3af' : '#374151',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Employee Details Modal */}
            {selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                    onUpdate={handleRefresh}
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
                        handleRefresh();
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
