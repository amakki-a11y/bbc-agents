import { useState } from 'react';
import { Bell, Filter, Search } from 'lucide-react';
import ActivityFeed from './ActivityFeed';
import CommentComposer from './CommentComposer';

const ActivityPanel = ({ task, onUpdate }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafafa', borderLeft: '1px solid #e0e0e0' }}>
            {/* Activity Header */}
            <div style={{
                padding: '0.8rem 1rem',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fafafa'
            }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>Activity</div>
                <div style={{ display: 'flex', gap: '0.5rem', color: '#777' }}>
                    <Search size={16} cursor="pointer" />
                    <Filter size={16} cursor="pointer" />
                    <Bell size={16} cursor="pointer" />
                </div>
            </div>

            {/* Scrollable Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <ActivityFeed activity={task.activities || task.activity || []} />
            </div>

            {/* Sticky Comment Composer */}
            <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', background: 'white' }}>
                <CommentComposer onPost={(text) => onUpdate('comment', text)} />
            </div>
        </div>
    );
};

export default ActivityPanel;
