import { AlignLeft, Sparkles } from 'lucide-react';

const DescriptionActions = () => {
    return (
        <div style={{ display: 'flex', gap: '1rem', margin: '2rem 0', padding: '0 0.5rem' }}>
            <button style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'white', border: '1px solid #ddd', borderRadius: '6px',
                padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#555', cursor: 'pointer'
            }}>
                <AlignLeft size={16} />
                Add description
            </button>

            <button style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'white', border: '1px solid #ddd', borderRadius: '6px',
                padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#555', cursor: 'pointer'
            }}>
                <Sparkles size={16} color="#7b68ee" />
                Write with AI
            </button>
        </div>
    );
};

export default DescriptionActions;
