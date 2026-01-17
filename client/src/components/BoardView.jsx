import React, { useState, memo, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { Plus, MoreHorizontal, Calendar } from 'lucide-react';

const BoardCard = memo(({ task, onDragStart, onOpenTask }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onClick={() => onOpenTask(task)}
        style={{
            background: 'white', borderRadius: '6px', padding: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'grab',
            border: '1px solid transparent'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 500, lineHeight: '1.4' }}>{task.title}</div>
            <MoreHorizontal size={14} color="#ccc" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {task.priority && (
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: task.priority === 'urgent' ? '#ff4d4d' : (task.priority === 'high' ? '#ffcc00' : '#ccc')
                    }} />
                )}
                {task.due_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#888' }}>
                        <Calendar size={12} />
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>
            {task.assignee && (
                <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#ff9a9e',
                    color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>
                    {task.assignee}
                </div>
            )}
        </div>
    </div>
));

const BoardColumn = memo(({ col, tasks, onDrop, onDragOver, onOpenTask, onDragStart }) => (
    <div
        onDrop={(e) => onDrop(e, col.id)}
        onDragOver={onDragOver}
        style={{ minWidth: '300px', background: '#f4f5f7', borderRadius: '8px', padding: '0.8rem', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}
    >
        {/* Column Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>
                <span style={{ fontSize: '0.7rem', color: col.color }}>●</span>
                {col.title}
                <span style={{ color: '#999', fontWeight: 400 }}>{tasks.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', color: '#999' }}>
                <Plus size={16} cursor="pointer" />
                <MoreHorizontal size={16} cursor="pointer" />
            </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto' }}>
            {tasks.map(task => (
                <BoardCard
                    key={task.id}
                    task={task}
                    onDragStart={onDragStart}
                    onOpenTask={onOpenTask}
                />
            ))}
        </div>

        {/* + New Task Button */}
        <div style={{
            marginTop: '0.8rem', padding: '0.5rem', borderRadius: '4px',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: '#777', fontSize: '0.85rem', cursor: 'pointer',
            background: 'transparent'
        }}>
            <Plus size={16} /> New Task
        </div>
    </div>
));

const BoardView = memo(({ onOpenTask }) => {
    const { tasks, updateTask, activeProjectId } = useProject();

    // Filter tasks for current project
    const projectTasks = tasks.filter(t => t.projectId === activeProjectId || t.projectId === parseInt(activeProjectId));

    const columns = [
        { id: 'TO DO', title: 'TO DO', color: '#b0b0b0' },
        { id: 'IN PROGRESS', title: 'IN PROGRESS', color: '#7b68ee' },
        { id: 'DONE', title: 'DONE', color: '#10b981' }
    ];

    const getTasksByStatus = useCallback((status) => projectTasks.filter(t => t.status === status || (status === 'DONE' && t.status === 'done')), [projectTasks]);

    const handleDragStart = useCallback((e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    }, []);

    const handleDrop = useCallback((e, status) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('taskId'));
        if (taskId) {
            updateTask(taskId, { status: status === 'DONE' ? 'done' : status });
        }
    }, [updateTask]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    return (
        <div style={{ display: 'flex', gap: '1.5rem', height: '100%', overflowX: 'auto', padding: '1rem', alignItems: 'flex-start' }}>
            {columns.map(col => (
                <BoardColumn
                    key={col.id}
                    col={col}
                    tasks={getTasksByStatus(col.id)}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragStart={handleDragStart}
                    onOpenTask={onOpenTask}
                />
            ))}

            {/* Add Column Button */}
            <div style={{ minWidth: '300px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', color: '#999', cursor: 'pointer', border: '1px dashed #ddd', borderRadius: '8px' }}>
                <Plus size={16} /> Add Column
            </div>
        </div>
    );
});

BoardCard.displayName = 'BoardCard';
BoardColumn.displayName = 'BoardColumn';
BoardView.displayName = 'BoardView';

export default BoardView;
