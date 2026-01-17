import { X, Bot, ChevronDown, Link, MoreHorizontal } from 'lucide-react';

const TaskDetailsHeader = ({ task, onClose }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.8rem 1.5rem',
            borderBottom: '1px solid #e0e0e0',
            background: 'white',
            flexShrink: 0
        }}>
            {/* Left Side: Type, ID, Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: 600, color: '#555', cursor: 'pointer'
                }}>
                    <div style={{ width: 8, height: 8, background: '#7b68ee', borderRadius: '2px' }} />
                    TASK
                    <ChevronDown size={14} />
                </div>

                <div style={{ fontSize: '0.8rem', color: '#999', cursor: 'pointer' }}>
                    #{task.id}
                </div>

                <div style={{ width: '1px', height: '16px', background: '#e0e0e0' }} />

                <button style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(90deg, #7b68ee, #b721ff)',
                    border: 'none', color: 'white', padding: '4px 10px',
                    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                }}>
                    <Bot size={14} />
                    Ask AI
                </button>
            </div>

            {/* Right Side: Actions, Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#777' }}>Share</div>
                <button className="icon-btn"><Link size={16} /></button>
                <button className="icon-btn"><MoreHorizontal size={16} /></button>
                <div style={{ width: '1px', height: '16px', background: '#e0e0e0', margin: '0 0.5rem' }} />
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                >
                    <X size={24} />
                </button>
            </div>
            <style>{`
                .icon-btn { background: none; border: none; cursor: pointer; color: #777; padding: 4px; display: flex; alignItems: center; }
                .icon-btn:hover { background: #f5f5f5; border-radius: 4px; color: #333; }
            `}</style>
        </div>
    );
};

export default TaskDetailsHeader;
