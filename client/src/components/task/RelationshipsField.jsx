import { Plus } from 'lucide-react';

const RelationshipsField = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Relationships</div>
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Plus size={14} /> Add
            </div>
        </div>
    );
};

export default RelationshipsField;
