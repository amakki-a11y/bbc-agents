import { useState, useRef } from 'react';
import { Plus, Upload, FileText, Image, File, X, Layers, Download, Loader2 } from 'lucide-react';

// Using centralized API_URL from http.js
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const TaskTabDetails = ({ task, onUpdate, onTaskRefresh }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const customFields = task?.customFields || [];
    const attachments = task?.attachments || [];

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        await uploadFiles(files);
        e.target.value = ''; // Reset input
    };

    const uploadFiles = async (files) => {
        if (!task?.id || files.length === 0) return;

        // Validate file sizes
        const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            alert(`Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        setIsUploading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');

        try {
            for (const file of files) {
                // For demo purposes, create a data URL (in production, you'd upload to a file server)
                const reader = new FileReader();
                const fileUrl = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });

                await fetch(`${API_URL}/tasks/details/${task.id}/attachments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        file_url: fileUrl,
                        size: file.size
                    })
                });
            }

            if (onTaskRefresh) {
                await onTaskRefresh();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file(s). Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachment) => {
        if (!window.confirm(`Delete "${attachment.filename}"?`)) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            await fetch(`${API_URL}/tasks/details/attachments/${attachment.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (onTaskRefresh) {
                await onTaskRefresh();
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete attachment.');
        }
    };

    const handleDownload = (attachment) => {
        const link = document.createElement('a');
        link.href = attachment.file_url;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return <Image size={20} style={{ color: '#10b981' }} />;
        }
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
            return <FileText size={20} style={{ color: '#3b82f6' }} />;
        }
        return <File size={20} style={{ color: '#6b7280' }} />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Custom Fields Section */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '1rem'
                }}>
                    <Layers size={16} style={{ color: '#6b7280' }} />
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                    }}>
                        Custom Fields
                    </span>
                </div>

                {customFields.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        {customFields.map((field, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280'
                                }}>
                                    {field.name}
                                </span>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: '#374151',
                                    fontWeight: 500
                                }}>
                                    {field.value}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '1rem',
                            background: '#f9fafb',
                            border: '1px dashed #d1d5db',
                            borderRadius: '8px',
                            color: '#9ca3af',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#9ca3af';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.color = '#9ca3af';
                        }}
                    >
                        <Plus size={16} />
                        Add custom field
                    </button>
                )}
            </div>

            {/* Attachments Section */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '1rem'
                }}>
                    <Upload size={16} style={{ color: '#6b7280' }} />
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                    }}>
                        Attachments
                    </span>
                    {attachments.length > 0 && (
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            fontWeight: 500
                        }}>
                            ({attachments.length})
                        </span>
                    )}
                </div>

                {attachments.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                    }}>
                        {attachments.map((file, idx) => (
                            <div
                                key={file.id || idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px',
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getFileIcon(file.filename || file.name)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: '#374151',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {file.filename || file.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#9ca3af'
                                    }}>
                                        {formatFileSize(file.size)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownload(file)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        color: '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                    title="Download"
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeleteAttachment(file)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        color: '#9ca3af',
                                        cursor: 'pointer'
                                    }}
                                    title="Delete"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Drop Zone */}
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '2rem',
                        background: isDragging ? '#eef2ff' : '#f9fafb',
                        border: isDragging ? '2px dashed #6366f1' : '2px dashed #d1d5db',
                        borderRadius: '12px',
                        cursor: isUploading ? 'wait' : 'pointer',
                        transition: 'all 0.15s',
                        opacity: isUploading ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isDragging && !isUploading) {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#9ca3af';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isDragging) {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }
                    }}
                >
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: isDragging ? '#e0e7ff' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {isUploading ? (
                            <Loader2 size={24} style={{ color: '#4f46e5', animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Upload size={24} style={{ color: isDragging ? '#4f46e5' : '#9ca3af' }} />
                        )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: isDragging ? '#4f46e5' : '#374151'
                        }}>
                            {isUploading ? 'Uploading...' : isDragging ? 'Drop files here' : 'Drop files here or click to upload'}
                        </p>
                        <p style={{
                            margin: '4px 0 0',
                            fontSize: '0.8rem',
                            color: '#9ca3af'
                        }}>
                            Max file size: 10MB
                        </p>
                    </div>
                </div>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default TaskTabDetails;
