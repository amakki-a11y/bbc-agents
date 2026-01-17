import { useState } from 'react';
import { Bold, Italic, Paperclip, Smile } from 'lucide-react';

const CommentComposer = ({ onPost }) => {
    const [text, setText] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim()) {
                onPost(text);
                setText('');
            }
        }
    };

    return (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment..."
                style={{
                    width: '100%', minHeight: '80px', padding: '0.8rem',
                    border: 'none', resize: 'vertical', outline: 'none',
                    fontSize: '0.9rem', fontFamily: 'inherit'
                }}
            />
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem', background: '#f9fafb', borderTop: '1px solid #e0e0e0'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', color: '#9ca3af' }}>
                    <Bold size={16} cursor="pointer" />
                    <Italic size={16} cursor="pointer" />
                    <div style={{ width: '1px', height: '16px', background: '#ddd' }} />
                    <Paperclip size={16} cursor="pointer" />
                    <Smile size={16} cursor="pointer" />
                </div>
                <button
                    onClick={() => { if (text.trim()) { onPost(text); setText(''); } }}
                    style={{
                        background: text.trim() ? '#7b68ee' : '#e5e7eb',
                        color: text.trim() ? 'white' : '#9ca3af',
                        border: 'none', borderRadius: '4px',
                        padding: '0.3rem 0.8rem', fontSize: '0.8rem', fontWeight: 600,
                        cursor: text.trim() ? 'pointer' : 'default'
                    }}
                >
                    Comment
                </button>
            </div>
        </div>
    );
};

export default CommentComposer;
