import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import http from '../../api/http';

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4'
];

function CreateProjectModal({ isOpen, onClose, onCreated }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'MEDIUM',
        color: '#6366f1',
        startDate: '',
        dueDate: '',
        departmentId: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Project name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await http.post('/projects', {
                name: formData.name.trim(),
                description: formData.description.trim(),
                priority: formData.priority,
                color: formData.color,
                startDate: formData.startDate || null,
                dueDate: formData.dueDate || null,
                departmentId: formData.departmentId || null
            });

            if (onCreated) {
                onCreated(response.data);
            }
            onClose();
            setFormData({
                name: '',
                description: '',
                priority: 'MEDIUM',
                color: '#6366f1',
                startDate: '',
                dueDate: '',
                departmentId: ''
            });
        } catch (err) {
            console.error('Create project error:', err);
            setError(err.response?.data?.error || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '1rem',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                        Create New Project
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Project Name */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem'
                        }}>
                            Project Name <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter project name"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'border-color 0.15s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.5rem'
                        }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your project..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    {/* Priority & Color */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.5rem'
                            }}>
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.5rem'
                            }}>
                                Color
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: color,
                                            border: formData.color === color ? '3px solid #1f2937' : '2px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.5rem'
                            }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.5rem'
                            }}>
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'transparent',
                                color: '#6b7280',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: loading || !formData.name.trim() ? '#a5b4fc' : '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: loading || !formData.name.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default CreateProjectModal;
