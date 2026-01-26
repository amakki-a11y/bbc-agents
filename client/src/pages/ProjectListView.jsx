import { useState, useEffect, Suspense, lazy, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
    Plus, Filter, Search, Layers, LayoutDashboard, List as ListIcon, Trash2, CheckSquare, X, ChevronDown, ChevronRight, ArrowUpDown, Flag, Users
} from 'lucide-react';
import TaskList from '../components/TaskList';
import BoardView from '../components/BoardView';
import LoadingSpinner from '../components/LoadingSpinner';
import AiAssistButton from '../components/AiAssistButton';
import ProjectShareModal from '../components/ProjectShareModal';

const TaskDetailsPage = lazy(() => import('./TaskDetailsPage'));

const STATUS_CONFIG = {
    'IN PROGRESS': { color: '#7c3aed', bgColor: '#f5f3ff', icon: '🔄' },
    'TO DO': { color: '#6b7280', bgColor: '#f9fafb', icon: '📋' },
    'DONE': { color: '#10b981', bgColor: '#ecfdf5', icon: '✅' }
};

const PRIORITY_OPTIONS = [
    { value: 'urgent', label: 'Urgent', color: '#dc2626' },
    { value: 'high', label: 'High', color: '#ea580c' },
    { value: 'normal', label: 'Normal', color: '#2563eb' },
    { value: 'low', label: 'Low', color: '#16a34a' }
];

const SORT_OPTIONS = [
    { value: 'due_date_asc', label: 'Due Date (Earliest)' },
    { value: 'due_date_desc', label: 'Due Date (Latest)' },
    { value: 'priority_high', label: 'Priority (High to Low)' },
    { value: 'priority_low', label: 'Priority (Low to High)' },
    { value: 'title_asc', label: 'Name (A-Z)' },
    { value: 'title_desc', label: 'Name (Z-A)' },
    { value: 'created_desc', label: 'Newest First' },
    { value: 'created_asc', label: 'Oldest First' }
];

const DUE_DATE_FILTERS = [
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'no_date', label: 'No Date' }
];

const FilterDropdown = ({ isOpen, onClose, filters, setFilters, tasks }) => {
    if (!isOpen) return null;

    const _uniquePriorities = [...new Set(tasks.map(t => t.priority).filter(Boolean))];
    const uniqueTags = [...new Set(tasks.flatMap(t => t.tags || []))];

    const togglePriority = (priority) => {
        const current = filters.priorities || [];
        setFilters({
            ...filters,
            priorities: current.includes(priority)
                ? current.filter(p => p !== priority)
                : [...current, priority]
        });
    };

    const toggleDueDate = (dueDateFilter) => {
        const current = filters.dueDates || [];
        setFilters({
            ...filters,
            dueDates: current.includes(dueDateFilter)
                ? current.filter(d => d !== dueDateFilter)
                : [...current, dueDateFilter]
        });
    };

    const toggleTag = (tag) => {
        const current = filters.tags || [];
        setFilters({
            ...filters,
            tags: current.includes(tag)
                ? current.filter(t => t !== tag)
                : [...current, tag]
        });
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
            <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                minWidth: '280px',
                zIndex: 50,
                padding: '12px'
            }}>
                {/* Priority Filter */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Priority
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {PRIORITY_OPTIONS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => togglePriority(p.value)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    border: '1px solid',
                                    borderColor: (filters.priorities || []).includes(p.value) ? p.color : '#e5e7eb',
                                    background: (filters.priorities || []).includes(p.value) ? `${p.color}15` : 'white',
                                    color: (filters.priorities || []).includes(p.value) ? p.color : '#6b7280',
                                    cursor: 'pointer'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Due Date Filter */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Due Date
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {DUE_DATE_FILTERS.map(d => (
                            <button
                                key={d.value}
                                onClick={() => toggleDueDate(d.value)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    border: '1px solid',
                                    borderColor: (filters.dueDates || []).includes(d.value) ? '#4f46e5' : '#e5e7eb',
                                    background: (filters.dueDates || []).includes(d.value) ? '#eef2ff' : 'white',
                                    color: (filters.dueDates || []).includes(d.value) ? '#4f46e5' : '#6b7280',
                                    cursor: 'pointer'
                                }}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tags Filter */}
                {uniqueTags.length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Tags
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {uniqueTags.slice(0, 8).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        border: '1px solid',
                                        borderColor: (filters.tags || []).includes(tag) ? '#4f46e5' : '#e5e7eb',
                                        background: (filters.tags || []).includes(tag) ? '#eef2ff' : 'white',
                                        color: (filters.tags || []).includes(tag) ? '#4f46e5' : '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

const SortDropdown = ({ isOpen, onClose, sortBy, setSortBy }) => {
    if (!isOpen) return null;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
            <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                minWidth: '200px',
                zIndex: 50,
                overflow: 'hidden'
            }}>
                {SORT_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); onClose(); }}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 14px',
                            textAlign: 'left',
                            background: sortBy === opt.value ? '#f3f4f6' : 'transparent',
                            border: 'none',
                            fontSize: '0.85rem',
                            color: sortBy === opt.value ? '#4f46e5' : '#374151',
                            fontWeight: sortBy === opt.value ? 600 : 400,
                            cursor: 'pointer'
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </>
    );
};

