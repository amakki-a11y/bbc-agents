import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Dashboard from './Dashboard';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Tag,
    Paperclip,
    MessageSquare,
    CheckSquare,
    MoreHorizontal,
    Send,
    X,
    Edit2,
    Trash2,
    Plus
} from 'lucide-react';

const WorkspaceTaskPage = () => {
    const { workspaceId, listId, taskId } = useParams();
    const navigate = useNavigate();
    const {
        currentTask,
        fetchTask,
        updateTask,
        deleteTask,
        addComment,
        updateComment,
        deleteComment,
        addAssignee,
        removeAssignee,
        loading
    } = useWorkspace();

    const [newComment, setNewComment] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (taskId) {
            fetchTask(parseInt(taskId));
        }
    }, [taskId, fetchTask]);

    useEffect(() => {
        if (currentTask) {
            setTitle(currentTask.title);
            setDescription(currentTask.description || '');
        }
    }, [currentTask]);

    const handleBack = () => {
        navigate(`/w/${workspaceId}/list/${listId}`);
    };

    const handleSaveTitle = async () => {
        if (title.trim() && title !== currentTask.title) {
            await updateTask(parseInt(taskId), { title: title.trim() });
        }
        setEditingTitle(false);
    };

    const handleSaveDescription = async () => {
        if (description !== currentTask.description) {
            await updateTask(parseInt(taskId), { description });
        }
        setEditingDescription(false);
    };

    const handleStatusChange = async (statusId) => {
        await updateTask(parseInt(taskId), { statusId: parseInt(statusId) });
    };

    const handlePriorityChange = async (priority) => {
        await updateTask(parseInt(taskId), { priority });
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        await addComment(parseInt(taskId), newComment.trim());
        setNewComment('');
    };

    const handleDeleteTask = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            await deleteTask(parseInt(taskId));
            handleBack();
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (loading && !currentTask) {
        return (
            <Dashboard>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading task...</p>
                </div>
            </Dashboard>
        );
    }

    if (!currentTask) {
        return (
            <Dashboard>
                <div className="not-found-container">
                    <h2>Task not found</h2>
                    <p>The task you are looking for does not exist or you do not have access to it.</p>
                    <button onClick={handleBack}>Go back</button>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="task-detail-page">
                {/* Header */}
                <div className="task-header">
                    <button className="btn-back" onClick={handleBack}>
                        <ArrowLeft size={18} />
                        <span>Back to List</span>
                    </button>
                    <div className="header-actions">
                        <button className="btn-icon" onClick={() => {}} title="More options">
                            <MoreHorizontal size={18} />
                        </button>
                        <button className="btn-icon danger" onClick={handleDeleteTask} title="Delete task">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="task-content">
                    {/* Main Content */}
                    <div className="task-main">
                        {/* Title */}
                        <div className="task-title-section">
                            {editingTitle ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') {
                                            setTitle(currentTask.title);
                                            setEditingTitle(false);
                                        }
                                    }}
                                    className="title-input"
                                    autoFocus
                                />
                            ) : (
                                <h1 onClick={() => setEditingTitle(true)}>
                                    {currentTask.title}
                                    <Edit2 size={14} className="edit-icon" />
                                </h1>
                            )}
                        </div>

                        {/* Description */}
                        <div className="task-description-section">
                            <h3>Description</h3>
                            {editingDescription ? (
                                <div className="description-editor">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a description..."
                                        rows={5}
                                        autoFocus
                                    />
                                    <div className="editor-actions">
                                        <button className="btn-save" onClick={handleSaveDescription}>
                                            Save
                                        </button>
                                        <button
                                            className="btn-cancel"
                                            onClick={() => {
                                                setDescription(currentTask.description || '');
                                                setEditingDescription(false);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="description-content"
                                    onClick={() => setEditingDescription(true)}
                                >
                                    {currentTask.description || (
                                        <span className="placeholder">Add a description...</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Subtasks */}
                        {currentTask.subtasks?.length > 0 && (
                            <div className="subtasks-section">
                                <h3>
                                    <CheckSquare size={16} />
                                    Subtasks ({currentTask.subtasks.filter(s => s.status?.isClosed).length}/{currentTask.subtasks.length})
                                </h3>
                                <div className="subtasks-list">
                                    {currentTask.subtasks.map(subtask => (
                                        <div key={subtask.id} className="subtask-item">
                                            <input
                                                type="checkbox"
                                                checked={subtask.status?.isClosed || false}
                                                onChange={() => {}}
                                            />
                                            <span className={subtask.status?.isClosed ? 'completed' : ''}>
                                                {subtask.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="comments-section">
                            <h3>
                                <MessageSquare size={16} />
                                Comments ({currentTask.comments?.length || 0})
                            </h3>

                            <div className="comment-input">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={3}
                                />
                                <button
                                    className="btn-send"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    <Send size={16} />
                                </button>
                            </div>

                            <div className="comments-list">
                                {currentTask.comments?.map(comment => (
                                    <div key={comment.id} className="comment-item">
                                        <div className="comment-avatar">
                                            {comment.author?.photo ? (
                                                <img src={comment.author.photo} alt="" />
                                            ) : (
                                                comment.author?.name?.charAt(0)
                                            )}
                                        </div>
                                        <div className="comment-content">
                                            <div className="comment-header">
                                                <span className="author-name">{comment.author?.name}</span>
                                                <span className="comment-time">
                                                    {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                                                </span>
                                                {comment.isEdited && <span className="edited">(edited)</span>}
                                            </div>
                                            <p>{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity */}
                        {currentTask.activities?.length > 0 && (
                            <div className="activity-section">
                                <h3>Activity</h3>
                                <div className="activity-list">
                                    {currentTask.activities.slice(0, 10).map(activity => (
                                        <div key={activity.id} className="activity-item">
                                            <div className="activity-avatar">
                                                {activity.user?.photo ? (
                                                    <img src={activity.user.photo} alt="" />
                                                ) : (
                                                    activity.user?.name?.charAt(0)
                                                )}
                                            </div>
                                            <div className="activity-content">
                                                <span className="user-name">{activity.user?.name}</span>
                                                <span className="action">{activity.action}</span>
                                                {activity.field && (
                                                    <span className="field">{activity.field}</span>
                                                )}
                                                <span className="time">{formatDate(activity.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="task-sidebar">
                        {/* Status */}
                        <div className="sidebar-section">
                            <label>Status</label>
                            <select
                                value={currentTask.statusId || ''}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{
                                    backgroundColor: currentTask.status?.color + '20',
                                    borderColor: currentTask.status?.color
                                }}
                            >
                                {currentTask.list?.statuses?.map(status => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="sidebar-section">
                            <label>Priority</label>
                            <select
                                value={currentTask.priority || 'NONE'}
                                onChange={(e) => handlePriorityChange(e.target.value)}
                                className={`priority-select priority-${currentTask.priority?.toLowerCase()}`}
                            >
                                <option value="NONE">None</option>
                                <option value="LOW">Low</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="sidebar-section">
                            <label>
                                <Calendar size={14} />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={currentTask.dueDate?.split('T')[0] || ''}
                                onChange={(e) => updateTask(parseInt(taskId), {
                                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null
                                })}
                            />
                        </div>

                        {/* Start Date */}
                        <div className="sidebar-section">
                            <label>
                                <Calendar size={14} />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={currentTask.startDate?.split('T')[0] || ''}
                                onChange={(e) => updateTask(parseInt(taskId), {
                                    startDate: e.target.value ? new Date(e.target.value).toISOString() : null
                                })}
                            />
                        </div>

                        {/* Time Estimate */}
                        <div className="sidebar-section">
                            <label>
                                <Clock size={14} />
                                Time Estimate
                            </label>
                            <input
                                type="number"
                                placeholder="Minutes"
                                value={currentTask.timeEstimate || ''}
                                onChange={(e) => updateTask(parseInt(taskId), {
                                    timeEstimate: e.target.value ? parseInt(e.target.value) : null
                                })}
                            />
                        </div>

                        {/* Assignees */}
                        <div className="sidebar-section">
                            <label>
                                <User size={14} />
                                Assignees
                            </label>
                            <div className="assignees-list">
                                {currentTask.assignees?.map(assignee => (
                                    <div key={assignee.id} className="assignee-item">
                                        <div className="assignee-avatar">
                                            {assignee.employee?.photo ? (
                                                <img src={assignee.employee.photo} alt="" />
                                            ) : (
                                                assignee.employee?.name?.charAt(0)
                                            )}
                                        </div>
                                        <span>{assignee.employee?.name}</span>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeAssignee(parseInt(taskId), assignee.id)}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button className="add-assignee-btn">
                                    <Plus size={14} />
                                    Add assignee
                                </button>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="sidebar-section">
                            <label>
                                <Tag size={14} />
                                Tags
                            </label>
                            <div className="tags-list">
                                {currentTask.tags?.map(({ tag }) => (
                                    <span
                                        key={tag.id}
                                        className="tag-badge"
                                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                                <button className="add-tag-btn">
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Created Info */}
                        <div className="sidebar-section meta">
                            <p>Created by {currentTask.createdBy?.name}</p>
                            <p>{formatDate(currentTask.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .task-detail-page {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary, #0f0f1a);
                }

                .loading-container,
                .not-found-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-secondary, #a0a0b2);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color, #2d2d44);
                    border-top-color: var(--primary, #6366f1);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .task-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .btn-back {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: var(--text-secondary, #a0a0b2);
                    cursor: pointer;
                    font-size: 14px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .btn-back:hover {
                    color: var(--text-primary, #fff);
                    background: var(--bg-secondary, #1a1a2e);
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-icon {
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    color: var(--text-primary, #fff);
                }

                .btn-icon.danger:hover {
                    color: #ef4444;
                    border-color: #ef4444;
                }

                .task-content {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                .task-main {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }

                .task-title-section h1 {
                    font-size: 24px;
                    color: var(--text-primary, #fff);
                    margin: 0 0 24px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .task-title-section h1 .edit-icon {
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .task-title-section h1:hover .edit-icon {
                    opacity: 0.5;
                }

                .title-input {
                    width: 100%;
                    font-size: 24px;
                    font-weight: 600;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--primary, #6366f1);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    margin-bottom: 24px;
                }

                .task-description-section,
                .subtasks-section,
                .comments-section,
                .activity-section {
                    margin-bottom: 32px;
                }

                .task-main h3 {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary, #a0a0b2);
                    margin: 0 0 12px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .description-content {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    padding: 16px;
                    min-height: 100px;
                    cursor: pointer;
                    font-size: 14px;
                    color: var(--text-primary, #fff);
                    line-height: 1.6;
                    white-space: pre-wrap;
                }

                .description-content:hover {
                    background: var(--bg-hover, #2d2d44);
                }

                .description-content .placeholder {
                    color: var(--text-tertiary, #6b6b80);
                }

                .description-editor textarea {
                    width: 100%;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--primary, #6366f1);
                    border-radius: 8px;
                    padding: 16px;
                    color: var(--text-primary, #fff);
                    font-size: 14px;
                    resize: vertical;
                    min-height: 100px;
                }

                .editor-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }

                .btn-save {
                    background: var(--primary, #6366f1);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                }

                .btn-cancel {
                    background: none;
                    border: 1px solid var(--border-color, #2d2d44);
                    color: var(--text-secondary, #a0a0b2);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                }

                .subtasks-list {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .subtask-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                    font-size: 14px;
                    color: var(--text-primary, #fff);
                }

                .subtask-item:last-child {
                    border-bottom: none;
                }

                .subtask-item.completed span {
                    text-decoration: line-through;
                    color: var(--text-tertiary, #6b6b80);
                }

                .comment-input {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .comment-input textarea {
                    flex: 1;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 8px;
                    padding: 12px;
                    color: var(--text-primary, #fff);
                    font-size: 14px;
                    resize: none;
                }

                .comment-input textarea:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
                }

                .btn-send {
                    background: var(--primary, #6366f1);
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-send:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .comments-list,
                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .comment-item,
                .activity-item {
                    display: flex;
                    gap: 12px;
                }

                .comment-avatar,
                .activity-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--primary, #6366f1);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 500;
                    flex-shrink: 0;
                }

                .comment-avatar img,
                .activity-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .comment-content {
                    flex: 1;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    padding: 12px;
                }

                .comment-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .author-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }

                .comment-time {
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                }

                .edited {
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                    font-style: italic;
                }

                .comment-content p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--text-primary, #fff);
                    line-height: 1.5;
                }

                .activity-content {
                    font-size: 13px;
                    color: var(--text-secondary, #a0a0b2);
                    line-height: 36px;
                }

                .activity-content .user-name {
                    color: var(--text-primary, #fff);
                    font-weight: 500;
                }

                .activity-content .time {
                    margin-left: 8px;
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                }

                .task-sidebar {
                    width: 320px;
                    border-left: 1px solid var(--border-color, #2d2d44);
                    padding: 24px;
                    overflow-y: auto;
                    background: var(--bg-secondary, #1a1a2e);
                }

                .sidebar-section {
                    margin-bottom: 20px;
                }

                .sidebar-section label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--text-tertiary, #6b6b80);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }

                .sidebar-section select,
                .sidebar-section input[type="date"],
                .sidebar-section input[type="number"] {
                    width: 100%;
                    background: var(--bg-tertiary, #252538);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 10px 12px;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                }

                .priority-select.priority-urgent { border-color: #ef4444; }
                .priority-select.priority-high { border-color: #f59e0b; }
                .priority-select.priority-normal { border-color: #6b7280; }
                .priority-select.priority-low { border-color: #3b82f6; }

                .assignees-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .assignee-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 10px;
                    background: var(--bg-tertiary, #252538);
                    border-radius: 6px;
                }

                .assignee-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--primary, #6366f1);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 500;
                }

                .assignee-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .assignee-item span {
                    flex: 1;
                    font-size: 13px;
                    color: var(--text-primary, #fff);
                }

                .remove-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    color: var(--text-tertiary, #6b6b80);
                    border-radius: 4px;
                }

                .remove-btn:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }

                .add-assignee-btn,
                .add-tag-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: none;
                    border: 1px dashed var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-secondary, #a0a0b2);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                }

                .add-assignee-btn:hover,
                .add-tag-btn:hover {
                    border-color: var(--primary, #6366f1);
                    color: var(--primary, #6366f1);
                }

                .tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .tag-badge {
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .add-tag-btn {
                    width: auto;
                    padding: 4px 8px;
                }

                .sidebar-section.meta {
                    margin-top: 32px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color, #2d2d44);
                }

                .sidebar-section.meta p {
                    margin: 0 0 4px 0;
                    font-size: 12px;
                    color: var(--text-tertiary, #6b6b80);
                }
            `}</style>
        </Dashboard>
    );
};

export default WorkspaceTaskPage;
