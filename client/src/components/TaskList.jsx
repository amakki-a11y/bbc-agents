import React, { memo } from 'react';
import { CheckCircle2, Circle, Calendar, Flag, MoreHorizontal, User as UserIcon, CheckSquare, Square } from 'lucide-react';

const TaskRow = memo(({ task, onToggleStatus, onOpenTask, isSelected, onToggleSelect }) => {
    return (
        <div
            className={`task-row ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}
            onClick={() => onOpenTask(task)}
            style={{
                display: 'grid', gridTemplateColumns: '40px minmax(300px, 1fr) 100px 120px 100px 50px',
                padding: '0.6rem 1rem', alignItems: 'center',
                fontSize: '0.85rem', color: '#333', cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                background: isSelected ? '#f0f4ff' : 'white',
                transition: 'background-color 0.2s'
            }}
        >
            {/* Selection Checkbox */}
            <div onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}>
                {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-gray-300 hover:text-gray-500" />}
            </div>

            {/* Title & Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, task.status); }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: task.status === 'done' ? '#10b981' : '#ccc', display: 'flex'
                    }}
                >
                    {task.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <span style={{
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? '#aaa' : '#333',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {task.title}
                </span>
            </div>

            {/* Assignee */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {task.assignee ? (
                    <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', background: '#ff9a9e',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 'bold'
                    }}>
                        {task.assignee}
                    </div>
                ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon size={12} color="#ccc" />
                    </div>
                )}
            </div>

            {/* Due Date */}
            <div style={{ color: task.due_date ? '#555' : '#ccc', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                {task.due_date && <Calendar size={12} />}
                {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
            </div>

            {/* Priority */}
            <div>
                <Flag
                    size={14}
                    fill={task.priority === 'urgent' ? '#ff4d4d' : (task.priority === 'high' ? '#ffcc00' : (task.priority === 'normal' ? '#60a5fa' : '#ccc'))}
                    color={task.priority === 'urgent' ? '#ff4d4d' : (task.priority === 'high' ? '#ffcc00' : (task.priority === 'normal' ? '#60a5fa' : '#ccc'))}
                    style={{ opacity: task.priority ? 1 : 0.3 }}
                />
            </div>

            {/* Menu */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#ccc' }}>
                <MoreHorizontal size={16} />
            </div>
        </div>
    );
});

const TaskList = memo(({ tasks, onToggleStatus, onOpenTask, selectedIds = [], onToggleSelect }) => {
    if (!tasks || !tasks.length) return <div style={{ padding: '1rem', color: '#999', fontStyle: 'italic' }}>No tasks in this group.</div>;

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
