import { useState, memo, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { Plus, MoreHorizontal, Calendar, Flag, User as UserIcon, GripVertical, CheckCircle2 } from 'lucide-react';

const getPriorityConfig = (priority) => {
    switch (priority) {
        case 'urgent': return { color: '#dc2626', bgColor: '#fef2f2', label: 'Urgent' };
        case 'high': return { color: '#ea580c', bgColor: '#fff7ed', label: 'High' };
        case 'normal': return { color: '#2563eb', bgColor: '#eff6ff', label: 'Normal' };
        case 'low': return { color: '#16a34a', bgColor: '#f0fdf4', label: 'Low' };
        default: return null;
    }
};

const getAssigneeColor = (name) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
};

const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (date.getTime() === today.getTime()) return { text: 'Today', isOverdue: false, isToday: true };
    if (date.getTime() === tomorrow.getTime()) return { text: 'Tomorrow', isOverdue: false };
    if (diffDays < 0) return { text: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), isOverdue: true };
    return { text: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), isOverdue: false };
};

const BoardCard = memo(({ task, onDragStart, onDragEnd, onOpenTask, isDragging }) => {
    const [isHovered, setIsHovered] = useState(false);
    const priorityConfig = getPriorityConfig(task.priority);
    const dueInfo = formatDueDate(task.due_date);
    const isDone = task.status === 'done' || task.status === 'DONE';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
            onClick={() => onOpenTask(task)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'white',
                borderRadius: '10px',
                padding: '14px',
                boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.08)',
                cursor: 'grab',
                border: isHovered ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
                transform: isDragging ? 'rotate(3deg) scale(1.02)' : isHovered ? 'translateY(-2px)' : 'none',
                opacity: isDragging ? 0.9 : 1
            }}
        >
            {/* Top Row - Drag handle + Menu */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '10px'
            }}>
                <div style={{
                    opacity: isHovered ? 0.5 : 0,
                    transition: 'opacity 0.15s',
                    cursor: 'grab',
                    padding: '2px'
                }}>
                    <GripVertical size={14} color="#9ca3af" />
                </div>
                <div style={{
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.15s',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                }}
                onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal size={16} color="#9ca3af" />
                </div>
            </div>

            {/* Title */}
            <div style={{
                fontSize: '0.9rem',
                color: isDone ? '#9ca3af' : '#1f2937',
                fontWeight: 500,
                lineHeight: 1.5,
                marginBottom: '12px',
                textDecoration: isDone ? 'line-through' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
            }}>
                {isDone && <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />}
                <span>{task.title}</span>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                    {(Array.isArray(task.tags) ? task.tags : []).slice(0, 3).map((tag, idx) => (
                        <span key={idx} style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: '#f3f4f6',
                            color: '#6b7280'
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Bottom Row - Meta Info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Priority Badge */}
                    {priorityConfig && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: priorityConfig.bgColor,
                            border: `1px solid ${priorityConfig.color}20`
                        }}>
                            <Flag size={10} fill={priorityConfig.color} color={priorityConfig.color} />
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: priorityConfig.color,
                                textTransform: 'uppercase'
                            }}>
                                {priorityConfig.label}
                            </span>
                        </div>
                    )}

                    {/* Due Date */}
                    {dueInfo && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: dueInfo.isOverdue ? '#fef2f2' : dueInfo.isToday ? '#fef3c7' : 'transparent',
                            color: dueInfo.isOverdue ? '#dc2626' : dueInfo.isToday ? '#d97706' : '#6b7280'
                        }}>
                            <Calendar size={11} />
                            {dueInfo.text}
                        </div>
                    )}
                </div>

                {/* Assignee Avatar */}
                {task.assignee ? (
                    <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: getAssigneeColor(task.assignee),
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'uppercase',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        {typeof task.assignee === 'string' ? task.assignee.substring(0, 2) : 'U'}
                    </div>
                ) : (
                    <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: '2px dashed #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isHovered ? 0.8 : 0.4,
                        transition: 'opacity 0.15s'
                    }}>
                        <UserIcon size={12} color="#9ca3af" />
                    </div>
                )}
            </div>

            {/* Subtask Progress */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            flex: 1,
                            height: '4px',
                            background: '#e5e7eb',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(task.subtasks.filter(s => s.is_complete).length / task.subtasks.length) * 100}%`,
                                height: '100%',
                                background: '#10b981',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            {task.subtasks.filter(s => s.is_complete).length}/{task.subtasks.length}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});

const BoardColumn = memo(({ col, tasks, onDrop, onDragOver, onDragLeave, onOpenTask, onDragStart, onDragEnd, onAddTask, isDragOver }) => {
    const [showAddInput, setShowAddInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            await onAddTask({ title: newTaskTitle.trim(), status: col.id === 'DONE' ? 'done' : col.id });
            setNewTaskTitle('');
            setShowAddInput(false);
        }
    };

    return (
        <div
            onDrop={(e) => onDrop(e, col.id)}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
                minWidth: '320px',
                maxWidth: '320px',
                background: isDragOver ? '#f0edff' : '#f8fafc',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                border: isDragOver ? '2px dashed #7b68ee' : '2px solid transparent',
                transition: 'all 0.2s ease',
                boxShadow: isDragOver ? '0 0 0 4px rgba(123, 104, 238, 0.1)' : 'none'
            }}
        >
            {/* Column Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                padding: '0 4px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: col.color
                    }} />
                    <span style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                    }}>
                        {col.title}
                    </span>
                    <span style={{
                        background: '#e5e7eb',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '10px'
                    }}>
                        {tasks.length}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setShowAddInput(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#6b7280',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} />
                    </button>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#6b7280',
                        cursor: 'pointer'
                    }}>
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Cards Container */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '4px'
            }}>
                {tasks.map(task => (
                    <BoardCard
                        key={task.id}
                        task={task}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onOpenTask={onOpenTask}
                    />
                ))}

                {/* Drop zone indicator when empty */}
                {tasks.length === 0 && !showAddInput && (
                    <div style={{
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                        border: isDragOver ? 'none' : '2px dashed #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                    }}>
                        {isDragOver ? 'Drop here' : 'No tasks'}
                    </div>
                )}
            </div>

            {/* Add Task Input */}
            {showAddInput ? (
                <form onSubmit={handleAddTask} style={{ marginTop: '12px' }}>
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title..."
                        autoFocus
                        onBlur={() => {
                            if (!newTaskTitle.trim()) setShowAddInput(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setShowAddInput(false);
                                setNewTaskTitle('');
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #7b68ee',
                            outline: 'none',
                            fontSize: '0.85rem',
                            boxShadow: '0 0 0 3px rgba(123, 104, 238, 0.15)'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                            type="submit"
                            disabled={!newTaskTitle.trim()}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: newTaskTitle.trim() ? '#7b68ee' : '#e5e7eb',
                                color: newTaskTitle.trim() ? 'white' : '#9ca3af',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Add Task
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddInput(false);
                                setNewTaskTitle('');
                            }}
                            style={{
                                padding: '8px 12px',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setShowAddInput(true)}
                    style={{
                        marginTop: '12px',
                        padding: '10px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#6b7280',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0edff';
                        e.currentTarget.style.color = '#7b68ee';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                    }}
                >
                    <Plus size={16} /> Add Task
                </button>
            )}
        </div>
    );
});

const BoardView = memo(({ onOpenTask }) => {
    const { tasks, updateTask, addTask, activeProjectId } = useProject();
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [draggingTaskId, setDraggingTaskId] = useState(null);

    const projectTasks = tasks.filter(t => t.projectId === activeProjectId || t.projectId === parseInt(activeProjectId));

    const columns = [
        { id: 'TO DO', title: 'To Do', color: '#6b7280' },
        { id: 'IN PROGRESS', title: 'In Progress', color: '#7b68ee' },
        { id: 'DONE', title: 'Done', color: '#10b981' }
    ];

    const getTasksByStatus = useCallback((status) => {
        return projectTasks.filter(t => {
            if (status === 'TO DO') return t.status === 'TO DO' || t.status === 'todo';
            if (status === 'DONE') return t.status === 'DONE' || t.status === 'done';
            return t.status === status;
        });
    }, [projectTasks]);

    const handleDragStart = useCallback((e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingTaskId(taskId);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingTaskId(null);
        setDragOverColumn(null);
    }, []);

    const handleDrop = useCallback((e, status) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('taskId'));
        if (taskId) {
            const newStatus = status === 'DONE' ? 'done' : status === 'TO DO' ? 'todo' : status;
            updateTask(taskId, { status: newStatus });
        }
        setDragOverColumn(null);
        setDraggingTaskId(null);
    }, [updateTask]);

    const handleDragOver = useCallback((e, colId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(colId);
    }, []);

    const handleDragLeave = useCallback((e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverColumn(null);
        }
    }, []);

    const handleAddTask = useCallback(async (taskData) => {
        return await addTask(taskData);
    }, [addTask]);

    return (
        <div style={{
            display: 'flex',
            gap: '20px',
            height: '100%',
            overflowX: 'auto',
            padding: '20px',
            alignItems: 'flex-start',
            background: '#f9fafb'
        }}>
            {columns.map(col => (
                <BoardColumn
                    key={col.id}
                    col={col}
                    tasks={getTasksByStatus(col.id)}
                    onDrop={handleDrop}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onOpenTask={onOpenTask}
                    onAddTask={handleAddTask}
                    isDragOver={dragOverColumn === col.id}
                />
            ))}
        </div>
    );
});

BoardCard.displayName = 'BoardCard';
BoardColumn.displayName = 'BoardColumn';
BoardView.displayName = 'BoardView';

export default BoardView;
