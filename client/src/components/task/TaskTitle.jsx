import { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';

const TaskTitle = ({ title, onUpdate }) => {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { setLocalTitle(title); }, [title]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localTitle !== title && localTitle.trim()) {
            onUpdate(localTitle.trim());
        } else if (!localTitle.trim()) {
            setLocalTitle(title);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setLocalTitle(title);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                <input
                    ref={inputRef}
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%',
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        padding: '0.25rem 0',
                        borderBottom: '2px solid #6366f1',
                        caretColor: '#6366f1'
                    }}
                    placeholder="Task title"
                />
            </div>
        );
    }

    return (
        <div
            style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                onClick={() => setIsEditing(true)}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    cursor: 'text',
                    padding: '0.25rem 0',
                    borderRadius: '8px',
                    transition: 'background 0.15s'
                }}
            >
                <h1 style={{
                    margin: 0,
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    lineHeight: 1.3,
                    flex: 1
                }}>
                    {localTitle || 'Untitled Task'}
                </h1>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.15s, background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <Pencil size={16} />
                </button>
            </div>
        </div>
    );
};

export default TaskTitle;
