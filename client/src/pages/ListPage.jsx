import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Dashboard from './Dashboard';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    List,
    LayoutGrid,
    Calendar,
    Clock,
    User,
    ChevronDown,
    GripVertical,
    CheckCircle2,
    Circle,
    AlertCircle
} from 'lucide-react';

const ListPage = () => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const {
        currentList,
        fetchList,
        createTask,
        updateTask,
        deleteTask,
        reorderTasks,
        loading
    } = useWorkspace();

    const [view, setView] = useState('list'); // list, board, calendar
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        if (listId) {
            fetchList(parseInt(listId));
        }
    }, [listId, fetchList]);

    // Filter and search tasks
    const filteredTasks = useMemo(() => {
        if (!currentList?.tasks) return [];

        return currentList.tasks.filter(task => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!task.title.toLowerCase().includes(query) &&
                    !task.description?.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Status filter
            if (filterStatus !== 'all' && task.statusId !== parseInt(filterStatus)) {
                return false;
            }

            // Priority filter
            if (filterPriority !== 'all' && task.priority !== filterPriority) {
                return false;
            }

            return true;
        });
    }, [currentList?.tasks, searchQuery, filterStatus, filterPriority]);

    // Group tasks by status for board view
    const tasksByStatus = useMemo(() => {
        if (!currentList?.statuses) return {};

        const grouped = {};
        currentList.statuses.forEach(status => {
            grouped[status.id] = filteredTasks.filter(t => t.statusId === status.id);
        });
        return grouped;
    }, [currentList?.statuses, filteredTasks]);

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) return;

        try {
            await createTask({
                listId: parseInt(listId),
                title: newTaskTitle.trim()
            });
            setNewTaskTitle('');
            setShowNewTask(false);
        } catch (err) {
            console.error('Error creating task:', err);
        }
    };

    const handleTaskStatusChange = async (taskId, newStatusId) => {
        try {
            await updateTask(taskId, { statusId: newStatusId });
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        navigate(`/w/${currentList.space?.workspaceId}/list/${listId}/task/${task.id}`);
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'URGENT':
                return <AlertCircle size={14} className="priority-urgent" />;
            case 'HIGH':
                return <AlertCircle size={14} className="priority-high" />;
            case 'NORMAL':
                return <Circle size={14} className="priority-normal" />;
            case 'LOW':
                return <Circle size={14} className="priority-low" />;
            default:
                return null;
        }
    };

    if (loading && !currentList) {
        return (
            <Dashboard>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading list...</p>
                </div>
            </Dashboard>
        );
    }

    if (!currentList) {
        return (
            <Dashboard>
                <div className="not-found-container">
                    <h2>List not found</h2>
                    <p>The list you are looking for does not exist or you do not have access to it.</p>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="list-page">
                {/* Header */}
                <div className="list-header">
                    <div className="header-left">
                        <span className="list-icon" style={{ color: currentList.color }}>
                            {currentList.icon || '📋'}
                        </span>
                        <h1>{currentList.name}</h1>
                        {currentList.description && (
                            <p className="list-description">{currentList.description}</p>
                        )}
                    </div>
                    <div className="header-right">
                        <div className="view-switcher">
                            <button
                                className={`view-btn ${view === 'list' ? 'active' : ''}`}
                                onClick={() => setView('list')}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                            <button
                                className={`view-btn ${view === 'board' ? 'active' : ''}`}
                                onClick={() => setView('board')}
                                title="Board View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                className={`view-btn ${view === 'calendar' ? 'active' : ''}`}
                                onClick={() => setView('calendar')}
                                title="Calendar View"
                            >
                                <Calendar size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="list-toolbar">
                    <div className="toolbar-left">
                        <button
                            className="btn-add-task"
                            onClick={() => setShowNewTask(true)}
                        >
                            <Plus size={16} />
                            <span>Add Task</span>
                        </button>

                        <div className="search-box">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="toolbar-right">
                        <div className="filter-group">
                            <Filter size={14} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                {currentList.statuses?.map(status => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="all">All Priorities</option>
                                <option value="URGENT">Urgent</option>
                                <option value="HIGH">High</option>
                                <option value="NORMAL">Normal</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="list-content">
                    {view === 'list' && (
                        <ListView
                            tasks={filteredTasks}
                            statuses={currentList.statuses}
                            showNewTask={showNewTask}
                            newTaskTitle={newTaskTitle}
                            setNewTaskTitle={setNewTaskTitle}
                            handleCreateTask={handleCreateTask}
                            setShowNewTask={setShowNewTask}
                            handleTaskClick={handleTaskClick}
                            handleTaskStatusChange={handleTaskStatusChange}
                            getPriorityIcon={getPriorityIcon}
                        />
                    )}

                    {view === 'board' && (
                        <BoardView
                            statuses={currentList.statuses}
                            tasksByStatus={tasksByStatus}
                            showNewTask={showNewTask}
                            newTaskTitle={newTaskTitle}
                            setNewTaskTitle={setNewTaskTitle}
                            handleCreateTask={handleCreateTask}
                            setShowNewTask={setShowNewTask}
                            handleTaskClick={handleTaskClick}
                            handleTaskStatusChange={handleTaskStatusChange}
                            getPriorityIcon={getPriorityIcon}
                        />
                    )}

                    {view === 'calendar' && (
                        <div className="calendar-view">
                            <p>Calendar view coming soon...</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .list-page {
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

                .list-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .list-icon {
                    font-size: 24px;
                }

                .list-header h1 {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }

                .list-description {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .view-switcher {
                    display: flex;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    padding: 4px;
                    gap: 4px;
                }

                .view-btn {
                    background: none;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    transition: all 0.2s;
                }

                .view-btn:hover {
                    color: var(--text-primary, #fff);
                }

                .view-btn.active {
                    background: var(--primary, #6366f1);
                    color: white;
                }

                .list-toolbar {
                    padding: 12px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                }

                .toolbar-left,
                .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .btn-add-task {
                    background: var(--primary, #6366f1);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    transition: background 0.2s;
                }

                .btn-add-task:hover {
                    background: var(--primary-dark, #5558e8);
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .search-box input {
                    background: none;
                    border: none;
                    outline: none;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                    width: 200px;
                }

                .search-box input::placeholder {
                    color: var(--text-tertiary, #6b6b80);
                }

                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .filter-group select {
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                    cursor: pointer;
                }

                .list-content {
                    flex: 1;
                    overflow: auto;
                    padding: 16px 24px;
                }

                .calendar-view {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-secondary, #a0a0b2);
                }

                .priority-urgent { color: #ef4444; }
                .priority-high { color: #f59e0b; }
                .priority-normal { color: #6b7280; }
                .priority-low { color: #3b82f6; }
            `}</style>
        </Dashboard>
    );
};

// List View Component
const ListView = ({
    tasks,
    statuses,
    showNewTask,
    newTaskTitle,
    setNewTaskTitle,
    handleCreateTask,
    setShowNewTask,
    handleTaskClick,
    handleTaskStatusChange,
    getPriorityIcon
}) => {
    return (
        <div className="list-view">
            {/* New Task Input */}
            {showNewTask && (
                <div className="new-task-row">
                    <input
                        type="text"
                        placeholder="Task name..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTask();
                            if (e.key === 'Escape') setShowNewTask(false);
                        }}
                        autoFocus
                    />
                    <button className="btn-save" onClick={handleCreateTask}>Save</button>
                    <button className="btn-cancel" onClick={() => setShowNewTask(false)}>Cancel</button>
                </div>
            )}

            {/* Tasks Table */}
            <table className="tasks-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Task Name</th>
                        <th style={{ width: '120px' }}>Status</th>
                        <th style={{ width: '100px' }}>Priority</th>
                        <th style={{ width: '120px' }}>Due Date</th>
                        <th style={{ width: '100px' }}>Assignees</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id} onClick={() => handleTaskClick(task)}>
                            <td>
                                <GripVertical size={14} className="drag-handle" />
                            </td>
                            <td className="task-title">
                                {task.status?.isClosed ? (
                                    <CheckCircle2 size={16} className="task-complete" />
                                ) : (
                                    <Circle size={16} className="task-incomplete" />
                                )}
                                <span>{task.title}</span>
                                {task._count?.subtasks > 0 && (
                                    <span className="subtask-count">{task._count.subtasks} subtasks</span>
                                )}
                            </td>
                            <td>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: task.status?.color + '20', color: task.status?.color }}
                                >
                                    {task.status?.name}
                                </span>
                            </td>
                            <td>
                                <span className="priority-badge">
                                    {getPriorityIcon(task.priority)}
                                    {task.priority !== 'NONE' && task.priority}
                                </span>
                            </td>
                            <td>
                                {task.dueDate && (
                                    <span className="due-date">
                                        <Clock size={12} />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </td>
                            <td>
                                <div className="assignees">
                                    {task.assignees?.slice(0, 3).map(a => (
                                        <span
                                            key={a.id}
                                            className="assignee-avatar"
                                            title={a.employee?.name}
                                        >
                                            {a.employee?.photo ? (
                                                <img src={a.employee.photo} alt="" />
                                            ) : (
                                                a.employee?.name?.charAt(0)
                                            )}
                                        </span>
                                    ))}
                                    {task.assignees?.length > 3 && (
                                        <span className="more-assignees">
                                            +{task.assignees.length - 3}
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {tasks.length === 0 && !showNewTask && (
                <div className="empty-tasks">
                    <p>No tasks yet. Click Add Task to create one.</p>
                </div>
            )}

            <style>{`
                .list-view {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .new-task-row {
                    display: flex;
                    gap: 8px;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                }

                .new-task-row input {
                    flex: 1;
                    background: var(--bg-tertiary, #252538);
                    border: 1px solid var(--border-color, #2d2d44);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                }

                .new-task-row input:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
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

                .tasks-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .tasks-table th {
                    text-align: left;
                    padding: 12px 16px;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: var(--text-tertiary, #6b6b80);
                    font-weight: 500;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                }

                .tasks-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color, #2d2d44);
                    font-size: 13px;
                    color: var(--text-primary, #fff);
                }

                .tasks-table tr:hover {
                    background: var(--bg-hover, #2d2d44);
                    cursor: pointer;
                }

                .drag-handle {
                    color: var(--text-tertiary, #6b6b80);
                    cursor: grab;
                }

                .task-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .task-complete {
                    color: var(--success, #10b981);
                }

                .task-incomplete {
                    color: var(--text-tertiary, #6b6b80);
                }

                .subtask-count {
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                    background: var(--bg-tertiary, #252538);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .priority-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .due-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: var(--text-secondary, #a0a0b2);
                }

                .assignees {
                    display: flex;
                    align-items: center;
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
                    margin-left: -6px;
                    border: 2px solid var(--bg-secondary, #1a1a2e);
                }

                .assignee-avatar:first-child {
                    margin-left: 0;
                }

                .assignee-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .more-assignees {
                    margin-left: 4px;
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                }

                .empty-tasks {
                    padding: 48px;
                    text-align: center;
                    color: var(--text-secondary, #a0a0b2);
                }
            `}</style>
        </div>
    );
};

// Board View Component
const BoardView = ({
    statuses,
    tasksByStatus,
    showNewTask,
    newTaskTitle,
    setNewTaskTitle,
    handleCreateTask,
    setShowNewTask,
    handleTaskClick,
    handleTaskStatusChange,
    getPriorityIcon
}) => {
    const [addingToColumn, setAddingToColumn] = useState(null);

    return (
        <div className="board-view">
            {statuses?.map(status => (
                <div key={status.id} className="board-column">
                    <div className="column-header" style={{ borderTopColor: status.color }}>
                        <span className="column-title">{status.name}</span>
                        <span className="column-count">{tasksByStatus[status.id]?.length || 0}</span>
                        <button
                            className="add-card-btn"
                            onClick={() => setAddingToColumn(status.id)}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="column-content">
                        {addingToColumn === status.id && (
                            <div className="new-card">
                                <input
                                    type="text"
                                    placeholder="Task name..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateTask();
                                            setAddingToColumn(null);
                                        }
                                        if (e.key === 'Escape') {
                                            setAddingToColumn(null);
                                            setNewTaskTitle('');
                                        }
                                    }}
                                    autoFocus
                                />
                                <div className="new-card-actions">
                                    <button
                                        className="btn-save"
                                        onClick={() => {
                                            handleCreateTask();
                                            setAddingToColumn(null);
                                        }}
                                    >
                                        Add
                                    </button>
                                    <button
                                        className="btn-cancel"
                                        onClick={() => {
                                            setAddingToColumn(null);
                                            setNewTaskTitle('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {tasksByStatus[status.id]?.map(task => (
                            <div
                                key={task.id}
                                className="task-card"
                                onClick={() => handleTaskClick(task)}
                            >
                                <div className="card-header">
                                    {getPriorityIcon(task.priority)}
                                    <span className="task-title">{task.title}</span>
                                </div>

                                {task.description && (
                                    <p className="task-description">
                                        {task.description.substring(0, 100)}
                                        {task.description.length > 100 && '...'}
                                    </p>
                                )}

                                <div className="card-footer">
                                    {task.dueDate && (
                                        <span className="due-date">
                                            <Clock size={12} />
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}

                                    <div className="card-assignees">
                                        {task.assignees?.slice(0, 2).map(a => (
                                            <span
                                                key={a.id}
                                                className="assignee-avatar"
                                                title={a.employee?.name}
                                            >
                                                {a.employee?.photo ? (
                                                    <img src={a.employee.photo} alt="" />
                                                ) : (
                                                    a.employee?.name?.charAt(0)
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <style>{`
                .board-view {
                    display: flex;
                    gap: 16px;
                    height: 100%;
                    overflow-x: auto;
                    padding-bottom: 16px;
                }

                .board-column {
                    flex: 0 0 280px;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    max-height: 100%;
                }

                .column-header {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-top: 3px solid #6366f1;
                    border-radius: 8px 8px 0 0;
                }

                .column-title {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                }

                .column-count {
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                    background: var(--bg-tertiary, #252538);
                    padding: 2px 8px;
                    border-radius: 10px;
                }

                .add-card-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    color: var(--text-secondary, #a0a0b2);
                    border-radius: 4px;
                }

                .add-card-btn:hover {
                    background: var(--bg-hover, #2d2d44);
                    color: var(--text-primary, #fff);
                }

                .column-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .new-card {
                    background: var(--bg-tertiary, #252538);
                    border-radius: 6px;
                    padding: 12px;
                }

                .new-card input {
                    width: 100%;
                    background: none;
                    border: none;
                    color: var(--text-primary, #fff);
                    font-size: 13px;
                    margin-bottom: 8px;
                }

                .new-card input:focus {
                    outline: none;
                }

                .new-card-actions {
                    display: flex;
                    gap: 8px;
                }

                .new-card .btn-save {
                    background: var(--primary, #6366f1);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .new-card .btn-cancel {
                    background: none;
                    border: none;
                    color: var(--text-secondary, #a0a0b2);
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .task-card {
                    background: var(--bg-tertiary, #252538);
                    border-radius: 6px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .task-card:hover {
                    background: var(--bg-hover, #2d2d44);
                    transform: translateY(-1px);
                }

                .card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .task-card .task-title {
                    flex: 1;
                    font-size: 13px;
                    color: var(--text-primary, #fff);
                    font-weight: 500;
                }

                .task-description {
                    font-size: 12px;
                    color: var(--text-secondary, #a0a0b2);
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                }

                .card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .card-footer .due-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: var(--text-tertiary, #6b6b80);
                }

                .card-assignees {
                    display: flex;
                }

                .card-assignees .assignee-avatar {
                    width: 20px;
                    height: 20px;
                    font-size: 9px;
                    margin-left: -4px;
                }

                .card-assignees .assignee-avatar:first-child {
                    margin-left: 0;
                }
            `}</style>
        </div>
    );
};

export default ListPage;
