import { useState, useEffect, useCallback } from 'react';
import { http, API_BASE } from '../api/http';
import Dashboard from './Dashboard';
import {
    FileText, Plus, Download, Trash2, Search, Filter, X, Upload,
    File, FileImage, FileSpreadsheet, FileArchive, Eye, Calendar,
    User, Building2, ChevronDown, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [stats, setStats] = useState({ total: 0, byType: {} });

    const documentTypes = [
        'contract', 'id_document', 'certificate', 'resume',
        'performance_review', 'training', 'policy', 'other'
    ];

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await http.get('/employees?limit=500');
            setEmployees(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, []);

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch documents for all employees or selected employee
            if (selectedEmployee) {
                const res = await http.get(`/documents/employee/${selectedEmployee}`);
                const docs = res.data || [];
                setDocuments(docs);
                calculateStats(docs);
            } else {
                // Fetch documents for all employees
                const allDocs = [];
                for (const emp of employees.slice(0, 50)) { // Limit to prevent too many requests
                    try {
                        const res = await http.get(`/documents/employee/${emp.id}`);
                        const docs = (res.data || []).map(doc => ({ ...doc, employee: emp }));
                        allDocs.push(...docs);
                    } catch (e) {
                        // Skip employees with no documents
                    }
                }
                setDocuments(allDocs);
                calculateStats(allDocs);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedEmployee, employees]);

    const calculateStats = (docs) => {
        const byType = {};
        docs.forEach(doc => {
            byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
        });
        setStats({ total: docs.length, byType });
    };

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        if (employees.length > 0) {
            fetchDocuments();
        }
    }, [employees, selectedEmployee, fetchDocuments]);

    const handleDelete = async (docId) => {
        if (!window.confirm('Delete this document? This action cannot be undone.')) return;
        try {
            await http.delete(`/documents/${docId}`);
            setDocuments(prev => prev.filter(d => d.id !== docId));
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    const handleDownload = async (doc) => {
        try {
            window.open(`${API_BASE}/api/v1/documents/${doc.id}/download`, '_blank');
        } catch (error) {
            console.error('Failed to download document:', error);
        }
    };

    const getFileIcon = (mimeType, fileName) => {
        if (mimeType?.includes('image')) return <FileImage size={20} className="text-purple-500" />;
        if (mimeType?.includes('spreadsheet') || fileName?.match(/\.(xls|xlsx|csv)$/i))
            return <FileSpreadsheet size={20} className="text-green-500" />;
        if (mimeType?.includes('pdf')) return <FileText size={20} className="text-red-500" />;
        if (mimeType?.includes('zip') || mimeType?.includes('archive'))
            return <FileArchive size={20} className="text-yellow-500" />;
        return <File size={20} className="text-blue-500" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getTypeBadgeStyle = (type) => {
        const styles = {
            contract: { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1d4ed8' },
            id_document: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#b45309' },
            certificate: { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#047857' },
            resume: { bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', color: '#6d28d9' },
            performance_review: { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', color: '#be185d' },
            training: { bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)', color: '#0891b2' },
            policy: { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#7c3aed' },
            other: { bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', color: '#475569' }
        };
        return styles[type] || styles.other;
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = !searchQuery ||
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !filterType || doc.documentType === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <Dashboard>
            <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }} className="scrollbar-thin">
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div>
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    padding: '0.625rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FileText size={24} color="white" />
                                </div>
                                Documents
                            </h1>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Manage employee documents and files
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="btn-modern btn-modern-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Upload size={18} />
                            Upload Document
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div className="card-modern" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                padding: '0.75rem',
                                borderRadius: '12px'
                            }}>
                                <FileText size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {stats.total}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Documents</div>
                            </div>
                        </div>
                    </div>
                    <div className="card-modern" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                padding: '0.75rem',
                                borderRadius: '12px'
                            }}>
                                <CheckCircle2 size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {stats.byType.contract || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contracts</div>
                            </div>
                        </div>
                    </div>
                    <div className="card-modern" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                padding: '0.75rem',
                                borderRadius: '12px'
                            }}>
                                <File size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {stats.byType.id_document || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID Documents</div>
                            </div>
                        </div>
                    </div>
                    <div className="card-modern" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                padding: '0.75rem',
                                borderRadius: '12px'
                            }}>
                                <User size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {employees.length}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employees</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card-modern" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{
                            flex: 1,
                            minWidth: '250px',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '10px',
                            padding: '0.5rem 1rem',
                            gap: '0.75rem'
                        }}>
                            <Search size={18} style={{ color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem'
                                }}
                            />
                            {searchQuery && (
                                <X
                                    size={16}
                                    style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                                    onClick={() => setSearchQuery('')}
                                />
                            )}
                        </div>

                        {/* Employee Filter */}
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="input-modern"
                            style={{ minWidth: '200px' }}
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="input-modern"
                            style={{ minWidth: '180px' }}
                        >
                            <option value="">All Types</option>
                            {documentTypes.map(type => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Documents Table */}
                <div className="card-modern" style={{ overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                            Loading documents...
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No documents found</p>
                            {(searchQuery || filterType || selectedEmployee) && (
                                <button
                                    onClick={() => { setSearchQuery(''); setFilterType(''); setSelectedEmployee(''); }}
                                    className="btn-modern"
                                    style={{ marginTop: '1rem' }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Document</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Size</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Uploaded</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocuments.map((doc, index) => (
                                    <tr
                                        key={doc.id}
                                        style={{
                                            borderBottom: index < filteredDocuments.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    background: 'var(--bg-tertiary)',
                                                    padding: '0.5rem',
                                                    borderRadius: '8px'
                                                }}>
                                                    {getFileIcon(doc.mimeType, doc.fileName)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
                                                        {doc.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {doc.fileName}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {doc.employee?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                ...getTypeBadgeStyle(doc.documentType),
                                                background: getTypeBadgeStyle(doc.documentType).bg,
                                                color: getTypeBadgeStyle(doc.documentType).color,
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'capitalize'
                                            }}>
                                                {doc.documentType?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {formatFileSize(doc.fileSize)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <Calendar size={14} />
                                                {formatDate(doc.created_at)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    title="Download"
                                                    style={{
                                                        background: 'var(--bg-tertiary)',
                                                        border: 'none',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-secondary)',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--primary)';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                    }}
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    title="Delete"
                                                    style={{
                                                        background: 'var(--bg-tertiary)',
                                                        border: 'none',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-secondary)',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--danger)';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <UploadDocumentModal
                        employees={employees}
                        documentTypes={documentTypes}
                        onClose={() => setShowUploadModal(false)}
                        onUpload={() => {
                            setShowUploadModal(false);
                            fetchDocuments();
                        }}
                    />
                )}
            </div>
        </Dashboard>
    );
};

// Upload Document Modal Component
const UploadDocumentModal = ({ employees, documentTypes, onClose, onUpload }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        documentType: '',
        title: '',
        description: '',
        expiryDate: '',
        isConfidential: false
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.employeeId || !formData.documentType || !formData.title) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('file', file);
            data.append('documentType', formData.documentType);
            data.append('title', formData.title);
            if (formData.description) data.append('description', formData.description);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            data.append('isConfidential', formData.isConfidential);

            await http.post(`/documents/employee/${formData.employeeId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onUpload();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100%', maxWidth: '520px' }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Upload Document
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Add a new document for an employee
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-tertiary)',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    {error && (
                        <div style={{
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Employee Select */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Employee *
                            </label>
                            <select
                                value={formData.employeeId}
                                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                className="input-modern"
                                required
                            >
                                <option value="">Select employee...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Document Type */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Document Type *
                            </label>
                            <select
                                value={formData.documentType}
                                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                                className="input-modern"
                                required
                            >
                                <option value="">Select type...</option>
                                {documentTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="input-modern"
                                placeholder="Document title..."
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="input-modern"
                                placeholder="Optional description..."
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                File *
                            </label>
                            <div style={{
                                border: '2px dashed var(--border-color)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: file ? 'var(--bg-tertiary)' : 'transparent'
                            }}>
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.txt"
                                />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                                    {file ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                                            <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                                Click to upload or drag and drop
                                            </p>
                                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                                                PDF, DOC, DOCX, Images, XLS (max 10MB)
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                                className="input-modern"
                            />
                        </div>

                        {/* Confidential Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="confidential"
                                checked={formData.isConfidential}
                                onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <label htmlFor="confidential" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Mark as confidential
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end',
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <button type="button" onClick={onClose} className="btn-modern">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-modern btn-modern-primary"
                            disabled={loading}
                        >
                            {loading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentsPage;
