import { useState } from 'react';
import { X, Send, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import http from '../../api/http';

function AIProjectHelper({ isOpen, onClose, onProjectCreated }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [generatedProject, setGeneratedProject] = useState(null);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I can help you create a new project. Just describe what you want to accomplish and I'll generate a complete project with tasks. For example: 'Create a project for onboarding new sales employees'"
        }
    ]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await http.post('/ai/generate-project', {
                prompt: userMessage
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.message || "Here's what I generated for you:",
                generatedData: response.data.project
            }]);

            if (response.data.project) {
                setGeneratedProject(response.data.project);
            }
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!generatedProject) return;

        setCreating(true);
        try {
            const response = await http.post('/projects', {
                ...generatedProject,
                isAIGenerated: true,
                aiGeneratedBy: 'Claude',
                tasks: generatedProject.tasks
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Project created successfully! It has been sent for approval.'
            }]);
            setGeneratedProject(null);

            if (onProjectCreated) {
                onProjectCreated(response.data);
            }

            // Close after a delay
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error('Error creating project:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: error.response?.data?.error || 'Failed to create project. Please try again.'
            }]);
        } finally {
            setCreating(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '650px',
                    height: '80vh',
                    margin: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>
                                AI Project Helper
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                                Powered by Claude
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'white',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div style={{
                                maxWidth: '85%',
                                padding: '0.875rem 1rem',
                                borderRadius: '12px',
                                background: msg.role === 'user' ? '#6366f1' : '#f3f4f6',
                                color: msg.role === 'user' ? 'white' : '#1f2937',
                                fontSize: '0.9rem',
                                lineHeight: 1.5
                            }}>
                                <p style={{ margin: 0 }}>{msg.content}</p>

                                {/* Show generated data preview */}
                                {msg.generatedData && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.875rem',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <p style={{
                                            fontWeight: 600,
                                            color: '#1f2937',
                                            margin: '0 0 0.5rem 0',
                                            fontSize: '0.95rem'
                                        }}>
                                            {msg.generatedData.name}
                                        </p>
                                        {msg.generatedData.description && (
                                            <p style={{
                                                color: '#6b7280',
                                                margin: '0 0 0.5rem 0',
                                                fontSize: '0.8rem'
                                            }}>
                                                {msg.generatedData.description}
                                            </p>
                                        )}
                                        {msg.generatedData.tasks && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: '#6b7280',
                                                    margin: '0 0 0.25rem 0'
                                                }}>
                                                    Tasks ({msg.generatedData.tasks.length}):
                                                </p>
                                                <ul style={{
                                                    margin: 0,
                                                    paddingLeft: '1.25rem',
                                                    color: '#4b5563',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {msg.generatedData.tasks.slice(0, 5).map((task, i) => (
                                                        <li key={i} style={{ marginBottom: '2px' }}>
                                                            {task.title}
                                                        </li>
                                                    ))}
                                                    {msg.generatedData.tasks.length > 5 && (
                                                        <li style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                                            +{msg.generatedData.tasks.length - 5} more tasks
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div style={{
                                padding: '0.875rem 1rem',
                                background: '#f3f4f6',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#6b7280'
                            }}>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Generating project...
                            </div>
                        </div>
                    )}
                </div>

                {/* Generated Project Actions */}
                {generatedProject && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        background: '#f5f3ff',
                        borderTop: '1px solid #ddd6fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <p style={{
                                fontWeight: 600,
                                color: '#5b21b6',
                                margin: 0,
                                fontSize: '0.9rem'
                            }}>
                                Ready to create: {generatedProject.name}
                            </p>
                            <p style={{
                                color: '#7c3aed',
                                margin: '2px 0 0 0',
                                fontSize: '0.8rem'
                            }}>
                                {generatedProject.tasks?.length || 0} tasks will be generated
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setGeneratedProject(null)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'transparent',
                                    color: '#6b7280',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={creating}
                                style={{
                                    padding: '8px 16px',
                                    background: creating ? '#a78bfa' : '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    cursor: creating ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {creating ? (
                                    <>
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} />
                                        Create Project
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    background: '#fafafa'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-end'
                    }}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Describe what you want to create..."
                            disabled={loading}
                            rows={1}
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                background: 'white',
                                minHeight: '44px',
                                maxHeight: '120px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '0.75rem',
                                background: loading || !input.trim() ? '#ddd6fe' : '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.15s'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
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

export default AIProjectHelper;
