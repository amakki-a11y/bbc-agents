import { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { X, CheckCircle2, Circle } from 'lucide-react';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';
import TaskSubtasks from './TaskSubtasks';
import TaskMetadata from './TaskMetadata';
import TaskDescription from './TaskDescription';

const TaskDetailModal = ({ task, onClose }) => {
    const { updateTask } = useProject();
    const [localTask, setLocalTask] = useState(task);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => { setLocalTask(task); }, [task]);

    const handleUpdate = (field, value) => {
        const updated = { ...localTask, [field]: value };
        setLocalTask(updated);
        updateTask(task.id, { [field]: value });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '80%', maxWidth: '1000px', height: '85vh', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => handleUpdate('status', localTask.status === 'done' ? 'TO DO' : 'done')}
                            style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {localTask.status === 'done' ? <CheckCircle2 size={16} color="#10b981" /> : <Circle size={16} />}
                            {localTask.status}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={24} /></button>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Main Content */}
                    <div style={{ flex: 2, padding: '2rem', overflowY: 'auto', borderRight: '1px solid #eee' }}>
                        <input
                            value={localTask.title}
                            onChange={(e) => handleUpdate('title', e.target.value)}
                            style={{ width: '100%', fontSize: '1.5rem', fontWeight: 600, border: 'none', outline: 'none', marginBottom: '2rem', color: '#1f2937' }}
                        />

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #eee' }}>
                            {['Details', 'Subtasks', 'Activity'].map(tab => (
                                <div
                                    key={tab}
                                    onClick={() => setActiveTab(tab.toLowerCase())}
                                    style={{ paddingBottom: '0.8rem', cursor: 'pointer', borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--primary)' : 'none', color: activeTab === tab.toLowerCase() ? 'var(--primary)' : '#6b7280', fontWeight: 500 }}
                                >
                                    {tab}
                                </div>
                            ))}
                        </div>

                        {activeTab === 'details' && (
                            <TaskDescription
                                description={localTask.description}
                                onUpdate={handleUpdate}
                            />
                        )}

                        {activeTab === 'subtasks' && (
                            <TaskSubtasks />
                        )}

                        {activeTab === 'activity' && (
                            <TaskComments
                                activity={localTask.activity}
                                onAddComment={(text) => handleUpdate('comment', text)}
                            />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div style={{ flex: 1, padding: 0, background: '#f9fafb' }}>
                        <TaskMetadata
                            task={localTask}
                            onUpdate={handleUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
