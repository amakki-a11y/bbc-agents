import { useState } from 'react';
import { http } from '../../api/http';
import { X, Save, Loader2 } from 'lucide-react';

const EmployeeForm = ({ employee, onClose, onSave, departments = [], roles = [], employees = [] }) => {
    // Debug: Log props to verify data is being passed
    console.log('EmployeeForm received:', { departments, roles, employees });

    const isEditing = !!employee;
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        name: employee?.name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        department_id: employee?.department_id || '',
        role_id: employee?.role_id || '',
        manager_id: employee?.manager_id || '',
        hire_date: employee?.hire_date
            ? new Date(employee.hire_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        status: employee?.status || 'active'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('Field changed:', name, '=', value);
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.department_id) newErrors.department_id = 'Department is required';
        if (!formData.role_id) newErrors.role_id = 'Role is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                department_id: formData.department_id,
                role_id: formData.role_id,
                manager_id: formData.manager_id || null,
                hire_date: formData.hire_date || null,
                status: formData.status
            };
            console.log('Sending payload:', payload);
            console.log('formData state:', formData);

            if (isEditing) {
                await http.put(`/employees/${employee.id}`, payload);
            } else {
                await http.post('/employees', payload);
            }
            onSave();
        } catch (error) {
            console.error('Failed to save employee:', error);
            const message = error.response?.data?.error || 'Failed to save employee';
            setErrors({ submit: message });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (hasError) => ({
        width: '100%',
        padding: '10px 14px',
        border: `1px solid ${hasError ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        background: hasError ? '#fef2f2' : 'white',
        transition: 'border-color 0.2s'
    });

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '6px'
    };

    // Filter out the current employee from potential managers
    const potentialManagers = employees.filter(e => e.id !== employee?.id);

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
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>
                        {isEditing ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
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

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {errors.submit && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            marginBottom: '20px',
                            fontSize: '14px'
                        }}>
                            {errors.submit}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '20px' }}>
                        {/* Name */}
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                style={inputStyle(errors.name)}
                                placeholder="Enter full name"
                            />
                            {errors.name && (
                                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                    {errors.name}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label style={labelStyle}>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={inputStyle(errors.email)}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                style={inputStyle(false)}
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Department and Role - 2 columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Department *</label>
                                <select
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    style={inputStyle(errors.department_id)}
                                >
                                    <option value="">Select department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                                {errors.department_id && (
                                    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.department_id}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Role *</label>
                                <select
                                    name="role_id"
                                    value={formData.role_id}
                                    onChange={handleChange}
                                    style={inputStyle(errors.role_id)}
                                >
                                    <option value="">Select role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                {errors.role_id && (
                                    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.role_id}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Manager */}
                        <div>
                            <label style={labelStyle}>Manager</label>
                            <select
                                name="manager_id"
                                value={formData.manager_id}
                                onChange={handleChange}
                                style={inputStyle(false)}
                            >
                                <option value="">No manager</option>
                                {potentialManagers.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Hire Date and Status - 2 columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Hire Date</label>
                                <input
                                    type="date"
                                    name="hire_date"
                                    value={formData.hire_date}
                                    onChange={handleChange}
                                    style={inputStyle(false)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={inputStyle(false)}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on_leave">On Leave</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
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
                            fontWeight: 500,
                            color: '#374151'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {isEditing ? 'Update Employee' : 'Add Employee'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeForm;
