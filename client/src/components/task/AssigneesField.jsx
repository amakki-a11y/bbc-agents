import { UserPlus } from 'lucide-react';

const AssigneesField = ({ assignee, onUpdate }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px' }}>Assignees</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {assignee ? (
                    <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: '#8b5cf6',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer'
                    }}>
                        {assignee}
                    </div>
                ) : (
                    <div style={{
                        width: 24, height: 24, borderRadius: '50%', border: '1px dashed #ccc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ccc'
                    }}>
                        <UserPlus size={14} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssigneesField;
