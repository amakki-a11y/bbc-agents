import { useState } from 'react';
import TaskTitle from "./TaskTitle";
import TaskPropertiesGrid from "./TaskPropertiesGrid";
import TaskTabs from "./TaskTabs";
import TaskTabDetails from "./TaskTabDetails";
import TaskTabSubtasks from "./TaskTabSubtasks";
import { AlignLeft, Plus, Sparkles, ChevronDown, X, Check, Loader2, List, Briefcase, Minimize2, Maximize2, Wand2, CheckSquare } from 'lucide-react';

const AI_ACTIONS = [
    { value: 'generate', label: 'Generate description', icon: Sparkles, color: '#8b5cf6' },
    { value: 'improve', label: 'Improve writing', icon: Wand2, color: '#8b5cf6' },
    { value: 'expand', label: 'Add more detail', icon: Maximize2, color: '#3b82f6' },
    { value: 'shorten', label: 'Make it shorter', icon: Minimize2, color: '#3b82f6' },
    { value: 'bullets', label: 'Convert to bullet points', icon: List, color: '#10b981' },
    { value: 'criteria', label: 'Add acceptance criteria', icon: CheckSquare, color: '#f59e0b' },
    { value: 'professional', label: 'Make more professional', icon: Briefcase, color: '#6366f1' }
];

