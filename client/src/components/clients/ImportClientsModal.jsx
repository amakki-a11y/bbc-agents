import { useState, useRef } from 'react';
import { useClients } from '../../context/ClientsContext';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';

const ImportClientsModal = ({ onClose, onSuccess }) => {
    const { importClients } = useClients();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState([]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const data = lines.slice(1, 6).filter(line => line.trim()).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, i) => {
                    obj[header] = values[i]?.trim() || '';
                    return obj;
                }, {});
            });

            setPreview(data);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setResult(null);

        try {
            const text = await file.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const clients = lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, i) => {
                    // Map common header names
                    const mappedHeader = {
                        'first name': 'firstName',
                        'firstname': 'firstName',
                        'first_name': 'firstName',
                        'last name': 'lastName',
                        'lastname': 'lastName',
                        'last_name': 'lastName',
                        'email': 'email',
                        'phone': 'phone',
                        'telephone': 'phone',
                        'company': 'companyName',
                        'company name': 'companyName',
                        'company_name': 'companyName',
                        'source': 'source'
                    }[header] || header;

                    obj[mappedHeader] = values[i]?.trim() || '';
                    return obj;
                }, {});
            });

            const data = await importClients(clients);
            setResult(data);

            if (data.success > 0) {
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (err) {
            setResult({ success: 0, failed: 1, errors: [{ error: err.message }] });
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = 'First Name,Last Name,Email,Phone,Company,Source';
        const example = 'John,Doe,john@example.com,+1234567890,Acme Corp,WEBSITE';
        const csv = `${headers}\n${example}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clients_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '550px',
                boxShadow: 'var(--shadow-xl)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        Import Clients
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '0.5rem'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {!result ? (
                        <>
                            {/* Download Template */}
                            <button
                                onClick={downloadTemplate}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginBottom: '1rem',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                <Download size={16} />
                                Download CSV Template
                            </button>

                            {/* Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: file ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!file) {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <FileSpreadsheet size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                <p style={{
                                    color: 'var(--text-primary)',
                                    fontWeight: 500,
                                    marginBottom: '0.5rem'
                                }}>
                                    {file ? file.name : 'Drop your CSV file here or click to browse'}
                                </p>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    margin: 0
                                }}>
                                    Supported format: CSV with headers (first_name, last_name, email, phone, company)
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Preview */}
                            {preview.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h3 style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.75rem'
                                    }}>
                                        Preview (first 5 rows)
                                    </h3>
                                    <div style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        overflow: 'auto',
                                        maxHeight: '200px'
                                    }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '0.8rem'
                                        }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-secondary)' }}>
                                                    {Object.keys(preview[0]).map(key => (
                                                        <th key={key} style={{
                                                            padding: '0.625rem 0.75rem',
                                                            textAlign: 'left',
                                                            fontWeight: 600,
                                                            color: 'var(--text-muted)',
                                                            borderBottom: '1px solid var(--border-color)'
                                                        }}>
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.map((row, i) => (
                                                    <tr key={i}>
                                                        {Object.values(row).map((val, j) => (
                                                            <td key={j} style={{
                                                                padding: '0.625rem 0.75rem',
                                                                borderBottom: i < preview.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                                color: 'var(--text-secondary)'
                                                            }}>
                                                                {val || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Result */
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            {result.success > 0 ? (
                                <CheckCircle size={56} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                            ) : (
                                <AlertCircle size={56} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                            )}
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '0.5rem'
                            }}>
                                Import Complete
                            </h3>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>{result.success}</span> clients imported successfully
                                {result.failed > 0 && (
                                    <>, <span style={{ color: '#ef4444', fontWeight: 600 }}>{result.failed}</span> failed</>
                                )}
                            </p>

                            {result.errors?.length > 0 && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '8px',
                                    textAlign: 'left',
                                    maxHeight: '150px',
                                    overflow: 'auto'
                                }}>
                                    <p style={{
                                        color: '#ef4444',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        marginBottom: '0.5rem'
                                    }}>
                                        Errors:
                                    </p>
                                    {result.errors.slice(0, 5).map((err, i) => (
                                        <p key={i} style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                            margin: '0.25rem 0'
                                        }}>
                                            {err.error}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        {result ? 'Close' : 'Cancel'}
                    </button>
                    {!result && (
                        <button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="btn-modern btn-modern-primary"
                            style={{ opacity: !file || loading ? 0.5 : 1 }}
                        >
                            {loading ? 'Importing...' : 'Import'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportClientsModal;
