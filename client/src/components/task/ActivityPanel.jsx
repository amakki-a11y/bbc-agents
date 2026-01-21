import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Bell, Filter, Search, MessageCircle, GitBranch, UserCheck, Clock, Send,
    Smile, Paperclip, AtSign, Pencil, Trash2, Flag, Calendar, FileText,
    CheckSquare, Tag, Link2, FolderInput, Plus, RefreshCw, Upload, Timer, Loader2,
    ChevronDown, ChevronUp, AlignLeft
} from 'lucide-react';

// Using centralized API_URL from http.js

const getAvatarColor = (name) => {
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getActivityIcon = (type) => {
    switch (type) {
        case 'comment':
            return { icon: MessageCircle, color: '#3b82f6', bg: '#eff6ff' };
        case 'status_change':
            return { icon: RefreshCw, color: '#8b5cf6', bg: '#f5f3ff' };
        case 'priority_change':
            return { icon: Flag, color: '#f59e0b', bg: '#fffbeb' };
        case 'date_change':
            return { icon: Calendar, color: '#10b981', bg: '#ecfdf5' };
        case 'assignment':
        case 'assignee_change':
            return { icon: UserCheck, color: '#06b6d4', bg: '#ecfeff' };
        case 'tag_change':
            return { icon: Tag, color: '#ec4899', bg: '#fdf2f8' };
        case 'subtask_add':
        case 'subtask_update':
        case 'subtask_delete':
            return { icon: CheckSquare, color: '#6366f1', bg: '#eef2ff' };
        case 'action_item_create':
        case 'action_item_update':
        case 'action_item_delete':
            return { icon: CheckSquare, color: '#6366f1', bg: '#eef2ff' };
        case 'dependency_add':
        case 'dependency_remove':
            return { icon: Link2, color: '#f97316', bg: '#fff7ed' };
        case 'upload':
        case 'attachment_upload':
            return { icon: Upload, color: '#3b82f6', bg: '#eff6ff' };
        case 'delete':
        case 'attachment_delete':
            return { icon: Trash2, color: '#ef4444', bg: '#fef2f2' };
        case 'time_tracking':
            return { icon: Timer, color: '#10b981', bg: '#ecfdf5' };
        case 'move':
            return { icon: FolderInput, color: '#8b5cf6', bg: '#f5f3ff' };
        case 'field_update':
            return { icon: FileText, color: '#6b7280', bg: '#f3f4f6' };
        case 'description_change':
            return { icon: AlignLeft, color: '#8b5cf6', bg: '#f5f3ff' };
        case 'created':
            return { icon: Plus, color: '#10b981', bg: '#ecfdf5' };
        default:
            return { icon: Clock, color: '#6b7280', bg: '#f3f4f6' };
    }
};

const ActivityItem = ({ activity, onEdit, onDelete, isCurrentUser }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const { icon: Icon, color, bg } = getActivityIcon(activity.type);
    const userName = activity.user?.email || activity.user || 'Unknown';
    const initials = userName.substring(0, 2).toUpperCase();

    // Parse metadata if it's a string
    const metadata = useMemo(() => {
        if (!activity.metadata) return null;
        if (typeof activity.metadata === 'string') {
            try {
                return JSON.parse(activity.metadata);
            } catch {
                return null;
            }
        }
        return activity.metadata;
    }, [activity.metadata]);

    // Check if this is a description change with diff data
    const hasDiff = activity.type === 'description_change' && metadata?.old_value !== undefined && metadata?.new_value !== undefined;

    return (
        <div
            style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid #f3f4f6'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Avatar */}
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: getAvatarColor(userName),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                flexShrink: 0
            }}>
                {initials}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#1f2937'
                        }}>
                            {userName}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af'
                        }}>
                            {formatTimeAgo(activity.timestamp || activity.created_at)}
                        </span>
                    </div>

                    {/* Edit/Delete buttons for comments - only show for current user's comments */}
                    {activity.type === 'comment' && isHovered && isCurrentUser && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => onEdit && onEdit(activity)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#9ca3af',
                                    cursor: 'pointer'
                                }}
                            >
                                <Pencil size={12} />
                            </button>
                            <button
                                onClick={() => onDelete && onDelete(activity)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#9ca3af',
                                    cursor: 'pointer'
                                }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {activity.type === 'comment' ? (
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#374151',
                        lineHeight: 1.5,
                        background: '#f9fafb',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        borderTopLeftRadius: '2px'
                    }}>
                        {activity.content}
                    </div>
                ) : (
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            color: '#6b7280'
                        }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                background: bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Icon size={12} style={{ color }} />
                            </div>
                            <span>{activity.content}</span>

                            {/* Show changes button for description changes */}
                            {hasDiff && (
                                <button
                                    onClick={() => setShowDiff(!showDiff)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        padding: '2px 6px',
                                        fontSize: '0.7rem',
                                        color: '#8b5cf6',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    {showDiff ? 'Hide' : 'Show'} changes
                                    {showDiff ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                            )}
                        </div>

                        {/* Expandable diff view for description changes */}
                        {hasDiff && showDiff && (
                            <div style={{
                                marginTop: '8px',
                                padding: '10px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace'
                            }}>
                                {metadata.old_value && (
                                    <div style={{
                                        color: '#dc2626',
                                        padding: '4px 8px',
                                        background: '#fef2f2',
                                        borderRadius: '4px',
                                        marginBottom: '6px',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        <span style={{ fontWeight: 600, marginRight: '4px' }}>−</span>
                                        {metadata.old_value}{metadata.old_value.length >= 500 ? '...' : ''}
                                    </div>
                                )}
                                {metadata.new_value && (
                                    <div style={{
                                        color: '#16a34a',
                                        padding: '4px 8px',
                                        background: '#ecfdf5',
                                        borderRadius: '4px',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        <span style={{ fontWeight: 600, marginRight: '4px' }}>+</span>
                                        {metadata.new_value}{metadata.new_value.length >= 500 ? '...' : ''}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show attachment file info */}
                        {(activity.type === 'attachment_upload' || activity.type === 'attachment_delete') && metadata?.filename && (
                            <div style={{
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                color: '#9ca3af'
                            }}>
                                <Paperclip size={10} />
                                {metadata.filename}
                                {metadata.filesize && ` (${(metadata.filesize / 1024).toFixed(1)} KB)`}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyActivity = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        textAlign: 'center'
    }}>
        <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
        }}>
            <MessageCircle size={24} style={{ color: '#d1d5db' }} />
        </div>
        <p style={{
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#6b7280',
            marginBottom: '4px'
        }}>
            No activity yet
        </p>
        <p style={{
            margin: 0,
            fontSize: '0.8rem',
            color: '#9ca3af'
        }}>
            Comments and updates will appear here
        </p>
    </div>
);

const CommentComposer = ({ onPost }) => {
    const [comment, setComment] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = () => {
        if (comment.trim()) {
            onPost(comment.trim());
            setComment('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
        }}>
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#6366f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                flexShrink: 0
            }}>
                ME
            </div>
            <div style={{
                flex: 1,
                background: isFocused ? 'white' : '#f9fafb',
                border: isFocused ? '1px solid #6366f1' : '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.15s'
            }}>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a comment..."
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontSize: '0.85rem',
                        fontFamily: 'inherit',
                        minHeight: '40px',
                        maxHeight: '120px',
                        background: 'transparent'
                    }}
                    rows={1}
                />
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderTop: '1px solid #f3f4f6'
                }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#9ca3af',
                            cursor: 'pointer'
                        }}>
                            <Smile size={16} />
                        </button>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#9ca3af',
                            cursor: 'pointer'
                        }}>
                            <Paperclip size={16} />
                        </button>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#9ca3af',
                            cursor: 'pointer'
                        }}>
                            <AtSign size={16} />
                        </button>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!comment.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            background: comment.trim() ? '#4f46e5' : '#e5e7eb',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: comment.trim() ? 'pointer' : 'not-allowed',
                            transition: 'background 0.15s'
                        }}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActivityPanel = ({ task, onUpdate, onTaskRefresh, refreshKey = 0 }) => {
    const [isPosting, setIsPosting] = useState(false);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const activityListRef = useRef(null);

    // Sort activities oldest-first (ascending) so newest appears at bottom like a chat
    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.created_at || 0);
            const dateB = new Date(b.timestamp || b.created_at || 0);
            return dateA - dateB; // Ascending: oldest first, newest last
        });
    }, [activities]);

    // Auto-scroll to bottom when activities change
    useEffect(() => {
        if (activityListRef.current && sortedActivities.length > 0) {
            // Small delay to ensure DOM has updated
            setTimeout(() => {
                if (activityListRef.current) {
                    activityListRef.current.scrollTop = activityListRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [sortedActivities]);

    // Initialize activities from task prop
    useEffect(() => {
        const initialActivities = task?.activities || task?.activity || [];
        setActivities(initialActivities);
    }, [task?.id]); // Only reset when task ID changes, not on every task prop change

    // Fetch activities function
    const fetchActivities = useCallback(async () => {
        if (!task?.id || Number(task.id) > 1000000000000) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/details/${task.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities || []);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsLoading(false);
        }
    }, [task?.id]);

    // Refresh activities when refreshKey changes
    useEffect(() => {
        if (refreshKey > 0 && task?.id) {
            fetchActivities();
        }
    }, [refreshKey, fetchActivities, task?.id]);

    const handlePostComment = async (content) => {
        if (!task?.id || !content.trim()) return;

        setIsPosting(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/details/${task.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: content.trim() })
            });

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            // Fetch fresh activities after posting
            await fetchActivities();

            // Also call parent refresh if available
            if (onTaskRefresh) {
                onTaskRefresh();
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeleteComment = async (activity) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/tasks/details/activities/${activity.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            // Update local state immediately (optimistic)
            setActivities(prev => prev.filter(a => a.id !== activity.id));

            // Also refresh from server to ensure sync
            if (onTaskRefresh) {
                onTaskRefresh();
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment.');
            // Refetch on error to restore state
            fetchActivities();
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#fafafa'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #e5e7eb',
                background: 'white'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#1f2937'
                }}>
                    Activity
                </h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#6b7280',
                        cursor: 'pointer'
                    }}>
                        <Search size={16} />
                    </button>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#6b7280',
                        cursor: 'pointer'
                    }}>
                        <Filter size={16} />
                    </button>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#6b7280',
                        cursor: 'pointer'
                    }}>
                        <Bell size={16} />
                    </button>
                </div>
            </div>

            {/* Activity Feed - Oldest first, newest at bottom (like chat) */}
            <div
                ref={activityListRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 1.25rem',
                    position: 'relative'
                }}
            >
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 5
                    }}>
                        <Loader2 size={16} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                    </div>
                )}
                {sortedActivities.length > 0 ? (
                    sortedActivities.map((activity, idx) => (
                        <ActivityItem
                            key={activity.id || idx}
                            activity={activity}
                            onDelete={handleDeleteComment}
                            isCurrentUser={true}
                        />
                    ))
                ) : (
                    <EmptyActivity />
                )}
            </div>

            {/* Comment Composer */}
            <div style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid #e5e7eb',
                background: 'white'
            }}>
                <CommentComposer onPost={handlePostComment} disabled={isPosting} />
            </div>
        </div>
    );
};

export default ActivityPanel;
