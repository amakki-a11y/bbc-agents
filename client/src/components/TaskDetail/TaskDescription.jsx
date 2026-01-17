import React from 'react';

const TaskDescription = ({ description, onUpdate }) => {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Description</label>
            <textarea
                value={description || ''}
                onChange={(e) => onUpdate('description', e.target.value)}
                placeholder="Add description..."
                style={{ width: '100%', minHeight: '200px', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', resize: 'vertical', outline: 'none', fontSize: '0.9rem', lineHeight: '1.6' }}
            />
        </div>
    );
};

export default TaskDescription;