const DescriptionSection = ({ description, onUpdate, taskTitle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localDesc, setLocalDesc] = useState(description || '');
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiError, setAiError] = useState(null);

    // Using centralized API_URL from http.js

    const handleSave = () => {
        setIsEditing(false);
        if (localDesc !== description) {
            onUpdate('description', localDesc);
        }
    };

    const handleAIAction = async (action) => {
        setShowAIMenu(false);
        setIsLoadingAI(true);
        setAiError(null);
        setAiSuggestion(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/bot/write-description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    taskTitle: taskTitle || 'Untitled Task',
                    currentDescription: localDesc || description || '',
                    action: action
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate description');
            }

            const data = await response.json();
            setAiSuggestion(data.description);
        } catch (err) {
            console.error('AI description error:', err);
            setAiError(err.message || 'Failed to generate description');
        } finally {
            setIsLoadingAI(false);
        }
    };

    const acceptSuggestion = () => {
        setLocalDesc(aiSuggestion);
        setAiSuggestion(null);
        setIsEditing(true);
    };

    const rejectSuggestion = () => {
        setAiSuggestion(null);
    };

    // Filter AI actions based on whether there's existing content
    const availableActions = description || localDesc
        ? AI_ACTIONS
        : AI_ACTIONS.filter(a => a.value === 'generate');

    if (isEditing) {
        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlignLeft size={16} style={{ color: '#6b7280' }} />
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#374151',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em'
                        }}>
                            Description
                        </span>
                    </div>
                    {/* AI Button */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowAIMenu(!showAIMenu)}
                            disabled={isLoadingAI}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                background: isLoadingAI ? '#e5e7eb' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: 'white',
                                cursor: isLoadingAI ? 'wait' : 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            {isLoadingAI ? (
                                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Sparkles size={12} />
                            )}
                            {isLoadingAI ? 'Writing...' : 'AI'}
                            {!isLoadingAI && <ChevronDown size={12} />}
                        </button>

                        {showAIMenu && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                    onClick={() => setShowAIMenu(false)}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '4px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                    border: '1px solid #e5e7eb',
                                    minWidth: '180px',
                                    zIndex: 20,
                                    overflow: 'hidden'
                                }}>
                                    {availableActions.map((action) => {
                                        const ActionIcon = action.icon;
                                        return (
                                            <button
                                                key={action.value}
                                                onClick={() => handleAIAction(action.value)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    fontSize: '0.85rem',
                                                    color: '#374151',
                                                    cursor: 'pointer',
                                                    textAlign: 'left'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <ActionIcon size={16} style={{ color: action.color }} />
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* AI Suggestion Preview */}
                {aiSuggestion && (
                    <div style={{
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                        borderRadius: '8px',
                        border: '1px solid #c4b5fd'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                            color: '#7c3aed',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            <Sparkles size={12} />
                            AI Suggestion
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#374151',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap'
                        }}>
                            {aiSuggestion}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                                onClick={acceptSuggestion}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <Check size={14} />
                                Accept
                            </button>
                            <button
                                onClick={rejectSuggestion}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: 'white',
                                    color: '#6b7280',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={14} />
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Error */}
                {aiError && (
                    <div style={{
                        marginBottom: '12px',
                        padding: '10px 12px',
                        background: '#fef2f2',
                        borderRadius: '8px',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: '0.85rem'
                    }}>
                        {aiError}
                    </div>
                )}

                <textarea
                    value={localDesc}
                    onChange={(e) => setLocalDesc(e.target.value)}
                    onBlur={handleSave}
                    autoFocus
                    placeholder="Add a more detailed description..."
                    style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#374151',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.6
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '6px 14px',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        Save
                    </button>
                    <button
                        onClick={() => {
                            setLocalDesc(description || '');
                            setIsEditing(false);
                            setAiSuggestion(null);
                        }}
                        style={{
                            padding: '6px 14px',
                            background: '#f3f4f6',
                            color: '#6b7280',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
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

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlignLeft size={16} style={{ color: '#6b7280' }} />
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                    }}>
                        Description
                    </span>
                </div>
                {/* AI Button (non-editing mode) */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowAIMenu(!showAIMenu)}
                        disabled={isLoadingAI}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: isLoadingAI ? '#e5e7eb' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'white',
                            cursor: isLoadingAI ? 'wait' : 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        {isLoadingAI ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Sparkles size={12} />
                        )}
                        {isLoadingAI ? 'Writing...' : 'AI'}
                        {!isLoadingAI && <ChevronDown size={12} />}
                    </button>

                    {showAIMenu && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                onClick={() => setShowAIMenu(false)}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                background: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                border: '1px solid #e5e7eb',
                                minWidth: '180px',
                                zIndex: 20,
                                overflow: 'hidden'
                            }}>
                                {availableActions.map((action) => {
                                    const ActionIcon = action.icon;
                                    return (
                                        <button
                                            key={action.value}
                                            onClick={() => handleAIAction(action.value)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                width: '100%',
                                                padding: '10px 14px',
                                                background: 'transparent',
                                                border: 'none',
                                                fontSize: '0.85rem',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <ActionIcon size={16} style={{ color: action.color }} />
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* AI Loading indicator */}
            {isLoadingAI && (
                <div style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                    borderRadius: '8px',
                    border: '1px solid #c4b5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#7c3aed',
                    fontSize: '0.85rem'
                }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    AI is writing your description...
                </div>
            )}

            {/* AI Suggestion Preview (non-editing mode) */}
            {aiSuggestion && (
                <div style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                    borderRadius: '8px',
                    border: '1px solid #c4b5fd'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                        color: '#7c3aed',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        <Sparkles size={12} />
                        AI Suggestion
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        color: '#374151',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {aiSuggestion}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                            onClick={acceptSuggestion}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <Check size={14} />
                            Accept
                        </button>
                        <button
                            onClick={rejectSuggestion}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'white',
                                color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <X size={14} />
                            Reject
                        </button>
                    </div>
                </div>
            )}

            {/* AI Error (non-editing mode) */}
            {aiError && (
                <div style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.85rem'
                }}>
                    {aiError}
                </div>
            )}

            {description ? (
                <div
                    onClick={() => setIsEditing(true)}
                    style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#374151',
                        lineHeight: 1.6,
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'all 0.15s',
                        whiteSpace: 'pre-wrap'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = 'transparent';
                    }}
                >
                    {description}
                </div>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        background: '#f9fafb',
                        border: '1px dashed #d1d5db',
                        borderRadius: '8px',
                        width: '100%',
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
                    Add description
                </button>
            )}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const TaskDetailsMain = ({ task, onUpdate, activeTab, setActiveTab, onTaskRefresh }) => {
    const subtaskCount = task.subtasks?.length || 0;
    const actionItemCount = task.actionItems?.length || 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Scrollable Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem 2rem'
            }}>
                <div style={{ maxWidth: '800px' }}>
                    {/* Title */}
                    <TaskTitle title={task.title} onUpdate={(val) => onUpdate("title", val)} />

                    {/* Two Column Properties Grid */}
                    <TaskPropertiesGrid task={task} onUpdate={onUpdate} onTaskRefresh={onTaskRefresh} />

                    {/* Description */}
                    <DescriptionSection
                        description={task.description}
                        onUpdate={onUpdate}
                        taskTitle={task.title}
                    />

                    {/* Tabs */}
                    <TaskTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        counts={{
                            subtasks: subtaskCount,
                            actionItems: actionItemCount
                        }}
                    />

                    {/* Tab Content */}
                    <div style={{ marginTop: '1rem' }}>
                        {activeTab === "details" && (
                            <TaskTabDetails task={task} onUpdate={onUpdate} onTaskRefresh={onTaskRefresh} />
                        )}

                        {activeTab === "subtasks" && (
                            <TaskTabSubtasks
                                taskId={task.id}
                                task={task}
                                onTaskRefresh={onTaskRefresh}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsMain;