const PriorityDropdown = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={onClose} />
            <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                zIndex: 70
            }}>
                {PRIORITY_OPTIONS.map(p => (
                    <button
                        key={p.value}
                        onClick={() => { onSelect(p.value); onClose(); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 16px',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '0.85rem',
                            color: '#374151',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Flag size={14} style={{ color: p.color }} />
                        {p.label}
                    </button>
                ))}
            </div>
        </>
    );
};

const InlineTaskInput = ({ status, onAddTask, onCancel }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (title.trim()) {
            await onAddTask({ title: title.trim(), status });
            setTitle('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderTop: '1px solid #f0f0f0',
            background: '#fafbfc'
        }}>
            <div style={{
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Plus size={16} style={{ color: '#9ca3af' }} />
            </div>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter task name..."
                autoFocus
                style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.9rem',
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 0 0 2px #e0e7ff'
                }}
            />
            <button
                type="submit"
                disabled={!title.trim()}
                style={{
                    padding: '0.4rem 0.8rem',
                    background: title.trim() ? '#4f46e5' : '#e5e7eb',
                    color: title.trim() ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: title.trim() ? 'pointer' : 'not-allowed'
                }}
            >
                Add
            </button>
            <button
                type="button"
                onClick={onCancel}
                style={{
                    padding: '0.4rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={16} />
            </button>
        </form>
    );
};

const ProjectListView = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        projects, activeProjectId, setActiveProjectId,
        tasks, addTask, updateTask, bulkUpdateTasks, bulkDeleteTasks,
        updateViewSetting
    } = useProject();

    const [selectedTask, setSelectedTask] = useState(null);
    const [isGroupOpen, setIsGroupOpen] = useState({ 'IN PROGRESS': true, 'TO DO': true, 'DONE': true });
    const [addingTaskInGroup, setAddingTaskInGroup] = useState(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);

    // Search, Filter, Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ priorities: [], dueDates: [], tags: [] });
    const [sortBy, setSortBy] = useState('created_desc');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const filterRef = useRef(null);
    const sortRef = useRef(null);

    // Get current project for AI assist and sharing
    const currentProject = projects.find(p => p.id === parseInt(id));

    // Sync ID from URL to Context
    useEffect(() => {
        if (id) setActiveProjectId(parseInt(id));
    }, [id, setActiveProjectId]);

    // Handle Task ID from URL
    useEffect(() => {
        const taskId = searchParams.get('taskId');
        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === parseInt(taskId));
            if (task) setSelectedTask(task);
        } else if (!taskId) {
            setSelectedTask(null);
        }
    }, [searchParams, tasks]);

    const handleOpenTask = useCallback((task) => {
        setSearchParams(prev => {
            prev.set('taskId', task.id);
            return prev;
        });
    }, [setSearchParams]);

    const handleCloseTask = useCallback(() => {
        setSearchParams(prev => {
            prev.delete('taskId');
            return prev;
        });
    }, [setSearchParams]);

    const activeProject = projects.find(p => p.id === parseInt(id)) || projects[0];
    const currentView = searchParams.get('view') || 'list';

    const setView = (view) => {
        setSearchParams({ view });
        updateViewSetting(activeProjectId, 'viewType', view);
    };

    // Selection Handlers
    const toggleSelect = useCallback((taskId) => {
        setSelectedIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    }, []);

    const clearSelection = () => setSelectedIds([]);

    const handleBulkStatus = async (status) => {
        await bulkUpdateTasks(selectedIds, { status });
        clearSelection();
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Delete ${selectedIds.length} tasks?`)) {
            await bulkDeleteTasks(selectedIds);
            clearSelection();
        }
    };

    const handleInlineAddTask = async (taskData) => {
        const t = await addTask(taskData);
        setAddingTaskInGroup(null);
        return t;
    };

    // Handle bulk priority change
    const handleBulkPriority = async (priority) => {
        await bulkUpdateTasks(selectedIds, { priority });
        clearSelection();
    };

    // Filter Tasks for this project
    const projectTasks = tasks.filter(t => t.projectId === parseInt(id));

    // Apply search, filters, and sorting
    const filteredAndSortedTasks = useMemo(() => {
        let result = [...projectTasks];

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query) ||
                (t.tags || []).some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply priority filter
        if (filters.priorities?.length > 0) {
            result = result.filter(t => filters.priorities.includes(t.priority));
        }

        // Apply due date filter
        if (filters.dueDates?.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);

            result = result.filter(t => {
                const dueDate = t.due_date ? new Date(t.due_date) : null;
                if (dueDate) dueDate.setHours(0, 0, 0, 0);

                return filters.dueDates.some(f => {
                    if (f === 'no_date') return !dueDate;
                    if (f === 'overdue') return dueDate && dueDate < today;
                    if (f === 'today') return dueDate && dueDate.getTime() === today.getTime();
                    if (f === 'this_week') return dueDate && dueDate >= today && dueDate <= weekEnd;
                    return false;
                });
            });
        }

        // Apply tags filter
        if (filters.tags?.length > 0) {
            result = result.filter(t =>
                (t.tags || []).some(tag => filters.tags.includes(tag))
            );
        }

        // Apply sorting
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        result.sort((a, b) => {
            switch (sortBy) {
                case 'due_date_asc':
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date) - new Date(b.due_date);
                case 'due_date_desc':
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(b.due_date) - new Date(a.due_date);
                case 'priority_high':
                    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
                case 'priority_low':
                    return (priorityOrder[b.priority] || 4) - (priorityOrder[a.priority] || 4);
                case 'title_asc':
                    return (a.title || '').localeCompare(b.title || '');
                case 'title_desc':
                    return (b.title || '').localeCompare(a.title || '');
                case 'created_asc':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'created_desc':
                default:
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
        });

        return result;
    }, [projectTasks, searchQuery, filters, sortBy]);

    // Check if any filters are active
    const hasActiveFilters = searchQuery.trim() ||
        filters.priorities?.length > 0 ||
        filters.dueDates?.length > 0 ||
        filters.tags?.length > 0;

    const clearAllFilters = () => {
        setSearchQuery('');
        setFilters({ priorities: [], dueDates: [], tags: [] });
    };

    // Grouping Logic (use filtered tasks)
    const groupedTasks = {
        'IN PROGRESS': filteredAndSortedTasks.filter(t => t.status === 'IN PROGRESS'),
        'TO DO': filteredAndSortedTasks.filter(t => t.status === 'TO DO' || t.status === 'todo'),
        'DONE': filteredAndSortedTasks.filter(t => t.status === 'DONE' || t.status === 'done')
    };

    const StatusGroup = ({ status, groupTasks }) => {
        const isOpen = isGroupOpen[status] ?? true;
        const config = STATUS_CONFIG[status];
        const [isHovering, setIsHovering] = useState(false);

        return (
            <div
                style={{
                    marginBottom: '1rem',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
            >
                <div
                    onClick={() => setIsGroupOpen(prev => ({ ...prev, [status]: !prev[status] }))}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: isHovering ? '#f9fafb' : 'white',
                        borderBottom: isOpen ? '1px solid #f0f0f0' : 'none',
                        transition: 'background 0.15s'
                    }}
                >
                    <div style={{
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.2s'
                    }}>
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: config.bgColor,
                        border: `1px solid ${config.color}20`
                    }}>
                        <span style={{ fontSize: '12px' }}>{config.icon}</span>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            color: config.color
                        }}>
                            {status}
                        </span>
                    </div>

                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        height: '24px',
                        padding: '0 6px',
                        borderRadius: '12px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        {groupTasks.length}
                    </span>

                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setAddingTaskInGroup(status);
                            if (!isOpen) setIsGroupOpen(prev => ({ ...prev, [status]: true }));
                        }}
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            color: '#6b7280',
                            fontSize: '0.8rem',
                            opacity: isHovering ? 1 : 0,
                            transition: 'opacity 0.15s, background 0.15s',
                            cursor: 'pointer',
                            background: isHovering ? '#f3f4f6' : 'transparent'
                        }}
                    >
                        <Plus size={14} />
                        <span>Add</span>
                    </div>
                </div>

                {isOpen && (
                    <div>
                        {/* Header Columns for List View */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px minmax(300px, 1fr) 110px 130px 100px 50px',
                            padding: '0.5rem 1rem',
                            borderBottom: '1px solid #f0f0f0',
                            color: '#9ca3af',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            background: '#fafafa'
                        }}>
                            <div></div>
                            <div style={{ paddingLeft: '2.5rem' }}>Task Name</div>
                            <div>Assignee</div>
                            <div>Due Date</div>
                            <div>Priority</div>
                            <div></div>
                        </div>

                        <TaskList
                            tasks={groupTasks}
                            onToggleStatus={(tid, status) => updateTask(tid, { status: status === 'done' || status === 'DONE' ? 'TO DO' : 'done' })}
                            onOpenTask={handleOpenTask}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />

                        {addingTaskInGroup === status ? (
                            <InlineTaskInput
                                status={status}
                                onAddTask={handleInlineAddTask}
                                onCancel={() => setAddingTaskInGroup(null)}
                            />
                        ) : (
                            <div
                                onClick={() => setAddingTaskInGroup(status)}
                                style={{
                                    padding: '0.65rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#9ca3af',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    borderTop: groupTasks.length > 0 ? '1px solid #f0f0f0' : 'none',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f9fafb';
                                    e.currentTarget.style.color = '#6b7280';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#9ca3af';
                                }}
                            >
                                <Plus size={16} />
                                <span>Add task</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'white', position: 'relative' }}>
            {/* 1. Header Line: Title + Tabs */}
            <div style={{ padding: '1rem 2rem 0 2rem', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    marginBottom: '1rem'
                }}>
                    <span style={{ opacity: 0.7 }}>Projects</span>
                    <span style={{ opacity: 0.4 }}>/</span>
                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{activeProject?.name}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.9rem', color: '#6b7280', position: 'relative', top: '1px' }}>
                    <div
                        onClick={() => setView('list')}
                        style={{
                            padding: '0.6rem 1rem',
                            borderBottom: currentView === 'list' ? '2px solid #4f46e5' : '2px solid transparent',
                            color: currentView === 'list' ? '#4f46e5' : 'inherit',
                            fontWeight: currentView === 'list' ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '6px 6px 0 0',
                            transition: 'all 0.15s'
                        }}
                    >
                        <ListIcon size={16} /> List
                    </div>
                    <div
                        onClick={() => setView('board')}
                        style={{
                            padding: '0.6rem 1rem',
                            borderBottom: currentView === 'board' ? '2px solid #4f46e5' : '2px solid transparent',
                            color: currentView === 'board' ? '#4f46e5' : 'inherit',
                            fontWeight: currentView === 'board' ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '6px 6px 0 0',
                            transition: 'all 0.15s'
                        }}
                    >
                        <LayoutDashboard size={16} /> Board
                    </div>
                    <div style={{
                        padding: '0.6rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#9ca3af',
                        transition: 'color 0.15s'
                    }}>
                        <Plus size={14} /> View
                    </div>
                </div>
            </div>

            {/* 2. Controls Bar */}
            <div style={{
                padding: '0.75rem 2rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.8rem',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}>
                        <Layers size={14} /> Group: Status
                    </button>

                    {/* Filter Dropdown */}
                    <div style={{ position: 'relative' }} ref={filterRef}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: hasActiveFilters ? '#eef2ff' : 'transparent',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: hasActiveFilters ? '1px solid #a5b4fc' : 'none',
                                fontSize: '0.8rem',
                                color: hasActiveFilters ? '#4f46e5' : '#6b7280',
                                cursor: 'pointer',
                                fontWeight: hasActiveFilters ? 500 : 400
                            }}
                        >
                            <Filter size={14} /> Filter
                            {hasActiveFilters && (
                                <span style={{
                                    background: '#4f46e5',
                                    color: 'white',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {(filters.priorities?.length || 0) + (filters.dueDates?.length || 0) + (filters.tags?.length || 0)}
                                </span>
                            )}
                        </button>
                        <FilterDropdown
                            isOpen={showFilterDropdown}
                            onClose={() => setShowFilterDropdown(false)}
                            filters={filters}
                            setFilters={setFilters}
                            tasks={projectTasks}
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div style={{ position: 'relative' }} ref={sortRef}>
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.8rem',
                                color: '#6b7280',
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowUpDown size={14} /> Sort
                        </button>
                        <SortDropdown
                            isOpen={showSortDropdown}
                            onClose={() => setShowSortDropdown(false)}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Active Filters Chips */}
                    {hasActiveFilters && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {searchQuery && (
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    background: '#f3f4f6',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    color: '#4b5563'
                                }}>
                                    Search: &quot;{searchQuery}&quot;
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                                </span>
                            )}
                            {filters.priorities?.map(p => (
                                <span key={p} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    background: '#f3f4f6',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    color: '#4b5563'
                                }}>
                                    {p}
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilters({ ...filters, priorities: filters.priorities.filter(x => x !== p) })} />
                                </span>
                            ))}
                            <button
                                onClick={clearAllFilters}
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }}></div>

                    {/* Search Input */}
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            style={{
                                padding: '6px 12px 6px 32px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                fontSize: '0.8rem',
                                outline: 'none',
                                background: 'white',
                                width: '180px',
                                transition: 'border-color 0.15s, box-shadow 0.15s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#a5b4fc';
                                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '2px'
                                }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* AI Assist Button */}
                    <AiAssistButton
                        context="project"
                        projectId={parseInt(id)}
                        size="small"
                    />

                    {/* Share Button */}
                    <button
                        onClick={() => setShowShareModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                    >
                        <Users size={14} /> Share
                    </button>

                    <button
                        onClick={async () => {
                            const t = await addTask({ title: "New Task" });
                            handleOpenTask(t);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#4f46e5',
                            color: 'white',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            boxShadow: '0 1px 2px rgba(79, 70, 229, 0.3)',
                            transition: 'background 0.15s, transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
                    >
                        <Plus size={14} /> Add Task
                    </button>
                </div>
            </div>

            {/* No results message */}
            {hasActiveFilters && filteredAndSortedTasks.length === 0 && (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                }}>
                    <p style={{ marginBottom: '8px' }}>No tasks match your filters</p>
                    <button
                        onClick={clearAllFilters}
                        style={{
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* FLOATING BULK ACTIONS BAR */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1f2937',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    animation: 'slideUp 0.2s ease-out'
                }}>
                    <span style={{ fontWeight: 600 }}>{selectedIds.length} selected</span>
                    <div style={{ height: '16px', width: '1px', background: '#4b5563' }}></div>
                    <button
                        onClick={() => handleBulkStatus('done')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <CheckSquare size={16} /> Done
                    </button>
                    <button
                        onClick={() => handleBulkStatus('TO DO')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <CheckSquare size={16} /> To Do
                    </button>
                    <div style={{ height: '16px', width: '1px', background: '#4b5563' }}></div>
                    {/* Priority Bulk Action */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Flag size={16} /> Priority
                        </button>
                        <PriorityDropdown
                            isOpen={showPriorityDropdown}
                            onClose={() => setShowPriorityDropdown(false)}
                            onSelect={handleBulkPriority}
                        />
                    </div>
                    <div style={{ height: '16px', width: '1px', background: '#4b5563' }}></div>
                    <button
                        onClick={handleBulkDelete}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                    <button
                        onClick={clearSelection}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '50%',
                            marginLeft: '4px',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* 3. Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fc' }}>
                {currentView === 'list' ? (
                    <div style={{ padding: '1.5rem 2rem' }}>
                        <StatusGroup status="IN PROGRESS" groupTasks={groupedTasks['IN PROGRESS']} />
                        <StatusGroup status="TO DO" groupTasks={groupedTasks['TO DO']} />
                        <StatusGroup status="DONE" groupTasks={groupedTasks['DONE']} />
                    </div>
                ) : (
                    <BoardView onOpenTask={setSelectedTask} />
                )}
            </div>

            {selectedTask && (
                <Suspense fallback={<div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}><LoadingSpinner /></div>}>
                    <TaskDetailsPage
                        taskId={selectedTask.id}
                        onClose={handleCloseTask}
                    />
                </Suspense>
            )}

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>

            {/* Project Share Modal */}
            <ProjectShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                project={currentProject}
                onMembersUpdate={() => {
                    // Optionally refresh project data
                    console.log('Members updated');
                }}
            />
        </div>
    );
};

export default ProjectListView;
