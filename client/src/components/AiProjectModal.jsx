import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, Clock, Flag, ChevronRight, Wand2, AlertCircle, RefreshCw } from 'lucide-react';
import { generatePlan, createProjectFromPlan } from '../api/ai';

const LOADING_MESSAGES = [
    "Analyzing your goal...",
    "Breaking down requirements...",
    "Generating task structure...",
    "Estimating time for each task...",
    "Organizing dependencies...",
    "Finalizing your project plan..."
];

const PRIORITY_COLORS = {
    high: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    low: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
};

const AiProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [step, setStep] = useState('input'); // 'input' | 'loading' | 'preview' | 'creating' | 'success'
    const [goal, setGoal] = useState('');
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    // Cycle through loading messages
    useEffect(() => {
        if (step === 'loading') {
            const interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('input');
            setGoal('');
            setPlan(null);
            setError(null);
            setLoadingMessageIndex(0);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!goal.trim() || goal.trim().length < 5) {
            setError('Please enter a more detailed project description (at least 5 characters)');
            return;
        }

        setError(null);
        setStep('loading');

        try {
            const response = await generatePlan(goal.trim());
            setPlan(response.plan);
            setStep('preview');
        } catch (err) {
            console.error('Failed to generate plan:', err);
            setError(err.response?.data?.error || 'Failed to generate project plan. Please try again.');
            setStep('input');
        }
    };

    const handleCreateProject = async () => {
        if (!plan) return;

        setStep('creating');

        try {
            const response = await createProjectFromPlan(plan);
            setStep('success');

            // Wait a moment to show success, then close and notify parent
            setTimeout(() => {
                onProjectCreated?.(response.project);
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Failed to create project:', err);
            setError(err.response?.data?.error || 'Failed to create project. Please try again.');
            setStep('preview');
        }
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    animation: 'fadeIn 0.2s ease-out'
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
                maxWidth: step === 'preview' ? '700px' : '500px',
                maxHeight: '85vh',
                overflow: 'hidden',
                zIndex: 101,
                animation: 'scaleIn 0.2s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                        }}>
                            <Sparkles size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                                AI Project Planner
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                                Describe your goal and let AI create a project plan
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#1f2937'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b7280'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', maxHeight: 'calc(85vh - 80px)', overflowY: 'auto' }}>
                    {/* Error Display */}
                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            color: '#dc2626',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                            <button
                                onClick={() => { setError(null); handleGenerate(); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
                            >
                                <RefreshCw size={14} />
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Step: Input */}
                    {step === 'input' && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#374151'
                            }}>
                                What do you want to build?
                            </label>
                            <textarea
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                placeholder="e.g., Build a marketing campaign for our new product launch with social media, email, and content creation..."
                                autoFocus
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: '2px solid #e5e7eb',
                                    fontSize: '0.95rem',
                                    resize: 'vertical',
                                    outline: 'none',
                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#a78bfa';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.2)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <p style={{
                                margin: '8px 0 0',
                                fontSize: '0.8rem',
                                color: '#9ca3af'
                            }}>
                                Be specific! The more detail you provide, the better your project plan will be.
                            </p>

                            <button
                                onClick={handleGenerate}
                                disabled={!goal.trim()}
                                style={{
                                    width: '100%',
                                    marginTop: '1.25rem',
                                    padding: '14px 20px',
                                    background: goal.trim() ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : '#e5e7eb',
                                    color: goal.trim() ? 'white' : '#9ca3af',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    cursor: goal.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: goal.trim() ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Wand2 size={18} />
                                Generate Project Plan
                            </button>
                        </div>
                    )}

                    {/* Step: Loading */}
                    {step === 'loading' && (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 1rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                margin: '0 auto 1.5rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'pulse 2s infinite'
                            }}>
                                <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                            <p style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: '#1f2937',
                                margin: '0 0 8px'
                            }}>
                                {LOADING_MESSAGES[loadingMessageIndex]}
                            </p>
                            <p style={{
                                fontSize: '0.85rem',
                                color: '#6b7280',
                                margin: 0
                            }}>
                                This usually takes 5-10 seconds
                            </p>
                        </div>
                    )}

                    {/* Step: Preview */}
                    {step === 'preview' && plan && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Plan Header - Sticky */}
                            <div style={{
                                padding: '16px',
                                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                flexShrink: 0
                            }}>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 700, color: '#1f2937' }}>
                                    {plan.name}
                                </h3>
                                <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#6b7280' }}>
                                    {plan.description}
                                </p>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>
                                        <Check size={16} />
                                        {plan.tasks?.length || 0} Tasks
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>
                                        <Clock size={16} />
                                        {formatTime(plan.total_estimated_time || 0)} Total
                                    </div>
                                    <div style={{
                                        padding: '2px 10px',
                                        background: 'white',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: '#7c3aed',
                                        textTransform: 'capitalize'
                                    }}>
                                        {plan.complexity || 'moderate'} complexity
                                    </div>
                                </div>
                            </div>

                            {/* Tasks List - Scrollable */}
                            <div style={{ flex: 1, minHeight: 0, marginBottom: '1rem' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                    Generated Tasks
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    maxHeight: '280px',
                                    overflowY: 'auto',
                                    paddingRight: '4px'
                                }}>
                                    {plan.tasks?.map((task, index) => {
                                        const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
                                        return (
                                            <div
                                                key={index}
                                                className="task-card"
                                                style={{
                                                    padding: '14px 16px',
                                                    background: 'white',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '12px',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'default'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                    e.currentTarget.style.borderColor = '#d1d5db';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    flexShrink: 0,
                                                    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)'
                                                }}>
                                                    {index + 1}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: 600,
                                                        color: '#1f2937',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {task.title}
                                                    </div>
                                                    {task.description && (
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: '#6b7280',
                                                            marginBottom: '10px',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            {task.description}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '3px 10px',
                                                            background: priorityStyle.bg,
                                                            border: `1px solid ${priorityStyle.border}`,
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: priorityStyle.color,
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            <Flag size={11} />
                                                            {task.priority}
                                                        </span>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '3px 10px',
                                                            background: '#f0f9ff',
                                                            border: '1px solid #bae6fd',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: '#0284c7'
                                                        }}>
                                                            <Clock size={11} />
                                                            {formatTime(task.time_estimate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions - Sticky Footer */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                paddingTop: '1rem',
                                borderTop: '1px solid #e5e7eb',
                                flexShrink: 0
                            }}>
                                <button
                                    onClick={handleCreateProject}
                                    style={{
                                        width: '100%',
                                        padding: '16px 24px',
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.5)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.4)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Sparkles size={20} />
                                    Create Project with {plan.tasks?.length || 0} Tasks
                                    <ChevronRight size={20} />
                                </button>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={onClose}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: 'white',
                                            color: '#6b7280',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setStep('input')}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: '#f5f3ff',
                                            color: '#7c3aed',
                                            border: '1px solid #ddd6fe',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                                    >
                                        <RefreshCw size={16} />
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Creating */}
                    {step === 'creating' && (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 1rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <Loader2 size={40} color="#7c3aed" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                                Creating your project...
                            </p>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 1rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                margin: '0 auto 1rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Check size={32} color="#16a34a" />
                            </div>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', margin: '0 0 4px' }}>
                                Project Created!
                            </p>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                                Redirecting to your new project...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </>
    );
};

export default AiProjectModal;
