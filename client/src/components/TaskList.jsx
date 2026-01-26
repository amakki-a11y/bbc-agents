import { memo, useState } from 'react';
import { CheckCircle2, Circle, Calendar, Flag, MoreHorizontal, User as UserIcon, CheckSquare, Square, AlertCircle, ListTodo } from 'lucide-react';

const formatDueDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (date.getTime() === today.getTime()) {
        return { text: 'Today', isOverdue: false, isToday: true };
    } else if (date.getTime() === tomorrow.getTime()) {
        return { text: 'Tomorrow', isOverdue: false, isTomorrow: true };
    } else if (date.getTime() === yesterday.getTime()) {
        return { text: 'Yesterday', isOverdue: true };
    } else if (diffDays < 0) {
        return { text: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), isOverdue: true };
    } else if (diffDays <= 7) {
        return { text: date.toLocaleDateString(undefined, { weekday: 'short' }), isOverdue: false };
    } else {
        return { text: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), isOverdue: false };
    }
};

const getPriorityConfig = (priority) => {
    switch (priority) {
        case 'urgent':
            return { color: '#dc2626', bgColor: '#fef2f2', label: 'Urgent' };
        case 'high':
            return { color: '#ea580c', bgColor: '#fff7ed', label: 'High' };
        case 'normal':
            return { color: '#2563eb', bgColor: '#eff6ff', label: 'Normal' };
        case 'low':
            return { color: '#16a34a', bgColor: '#f0fdf4', label: 'Low' };
        default:
            return { color: '#9ca3af', bgColor: '#f9fafb', label: 'None' };
    }
};

const getAssigneeColor = (name) => {
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const TaskRow = memo(function TaskRow({ task, onToggleStatus, onOpenTask, isSelected, onToggleSelect }) {
    const [isHovered, setIsHovered] = useState(false);
    const dueInfo = formatDueDate(task.due_date);
    const priorityConfig = getPriorityConfig(task.priority);
    const isDone = task.status === 'done' || task.status === 'DONE';
    const isOverdue = dueInfo?.isOverdue && !isDone;

    return (
        <div
            className={`task-row ${isSelected ? 'selected' : ''}`}
            onClick={() => onOpenTask(task)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'grid',
                gridTemplateColumns: '40px minmax(300px, 1fr) 110px 130px 100px 50px',
                padding: '0.75rem 1rem',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: '#333',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                background: isSelected ? '#eef2ff' : isHovered ? '#f8fafc' : 'white',
                transition: 'all 0.15s ease',
                borderLeft: isOverdue ? '3px solid #ef4444' : '3px solid transparent'
            }}
        >
            {/* Selection Checkbox */}
            <div
                onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isHovered || isSelected ? 1 : 0.3,
                    transition: 'opacity 0.15s'
                }}
            >
                {isSelected ? (
                    <CheckSquare size={18} style={{ color: '#4f46e5' }} />
                ) : (
                    <Square size={18} style={{ color: '#9ca3af' }} />
                )}
            </div>

            {/* Title & Status Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, task.status); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        color: isDone ? '#10b981' : '#d1d5db'
                    }}
                    onMouseEnter={(e) => { if (!isDone) e.currentTarget.style.color = '#10b981'; }}
                    onMouseLeave={(e) => { if (!isDone) e.currentTarget.style.color = '#d1d5db'; }}
                >
                    {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <span style={{
                    textDecoration: isDone ? 'line-through' : 'none',
                    color: isDone ? '#9ca3af' : isOverdue ? '#dc2626' : '#1f2937',
                    fontWeight: isDone ? 400 : 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {task.title}
                </span>
                {/* Subtask Count Badge */}
                {task.subtasks && task.subtasks.length > 0 && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: '#f3f4f6',
                        color: '#6b7280',
                        flexShrink: 0
                    }}>
                        <ListTodo size={10} />
                        {task.subtasks.filter(s => s.is_complete).length}/{task.subtasks.length}
                    </span>
                )}
                {isOverdue && !isDone && (
                    <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                )}
            </div>

            {/* Assignee */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {task.assignee ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: getAssigneeColor(task.assignee),
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            {typeof task.assignee === 'string' ? task.assignee.substring(0, 2) : task.assignee}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '2px dashed #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isHovered ? 1 : 0.5,
                        transition: 'opacity 0.15s'
                    }}>
                        <UserIcon size={14} color="#9ca3af" />
                    </div>
                )}
            </div>

            {/* Due Date */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: dueInfo ? '4px 8px' : '4px',
                borderRadius: '4px',
                background: dueInfo?.isOverdue && !isDone ? '#fef2f2' :
                           dueInfo?.isToday ? '#fef3c7' :
                           dueInfo?.isTomorrow ? '#ecfdf5' : 'transparent',
                color: dueInfo?.isOverdue && !isDone ? '#dc2626' :
                       dueInfo?.isToday ? '#d97706' :
                       dueInfo?.isTomorrow ? '#059669' : '#6b7280',
                fontWeight: dueInfo?.isToday || dueInfo?.isOverdue ? 600 : 400
            }}>
                {dueInfo ? (
                    <>
                        <Calendar size={13} />
                        {dueInfo.text}
                    </>
                ) : (
                    <span style={{ color: '#d1d5db', opacity: isHovered ? 1 : 0.5 }}>
                        <Calendar size={13} />
                    </span>
                )}
            </div>

            {/* Priority Badge */}
            <div>
                {task.priority ? (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: priorityConfig.bgColor,
                        color: priorityConfig.color,
                        border: `1px solid ${priorityConfig.color}20`
                    }}>
                        <Flag size={10} fill={priorityConfig.color} />
                        {priorityConfig.label}
                    </span>
                ) : (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        opacity: isHovered ? 0.5 : 0.2,
                        transition: 'opacity 0.15s'
                    }}>
                        <Flag size={14} color="#9ca3af" />
                    </span>
                )}
            </div>

            {/* Menu */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.15s'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <MoreHorizontal size={18} />
                </button>
            </div>
        </div>
    );
});

const EmptyState = () => (
    <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#9ca3af'
    }}>
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#f3f4f6',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <CheckCircle2 size={24} color="#d1d5db" />
        </div>
        <p style={{ fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>No tasks yet</p>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Add a task to get started</p>
    </div>
);

const TaskList = memo(function TaskList({ tasks, onToggleStatus, onOpenTask, selectedIds = [], onToggleSelect }) {
    if (!tasks || !tasks.length) return <EmptyState />;

    return (
        <div>
            {tasks.map(task => (
                <TaskRow
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onOpenTask={onOpenTask}
                    isSelected={selectedIds.includes(task.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </div>
    );
});

export default TaskList;
