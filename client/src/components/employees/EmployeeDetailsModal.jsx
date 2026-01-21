import { useState, useEffect } from 'react';
import { http } from '../../api/http';
import EmployeeForm from './EmployeeForm';
import { X, Mail, Phone, Building2, Shield, Calendar, Users, Clock, Edit2, UserX, CheckCircle } from 'lucide-react';

const EmployeeDetailsModal = ({ employee, onClose, onUpdate, departments = [], roles = [], employees = [] }) => {
    const [attendance, setAttendance] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);
    const [showEditForm, setShowEditForm] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        fetchAttendance();
    }, [employee.id]);

    const fetchAttendance = async () => {
        try {
            setLoadingAttendance(true);
            const res = await http.get(`/attendance/employee/${employee.id}`);
            setAttendance(res.data || []);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            setAttendance([]);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleDeactivate = async () => {
        if (!confirm('Are you sure you want to deactivate this employee?')) return;
        try {
            await http.patch(`/employees/${employee.id}`, { status: 'inactive' });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to deactivate employee:', error);
            alert('Failed to deactivate employee');
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
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                background: style.bg,
                color: style.color,
                textTransform: 'capitalize'
            }}>
                {status?.replace('_', ' ') || 'Active'}
            </span>
        );
    };

    const subordinates = employees.filter(e => e.manager_id === employee.id);

    if (showEditForm) {
        return (
            <EmployeeForm
                employee={employee}
                onClose={() => setShowEditForm(false)}
                onSave={() => {
                    setShowEditForm(false);
                    onUpdate();
                    onClose();
                }}
                departments={departments}
                roles={roles}
                employees={employees}
            />
        );
    }

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
                maxWidth: '700px',
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
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7b68ee, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '24px'
                        }}>
                            {employee.name?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1f2937' }}>
                                {employee.name}
                            </h2>
                            <p style={{ margin: '4px 0 8px', color: '#6b7280', fontSize: '14px' }}>
                                {employee.role?.name || 'Employee'} at {employee.department?.name || 'Unassigned'}
                            </p>
                            {getStatusBadge(employee.status)}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px'
                        }}
                    >
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
                    {['details', 'attendance', 'team'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 20px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: activeTab === tab ? '#7b68ee' : '#6b7280',
                                borderBottom: activeTab === tab ? '2px solid #7b68ee' : '2px solid transparent',
                                marginBottom: '-1px',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {activeTab === 'details' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                                    <Mail size={20} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Email</div>
                                        <div style={{ fontWeight: 500 }}>{employee.email}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                                    <Phone size={20} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Phone</div>
                                        <div style={{ fontWeight: 500 }}>{employee.phone || 'Not provided'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                                    <Building2 size={20} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Department</div>
                                        <div style={{ fontWeight: 500 }}>{employee.department?.name || 'Unassigned'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                                    <Shield size={20} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Role</div>
                                        <div style={{ fontWeight: 500 }}>{employee.role?.name || 'Employee'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                                    <Users size={20} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Manager</div>
                                        <div style={{ fontWeight: 500 }}>{employee.manager?.name || 'None'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                                    <Calendar size={20} color="#7b68ee" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Hire Date</div>
                                        <div style={{ fontWeight: 500 }}>
                                            {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not set'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Attendance</h3>
                            {loadingAttendance ? (
                                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Loading...</div>
                            ) : attendance.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px', background: '#f9fafb', borderRadius: '12px' }}>
                                    No attendance records found
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {attendance.slice(0, 10).map((record, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            background: '#f9fafb',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Calendar size={16} color="#6b7280" />
                                                <span>{new Date(record.date).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
                                                    <Clock size={14} />
                                                    {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
                                                    <Clock size={14} />
                                                    {record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </div>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: record.status === 'present' ? '#dcfce7' : record.status === 'late' ? '#fef3c7' : '#fee2e2',
                                                    color: record.status === 'present' ? '#166534' : record.status === 'late' ? '#92400e' : '#991b1b',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div>
                            {employee.manager && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Reports To</h3>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px',
                                        background: '#f9fafb',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600
                                        }}>
                                            {employee.manager.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{employee.manager.name}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>Manager</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                                Direct Reports ({subordinates.length})
                            </h3>
                            {subordinates.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px', background: '#f9fafb', borderRadius: '12px' }}>
                                    No direct reports
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {subordinates.map(sub => (
                                        <div key={sub.id} style={{
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
                                                {sub.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{sub.name}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{sub.role?.name}</div>
                                            </div>
                                            {getStatusBadge(sub.status)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleDeactivate}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        <UserX size={16} /> Deactivate
                    </button>
                    <button
                        onClick={() => setShowEditForm(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Edit2 size={16} /> Edit Employee
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;
