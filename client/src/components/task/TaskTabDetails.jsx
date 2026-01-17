import { Plus } from 'lucide-react';

const TaskTabDetails = () => {
    return (
        <div style={{ padding: '0 0.5rem' }}>
            {/* Custom Fields Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#999', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    Custom Fields
                </div>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'none', border: '1px dashed #ccc', borderRadius: '6px',
                    padding: '0.5rem 1rem', width: '100%', justifyContent: 'center',
                    color: '#777', fontSize: '0.9rem', cursor: 'pointer'
                }}>
                    <Plus size={16} /> Create a field in this List
                </button>
            </div>

            {/* Attachments Section */}
            <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#999', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    Attachments
                </div>
                <div style={{
                    background: '#f9fafb', border: '1px dashed #ddd', borderRadius: '8px',
                    padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem',
                    cursor: 'pointer'
                }}>
                    Drop your files here to upload
                </div>
            </div>
        </div>
    );
};

export default TaskTabDetails;
