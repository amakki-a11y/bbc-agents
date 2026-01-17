import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
    Plus, Filter, Search, Layers, Columns, SlidersHorizontal, LayoutDashboard, List as ListIcon, Trash2, CheckSquare, X
} from 'lucide-react';
import TaskList from '../components/TaskList';
import BoardView from '../components/BoardView';
import LoadingSpinner from '../components/LoadingSpinner';

const TaskDetailsPage = lazy(() => import('./TaskDetailsPage'));

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

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);

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

    // Filter Tasks for this project
    const projectTasks = tasks.filter(t => t.projectId === parseInt(id));

    // Grouping Logic (Mocking "Group by Status" for now as default)
    const groupedTasks = {
        'IN PROGRESS': projectTasks.filter(t => t.status === 'IN PROGRESS'),
        'TO DO': projectTasks.filter(t => t.status === 'TO DO' || t.status === 'todo'),
        'DONE': projectTasks.filter(t => t.status === 'DONE' || t.status === 'done')
    };

    const StatusGroup = ({ status, color, groupTasks }) => {
        const isOpen = isGroupOpen[status] ?? true;
        return (
            <div style={{ marginBottom: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <div
                    onClick={() => setIsGroupOpen(prev => ({ ...prev, [status]: !prev[status] }))}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none',
                        background: '#fff', borderBottom: isOpen ? '1px solid #f0f0f0' : 'none'
                    }}
                >
                    <div style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</div>
                    <span
                        className="status-pill"
                        style={{ padding: '2px 8px', borderRadius: '4px', color: 'white', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: color }}
                    >
                        {status}
                    </span>
                    <span style={{ color: '#aaa', fontSize: '0.8rem', marginLeft: '0.2rem' }}>{groupTasks.length}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', opacity: 0.6 }}>
                        <Plus size={14} /> <span style={{ fontSize: '0.8rem' }}>Add Task</span>
                    </div>
                </div>

                {isOpen && (
                    <div>
                        {/* Header Columns for List View */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '40px minmax(300px, 1fr) 100px 120px 100px 50px',
                            padding: '0.5rem 1rem', borderBottom: '1px solid #f0f0f0',
                            color: '#999', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600,
                            background: '#fafafa'
                        }}>
                            <div></div>
                            <div style={{ paddingLeft: '2rem' }}>Name</div>
                            <div>Assignee</div>
                            <div>Due Date</div>
                            <div>Priority</div>
                            <div></div>
                        </div>
                        <TaskList
                            tasks={groupTasks}
                            onToggleStatus={(tid, status) => updateTask(tid, { status: status === 'done' ? 'TO DO' : 'done' })}
                            onOpenTask={handleOpenTask}
                            // Selection props
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                        />

                        {/* Add Task Row */}
                        <div
                            onClick={async () => {
                                const t = await addTask({ title: "New Task", status: status });
                                handleOpenTask(t);
                            }}
                            style={{
                                padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                color: '#aaa', fontSize: '0.8rem', cursor: 'pointer',
                                borderTop: '1px solid #f0f0f0'
                            }}
                        >
                            <Plus size={14} /> Add Task
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'white', position: 'relative' }}>
            {/* 1. Header Line: Title + Tabs */}
            <div style={{ padding: '1rem 2rem 0 2rem', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <span style={{ opacity: 0.7 }}>Smart Market</span> <span style={{ opacity: 0.4 }}>/</span> <span style={{ fontWeight: 600 }}>{activeProject?.name}</span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#555', position: 'relative', top: '1px' }}>
                    <div
                        onClick={() => setView('list')}
                        style={{ paddingBottom: '0.8rem', borderBottom: currentView === 'list' ? '2px solid var(--primary)' : '2px solid transparent', color: currentView === 'list' ? 'var(--primary)' : 'inherit', fontWeight: currentView === 'list' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <ListIcon size={16} /> List
                    </div>
                    <div
                        onClick={() => setView('board')}
                        style={{ paddingBottom: '0.8rem', borderBottom: currentView === 'board' ? '2px solid var(--primary)' : '2px solid transparent', color: currentView === 'board' ? 'var(--primary)' : 'inherit', fontWeight: currentView === 'board' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <LayoutDashboard size={16} /> Board
                    </div>
                    <div style={{ paddingBottom: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Plus size={14} /> View
                    </div>
                </div>
            </div>

            {/* 2. Controls Bar */}
            <div style={{
                padding: '0.8rem 2rem', borderBottom: '1px solid #e0e0e0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fafafa'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="control-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}>
                        <Layers size={14} /> Group: Status
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}>Subtasks</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}><Columns size={14} /> Columns</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}><Filter size={14} /> Filter</div>
                    <div style={{ width: '1px', height: '16px', background: '#ddd' }}></div>
                    <div style={{ fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}>Closed</div>
                    <div style={{ fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}>Assignee</div>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input placeholder="Search" style={{ padding: '0.3rem 0.5rem 0.3rem 1.8rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem', outline: 'none', background: 'transparent' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }}><SlidersHorizontal size={14} /> Customize</div>
                    <button onClick={async () => { const t = await addTask({ title: "New Task" }); handleOpenTask(t); }} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '0.3rem 0.8rem', fontSize: '0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Task</button>
                </div>
            </div>

            {/* FLOATING BULK ACTIONS BAR */}
            {selectedIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                    <span className="font-semibold">{selectedIds.length} selected</span>
                    <div className="h-4 w-px bg-gray-600"></div>
                    <button onClick={() => handleBulkStatus('done')} className="hover:text-green-400 flex items-center gap-1"><CheckSquare size={16} /> Done</button>
                    <button onClick={() => handleBulkStatus('todo')} className="hover:text-yellow-400 flex items-center gap-1"><CheckSquare size={16} /> Todo</button>
                    <div className="h-4 w-px bg-gray-600"></div>
                    <button onClick={handleBulkDelete} className="hover:text-red-400 flex items-center gap-1"><Trash2 size={16} /> Delete</button>
                    <button onClick={clearSelection} className="ml-2 p-1 hover:bg-gray-800 rounded-full"><X size={16} /></button>
                </div>
            )}

            {/* 3. Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fc' }}>
                {currentView === 'list' ? (
                    <div style={{ padding: '1.5rem 2rem' }}>
                        <StatusGroup status="IN PROGRESS" color="#7b68ee" groupTasks={groupedTasks['IN PROGRESS']} />
                        <StatusGroup status="TO DO" color="#b0b0b0" groupTasks={groupedTasks['TO DO']} />
                        <StatusGroup status="DONE" color="#10b981" groupTasks={groupedTasks['DONE']} />
                    </div>
                ) : (
                    <BoardView onOpenTask={setSelectedTask} />
                )}
            </div>

            {selectedTask && (
                <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"><LoadingSpinner /></div>}>
                    <TaskDetailsPage
                        taskId={selectedTask.id}
                        onClose={handleCloseTask}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default ProjectListView;
