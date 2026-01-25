import { useState, useEffect } from 'react';
import TaskLayout from './TaskLayout';
import PropertyGrid from './PropertyGrid';
import ActivityPanel from './ActivityPanel';
import { Sparkles, FileText, CheckSquare, List } from 'lucide-react';
import { http } from '../../api/http';
import { useProject } from '../../context/ProjectContext';

const AdvancedTaskDetail = ({ task: initialTask, onClose, onUpdate }) => {
    const { activeProject } = useProject();
    const [task, setTask] = useState(initialTask);
    const [activeTab, setActiveTab] = useState('details');
    const [description, setDescription] = useState(initialTask.description || "");
    const [newSubtask, setNewSubtask] = useState("");

    const loadDetails = async () => {
        try {
            const res = await http.get(`/tasks/details/${initialTask.id}`);
            setTask(res.data);
            setDescription(res.data.description || "");
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadDetails();
    }, [initialTask.id]);

    const handlePropertyUpdate = async (updates) => {
        try {
            if (onUpdate) {
                await onUpdate(task.id, updates);
                setTask(prev => ({ ...prev, ...updates }));
            } else {
                await http.put(`/tasks/details/${task.id}`, updates);
                loadDetails();
            }
        } catch (e) { console.error("Update failed", e); }
    };

    const handleDescriptionSave = async () => {
        handlePropertyUpdate({ description });
    };

    const handleAddSubtask = async (e) => {
        if (e.key === 'Enter' && newSubtask.trim()) {
            try {
                await http.post(`/tasks/details/${task.id}/subtasks`, { title: newSubtask });
                setNewSubtask("");
                loadDetails();
            } catch (e) { console.error(e); }
        }
    };

    const handleToggleSubtask = async (subtaskId, currentStatus) => {
        try {
            await http.put(`/tasks/details/subtasks/${subtaskId}`, { is_complete: !currentStatus });
            loadDetails();
        } catch (e) { console.error(e); }
    };

    return (
        <TaskLayout onClose={onClose} projectName={activeProject?.name || 'Project'} taskId={task.id}>
            {/* Main Left Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '2rem 2rem 0' }}>

                    {/* Title with inline edit (simplified for now as just header) */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <input
                            value={task.title}
                            onChange={(e) => setTask({ ...task, title: e.target.value })}
                            onBlur={() => handlePropertyUpdate({ title: task.title })}
                            style={{ fontSize: '1.8rem', fontWeight: 'bold', background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                        />
                    </div>

                    {/* AI Helper Bar */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px', padding: '0.75rem', display: 'flex', items: 'center', gap: '0.75rem',
                        color: '#888', fontSize: '0.9rem', marginBottom: '2rem', cursor: 'pointer', transition: 'background 0.2s'
                    }}>
                        <Sparkles size={16} color="#a855f7" />
                        <span>Ask Brain to write a description, create a summary or find similar tasks</span>
                    </div>
                </div>

                <PropertyGrid task={task} onUpdate={handlePropertyUpdate} />

                {/* Tabs */}
                <div style={{ padding: '0 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={FileText}>Details</TabButton>
                        <TabButton active={activeTab === 'subtasks'} onClick={() => setActiveTab('subtasks')} icon={List}>Subtasks {task.subtasks?.length > 0 && `(${task.subtasks.length})`}</TabButton>
                        <TabButton active={activeTab === 'actionItems'} onClick={() => setActiveTab('actionItems')} icon={CheckSquare}>Action Items</TabButton>
                    </div>
                </div>

                <div style={{ padding: '2rem', flex: 1 }}>
                    {activeTab === 'details' && (
                        <>
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>Description</label>
                                    <button onClick={handleDescriptionSave} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer' }}>Save</button>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add description..."
                                    style={{
                                        width: '100%', minHeight: '200px', background: 'transparent',
                                        border: '1px solid transparent', color: '#ddd', resize: 'none', lineHeight: '1.6', outline: 'none'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button className="btn-small"><Sparkles size={12} /> Write with AI</button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Custom Fields</h4>
                                <button className="btn-dashed">+ Create a field in this List</button>
                            </div>

                            <div>
                                <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Attachments</h4>
                                <div style={{
                                    border: '2px dashed #444', borderRadius: '8px', padding: '2rem',
                                    textAlign: 'center', color: '#666', fontSize: '0.9rem'
                                }}>
                                    Drop your files here to upload
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'subtasks' && (
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="+ Add new subtask..."
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyDown={handleAddSubtask}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', outline: 'none' }}
                                />
                            </div>
                            {task.subtasks && task.subtasks.map(sub => (
                                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <input
                                        type="checkbox"
                                        checked={sub.is_complete}
                                        onChange={() => handleToggleSubtask(sub.id, sub.is_complete)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    <span style={{
                                        flex: 1,
                                        textDecoration: sub.is_complete ? 'line-through' : 'none',
                                        color: sub.is_complete ? '#555' : '#ddd'
                                    }}>
                                        {sub.title}
                                    </span>
                                </div>
                            ))}
                            {(!task.subtasks || task.subtasks.length === 0) && <div style={{ color: '#555', fontStyle: 'italic' }}>No subtasks yet.</div>}
                        </div>
                    )}
                    {activeTab === 'actionItems' && <div style={{ color: '#888' }}>Action items are typically similar to subtasks but can be assigned to different users. Logic to be implemented.</div>}
                </div>
            </div>

            {/* Right Activity Panel */}
            <ActivityPanel taskId={task.id} activities={task.activities} />

            <style>{`
            .icon-btn { background: none; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
            .icon-btn:hover { background: rgba(255,255,255,0.1); color: white; }
            .btn-small { background: rgba(99, 102, 241, 0.1); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.2); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 4px; }
            .btn-dashed { background: transparent; border: 1px dashed #555; color: #888; width: 100%; padding: 0.75rem; border-radius: 6px; cursor: pointer; text-align: left; }
            .btn-dashed:hover { border-color: #777; color: #aaa; }
        `}</style>
        </TaskLayout>
    );
};

const TabButton = ({ active, onClick, children, icon: Icon }) => (
    <div
        onClick={onClick}
        style={{
            padding: '1rem 0',
            color: active ? '#6366f1' : '#888',
            borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: active ? 600 : 400
        }}
    >
        {Icon && <Icon size={16} />}
        {children}
    </div>
);

export default AdvancedTaskDetail;
