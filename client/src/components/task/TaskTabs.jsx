import React from 'react';

const TaskTabs = ({ activeTab, setActiveTab, counts = {} }) => {
    const tabs = [
        {
            id: 'details',
            label: 'Details',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: 'subtasks',
            label: 'Subtasks',
            count: counts.subtasks || 0,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            id: 'actionItems',
            label: 'Action Items',
            count: counts.actionItems || 0,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            )
        }
    ];

    return (
        <div className="border-b border-gray-200 bg-white">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                transition-colors duration-150
                ${isActive
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`
                  ml-1 py-0.5 px-2 rounded-full text-xs font-medium
                  ${isActive
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                    }
                `}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default TaskTabs;