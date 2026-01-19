import { FileText, ListChecks, Zap } from 'lucide-react';

const TaskTabs = ({ activeTab, setActiveTab, counts = {} }) => {
    const tabs = [
        {
            id: 'details',
            label: 'Details',
            icon: FileText
        },
        {
            id: 'subtasks',
            label: 'Subtasks',
            count: counts.subtasks || 0,
            icon: ListChecks
        },
        {
            id: 'actionItems',
            label: 'Action Items',
            count: counts.actionItems || 0,
            icon: Zap
        }
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '1rem'
        }}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: isActive ? '2px solid #4f46e5' : '2px solid transparent',
                            marginBottom: '-1px',
                            fontSize: '0.9rem',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? '#4f46e5' : '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.borderBottomColor = '#d1d5db';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.color = '#6b7280';
                                e.currentTarget.style.borderBottomColor = 'transparent';
                            }
                        }}
                    >
                        <Icon
                            size={16}
                            style={{
                                color: isActive ? '#4f46e5' : '#9ca3af'
                            }}
                        />
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '20px',
                                height: '20px',
                                padding: '0 6px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background: isActive ? '#eef2ff' : '#f3f4f6',
                                color: isActive ? '#4f46e5' : '#6b7280'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default TaskTabs;
