import { Sparkles } from 'lucide-react';

const AiHelperBar = () => {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f4f5f7', padding: '0.6rem 1rem', borderRadius: '8px',
            marginBottom: '1.5rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem'
        }}>
            <Sparkles size={16} color="#7b68ee" />
            <span>Ask Brain to write a description, create a summary or find similar tasks</span>
        </div>
    );
};

export default AiHelperBar;
