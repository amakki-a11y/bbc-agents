import { useState } from 'react';
import { Sparkles, X, Loader2, Send, Lightbulb, AlertTriangle, CheckCircle, ListTodo, RefreshCw } from 'lucide-react';
import { assistProject, generateSubtasks, saveSubtasks, scanProjectRisks } from '../api/ai';

const QUICK_PROMPTS = [
    { icon: Lightbulb, label: "What should we focus on?", prompt: "What should we focus on next? Give me top 3 priorities." },
    { icon: AlertTriangle, label: "Any risks or blockers?", prompt: "Are there any risks or blockers I should be aware of?" },
    { icon: CheckCircle, label: "How's our progress?", prompt: "Give me a brief progress report and health check." },
    { icon: ListTodo, label: "Suggest next tasks", prompt: "Based on the current state, what tasks should we add next?" }
];

/**
 * AI Assist Button & Modal
 * Context-aware AI assistant for projects and tasks
 */
const AiAssistButton = ({
    context = 'project', // 'project' | 'task'
    projectId = null,
    taskId = null,
    taskTitle = null,
    onSubtasksGenerated = null, // Callback when subtasks are generated
    size = 'default', // 'small' | 'default' | 'large'
    variant = 'button' // 'button' | 'icon' | 'floating'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState(null);
    const [subtasks, setSubtasks] = useState(null);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('chat'); // 'chat' | 'subtasks' | 'scan'

    const handleOpen = () => {
        setIsOpen(true);
        setResponse(null);
        setSubtasks(null);
        setError(null);
        setQuestion('');
        setMode(context === 'task' ? 'subtasks' : 'chat');
    };

    const handleClose = () => {
        setIsOpen(false);
        setResponse(null);
        setSubtasks(null);
    };

    const handleAsk = async (prompt = null) => {
        const q = prompt || question;
        if (!q.trim() && mode === 'chat') return;

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            if (mode === 'chat' && projectId) {
                const result = await assistProject(projectId, q);
                setResponse(result);
            } else if (mode === 'subtasks' && taskId) {
                const result = await generateSubtasks(taskId, 5);
                setSubtasks(result.subtasks);
            } else if (mode === 'scan' && projectId) {
                const result = await scanProjectRisks(projectId);
                setResponse({
                    advice: `**Risk Level: ${result.riskLevel.toUpperCase()}**\n\n` +
                        `Health Score: ${result.healthScore}/100\n` +
                        `Overdue Tasks: ${result.overdueTasks}\n` +
                        `Active Tasks: ${result.totalActiveTasks}\n\n` +
                        (result.tasks.length > 0
                            ? `**Overdue Tasks:**\n${result.tasks.map(t => `- ${t.title}`).join('\n')}`
                            : 'No overdue tasks!')
                });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to get AI response');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSubtasks = async () => {
        if (!subtasks || !taskId) return;

        setLoading(true);
        try {
            await saveSubtasks(taskId, subtasks);
            onSubtasksGenerated?.(subtasks);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save subtasks');
        } finally {
            setLoading(false);
        }
    };

    const buttonSizes = {
        small: { padding: '6px 12px', fontSize: '0.8rem', iconSize: 14 },
        default: { padding: '8px 16px', fontSize: '0.875rem', iconSize: 16 },
        large: { padding: '12px 20px', fontSize: '0.95rem', iconSize: 18 }
    };

    const sizeConfig = buttonSizes[size];

    // Render button based on variant
    const renderButton = () => {
        if (variant === 'floating') {
            return (
                <button
                    onClick={handleOpen}
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '24px',
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
                        zIndex: 90,
                        transition: 'all 0.2s'
                    }}
                    title="AI Assistant"
                >
                    <Sparkles size={24} />
                </button>
            );
        }

        if (variant === 'icon') {
            return (
                <button
                    onClick={handleOpen}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a78bfa',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                    }}
                    title="AI Assist"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <Sparkles size={sizeConfig.iconSize} />
                </button>
            );
        }

        return (
            <button
                onClick={handleOpen}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: sizeConfig.padding,
                    fontSize: sizeConfig.fontSize,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                    transition: 'all 0.15s'
                }}
            >
                <Sparkles size={sizeConfig.iconSize} />
                AI Assist
            </button>
        );
    };

    if (!isOpen) return renderButton();

    return (
        <>
            {renderButton()}

            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '90%',
                maxWidth: '550px',
                maxHeight: '80vh',
                overflow: 'hidden',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                                AI Assistant
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                                {context === 'task' ? `Task: ${taskTitle || 'Unknown'}` : 'Project Co-Pilot'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Mode Tabs (for projects) */}
                {context === 'project' && (
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #e5e7eb',
                        padding: '0 1rem'
                    }}>
                        {[
                            { key: 'chat', label: 'Ask AI', icon: Sparkles },
                            { key: 'scan', label: 'Risk Scan', icon: AlertTriangle }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => { setMode(tab.key); setResponse(null); setError(null); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: mode === tab.key ? '2px solid #7c3aed' : '2px solid transparent',
                                    color: mode === tab.key ? '#7c3aed' : '#6b7280',
                                    fontWeight: mode === tab.key ? 600 : 500,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div style={{ padding: '1.25rem', flex: 1, overflow: 'auto' }}>
                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Chat Mode */}
                    {mode === 'chat' && !response && !loading && (
                        <>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                Quick questions:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                                {QUICK_PROMPTS.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAsk(item.prompt)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px 14px',
                                            background: '#f9fafb',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            color: '#374151',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = '#f3f4f6';
                                            e.currentTarget.style.borderColor = '#d1d5db';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#f9fafb';
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                        }}
                                    >
                                        <item.icon size={16} style={{ color: '#7c3aed' }} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAsk()}
                                    placeholder="Ask anything about this project..."
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#a78bfa'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                                <button
                                    onClick={() => handleAsk()}
                                    disabled={!question.trim()}
                                    style={{
                                        padding: '10px 14px',
                                        background: question.trim() ? '#7c3aed' : '#e5e7eb',
                                        color: question.trim() ? 'white' : '#9ca3af',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: question.trim() ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Scan Mode Button */}
                    {mode === 'scan' && !response && !loading && (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                            <h4 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>Risk Scanner</h4>
                            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                Analyze your project for overdue tasks, bottlenecks, and risks.
                            </p>
                            <button
                                onClick={() => handleAsk()}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <RefreshCw size={16} />
                                Run Risk Scan
                            </button>
                        </div>
                    )}

                    {/* Subtasks Mode */}
                    {mode === 'subtasks' && !subtasks && !loading && (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <ListTodo size={48} style={{ color: '#7c3aed', marginBottom: '1rem' }} />
                            <h4 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>Break Down Task</h4>
                            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                Let AI break this task into actionable subtasks.
                            </p>
                            <button
                                onClick={() => handleAsk()}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Sparkles size={16} />
                                Generate Subtasks
                            </button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                            <Loader2 size={32} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
                            <p style={{ margin: '1rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                                {mode === 'subtasks' ? 'Breaking down task...' : 'Analyzing project...'}
                            </p>
                        </div>
                    )}

                    {/* Response */}
                    {response && (
                        <div style={{
                            padding: '16px',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            color: '#374151',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {response.advice}
                        </div>
                    )}

                    {/* Subtasks Result */}
                    {subtasks && (
                        <div>
                            <p style={{ margin: '0 0 1rem', fontWeight: 600, color: '#1f2937' }}>
                                Generated {subtasks.length} subtasks:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                                {subtasks.map((st, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '12px',
                                            background: '#f9fafb',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                            {i + 1}. {st.title}
                                        </div>
                                        {st.description && (
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {st.description}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setSubtasks(null)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Regenerate
                                </button>
                                <button
                                    onClick={handleSaveSubtasks}
                                    disabled={loading}
                                    style={{
                                        flex: 2,
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 600,
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <CheckCircle size={16} />
                                    Add to Task
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default AiAssistButton;
