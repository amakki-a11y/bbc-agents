import { useState, useEffect } from 'react';
import { Link2, Plus, ArrowRight, ArrowLeft, X, Search, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const RelationshipsField = ({ taskId, blockedBy = [], blocking = [], onTaskRefresh }) => {
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const hasBlockedBy = blockedBy && blockedBy.length > 0;
    const hasBlocking = blocking && blocking.length > 0;

    // Search tasks when modal opens or query changes
    useEffect(() => {
        if (!showModal) return;

        const searchTasks = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/tasks?search=${encodeURIComponent(searchQuery)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const tasks = await response.json();
                    // Filter out current task and already linked tasks
                    const filteredTasks = tasks.filter(t =>
                        t.id !== taskId &&
                        !blockedBy.some(b => b.id === t.id) &&
                        !blocking.some(b => b.id === t.id)
                    );
                    setSearchResults(filteredTasks.slice(0, 5));
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchTasks, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, showModal, taskId, blockedBy, blocking]);

    const handleAddDependency = async (dependsOnId) => {
        if (!taskId) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/details/${taskId}/dependencies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ depends_on_id: dependsOnId })
            });

            if (response.ok) {
                setShowModal(false);
                setSearchQuery('');
                if (onTaskRefresh) await onTaskRefresh();
            }
        } catch (error) {
            console.error('Failed to add dependency:', error);
        }
    };

    const handleRemoveDependency = async (dependsOnId) => {
        if (!taskId || !window.confirm('Remove this dependency?')) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            await fetch(`${API_URL}/tasks/details/${taskId}/dependencies/${dependsOnId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (onTaskRefresh) await onTaskRefresh();
        } catch (error) {
            console.error('Failed to remove dependency:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#6b7280',
                    minWidth: '90px',
                    paddingTop: '6px'
                }}>
                    Links
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    alignItems: 'flex-end',
                    flex: 1
                }}>
                    {/* Blocked By (Dependencies) */}
                    {hasBlockedBy && blockedBy.map((dep) => (
                        <div
                            key={`blocked-${dep.id}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#fef2f2',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                fontSize: '0.8rem',
                                color: '#374151'
                            }}
                        >
                            <Lock size={12} style={{ color: '#dc2626' }} />
                            <span style={{ fontWeight: 500, color: '#dc2626' }}>Blocked by</span>
                            <span style={{ color: '#6b7280' }}>#{dep.id}</span>
                            <span style={{
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {dep.title}
                            </span>
                            <button
                                onClick={() => handleRemoveDependency(dep.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '2px',
                                    borderRadius: '50%',
                                    color: '#9ca3af',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Blocking (Tasks this blocks) */}
                    {hasBlocking && blocking.map((dep) => (
                        <div
                            key={`blocking-${dep.id}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#eff6ff',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.8rem',
                                color: '#374151'
                            }}
                        >
                            <ArrowRight size={12} style={{ color: '#3b82f6' }} />
                            <span style={{ fontWeight: 500, color: '#3b82f6' }}>Blocks</span>
                            <span style={{ color: '#6b7280' }}>#{dep.id}</span>
                            <span style={{
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {dep.title}
                            </span>
                        </div>
                    ))}

                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f9fafb',
                            border: '1px dashed #d1d5db',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: '#9ca3af',
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
                        <Link2 size={14} />
                        Add dependency
                    </button>
                </div>
            </div>

            {/* Search Modal */}
            {showModal && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.4)',
                            zIndex: 100
                        }}
                        onClick={() => {
                            setShowModal(false);
                            setSearchQuery('');
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        width: '400px',
                        maxHeight: '400px',
                        zIndex: 101,
                        overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderBottom: '1px solid #e5e7eb'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#1f2937'
                            }}>
                                Add Dependency
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSearchQuery('');
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div style={{ padding: '12px 16px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 12px',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <Search size={16} style={{ color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for a task..."
                                    autoFocus
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        fontSize: '0.9rem',
                                        color: '#374151'
                                    }}
                                />
                            </div>
                            <p style={{
                                margin: '8px 0 0',
                                fontSize: '0.75rem',
                                color: '#9ca3af'
                            }}>
                                This task will be blocked by the selected task
                            </p>
                        </div>

                        {/* Search Results */}
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '0 16px 16px'
                        }}>
                            {isLoading ? (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                    fontSize: '0.85rem'
                                }}>
                                    Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {searchResults.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleAddDependency(task.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                background: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f9fafb';
                                                e.currentTarget.style.borderColor = '#d1d5db';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#9ca3af',
                                                fontWeight: 500
                                            }}>
                                                #{task.id}
                                            </span>
                                            <span style={{
                                                flex: 1,
                                                fontSize: '0.85rem',
                                                color: '#374151',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {task.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery.trim() ? (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                    fontSize: '0.85rem'
                                }}>
                                    No tasks found
                                </div>
                            ) : (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                    fontSize: '0.85rem'
                                }}>
                                    Type to search for tasks
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RelationshipsField;
