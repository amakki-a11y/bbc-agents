import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

const TAG_COLORS = [
    { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
    { bg: '#dbeafe', color: '#2563eb', border: '#93c5fd' },
    { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
    { bg: '#fce7f3', color: '#db2777', border: '#f9a8d4' },
    { bg: '#e0e7ff', color: '#4f46e5', border: '#a5b4fc' },
    { bg: '#fed7d7', color: '#dc2626', border: '#fca5a5' }
];

const getTagColor = (tag) => {
    if (!tag) return TAG_COLORS[0];
    const index = tag.charCodeAt(0) % TAG_COLORS.length;
    return TAG_COLORS[index];
};

const TagsField = ({ tags = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    const tagList = Array.isArray(tags) ? tags : [];

    const handleAddTag = () => {
        if (newTag.trim()) {
            const updatedTags = [...tagList, newTag.trim()];
            onUpdate(updatedTags);
            setNewTag('');
            setIsAdding(false);
        }
    };

    const handleRemoveTag = (indexToRemove) => {
        const updatedTags = tagList.filter((_, index) => index !== indexToRemove);
        onUpdate(updatedTags);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddTag();
        }
        if (e.key === 'Escape') {
            setNewTag('');
            setIsAdding(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#6b7280',
                minWidth: '90px',
                paddingTop: '6px'
            }}>
                Tags
            </div>

            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    maxWidth: '250px'
                }}
            >
                {tagList.map((tag, idx) => {
                    const colorConfig = getTagColor(tag);
                    return (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: colorConfig.bg,
                                color: colorConfig.color,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                border: `1px solid ${colorConfig.border}`
                            }}
                        >
                            <Tag size={10} />
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(idx)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '1px',
                                    borderRadius: '50%',
                                    color: colorConfig.color,
                                    cursor: 'pointer',
                                    opacity: 0.7
                                }}
                            >
                                <X size={10} />
                            </button>
                        </div>
                    );
                })}

                {isAdding ? (
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onBlur={() => {
                            if (newTag.trim()) {
                                handleAddTag();
                            } else {
                                setIsAdding(false);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Tag name"
                        autoFocus
                        style={{
                            width: '80px',
                            padding: '4px 8px',
                            border: '1px solid #6366f1',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            outline: 'none'
                        }}
                    />
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f9fafb',
                            border: '1px dashed #d1d5db',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#9ca3af';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.color = '#9ca3af';
                        }}
                    >
                        <Plus size={12} />
                        Add
                    </button>
                )}
            </div>
        </div>
    );
};

export default TagsField;
