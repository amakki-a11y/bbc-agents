import { Calendar, Clock, Tag, Flag, Users, PlusCircle, Share2 } from 'lucide-react';

const PropertyRow = ({ icon: Icon, label, value, onClick }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        <div style={{ width: '140px', display: 'flex', alignItems: 'center', color: '#888', gap: '0.5rem' }}>
            <Icon size={16} /> {label}
        </div>
        <div style={{ flex: 1, color: '#ddd', cursor: 'pointer' }} onClick={onClick}>
            {value || <span style={{ color: '#555', fontStyle: 'italic' }}>Empty</span>}
        </div>
    </div>
);

const PropertyGrid = ({ task, onUpdate }) => {
    const handleChange = (field, value) => {
        onUpdate({ [field]: value });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Left Column Properties */}
            <div>
                <PropertyRow icon={Flag} label="Status"
                    value={
                        <select
                            value={task.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="todo">TO DO</option>
                            <option value="in-progress">IN PROGRESS</option>
                            <option value="done">DONE</option>
                        </select>
                    }
                />
                <PropertyRow icon={Calendar} label="Dates" value={
                    <input
                        type="date"
                        value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleChange('due_date', e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
                    />
                } />
                <PropertyRow icon={Clock} label="Time Estimate" value={
                    <input
                        type="number"
                        placeholder="Empty"
                        value={task.time_estimate || ''}
                        onChange={(e) => handleChange('time_estimate', e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#ddd', width: '100px', outline: 'none' }}
                    />
                } />
                <PropertyRow icon={Tag} label="Tags" value={
                    <input
                        type="text"
                        placeholder="Empty"
                        value={task.tags || ''}
                        onChange={(e) => handleChange('tags', e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#ddd', width: '100%', outline: 'none' }}
                    />
                } />
            </div>

            {/* Right Column Properties */}
            <div>
                <PropertyRow icon={Users} label="Assignees" value={<div className="avatar-circle">MT</div>} />
                <PropertyRow icon={Flag} label="Priority" value={
                    <select
                        value={task.priority || ''}
                        onChange={(e) => handleChange('priority', e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#eab308' : '#ddd', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="">Empty</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                    </select>
                } />
                <PropertyRow icon={Clock} label="Track Time" value={<button style={{ background: '#333', border: 'none', color: '#aaa', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><PlusCircle size={12} /> Add time</button>} />
                <PropertyRow icon={Share2} label="Relationships" value="Empty" />
            </div>

            <style>{`
            .avatar-circle {
                width: 24px; height: 24px; background: #6366f1; border-radius: 50%; 
                display: flex; alignItems: center; justifyContent: center; font-size: 10px; font-weight: bold;
            }
            select option { background: #1E1E2E; color: white; }
        `}</style>
        </div>
    );
};

export default PropertyGrid;
