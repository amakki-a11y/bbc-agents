import { Tag, Plus } from 'lucide-react';

const TagsField = ({ task, onUpdate }) => {
    const tags = task?.tags || [];
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Tags</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {tags.map((tag, idx) => (
                    <div key={idx} style={{
                        background: '#e5e7eb', color: '#374151', padding: '2px 8px',
                        borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500
                    }}>
                        {tag}
                    </div>
                ))}
                <div style={{
                    border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px',
                    fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    <Plus size={12} /> Add
                </div>
            </div>
        </div>
    );
};

export default TagsField;
