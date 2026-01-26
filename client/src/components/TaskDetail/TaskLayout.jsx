import { X, MoreHorizontal, Maximize2, Share2, ChevronRight, Home } from 'lucide-react';

const TaskLayout = ({ children, onClose, projectName = 'Project', taskId = '' }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{
                width: '95%', maxWidth: '1400px', height: '90vh',
                display: 'flex', flexDirection: 'column',
                backgroundColor: '#1E1E2E', // Deep dark blue/gray like screenshot
                padding: 0,
                borderRadius: '12px',
                border: '1px solid #333',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }}>

                {/* Header Bar */}
                <div style={{
                    height: '50px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1rem',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Home size={14} /> Projects</span>
                        <ChevronRight size={14} />
                        <span>{projectName}</span>
                        {taskId && <span style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#aaa', marginLeft: '0.5rem' }}>TASK-{taskId}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="icon-btn"><Share2 size={16} /></button>
                        <button className="icon-btn"><Maximize2 size={16} /></button>
                        <button className="icon-btn"><MoreHorizontal size={16} /></button>
                        <div style={{ width: '1px', height: '20px', background: '#444', margin: '0 8px' }}></div>
                        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default TaskLayout;
