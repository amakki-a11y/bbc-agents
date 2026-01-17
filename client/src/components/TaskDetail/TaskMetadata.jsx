import React from 'react';
import { Calendar, Flag, Tag } from 'lucide-react';

const TaskMetadata = ({ task, onUpdate }) => {
    return (
        <div style={{ padding: '2rem', background: '#f9fafb', height: '100%' }}>
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Properties</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.9rem' }}><Calendar size={16} /> Due Date</div>
                    <input
                        type="date"
                        value={task.due_date ? task.due_date.split('T')[0] : ''}
                        onChange={(e) => onUpdate('due_date', e.target.value)}
                        style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '0.2rem', fontSize: '0.85rem' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.9rem' }}><Flag size={16} /> Priority</div>
                    <select
                        value={task.priority || ''}
                        onChange={(e) => onUpdate('priority', e.target.value)}
                        style={{ border: 'none', background: 'transparent', textAlign: 'right', fontWeight: 500, cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟡 High</option>
                        <option value="normal">🔵 Normal</option>
                        <option value="low">⚪ Low</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.9rem' }}><Tag size={16} /> Tags</div>
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af', cursor: 'pointer' }}>+ Add</span>
                </div>
            </div>
        </div>
    );
};

export default TaskMetadata;
