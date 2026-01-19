import StatusField from './StatusField';
import DatesField from './DatesField';
import TimeEstimateField from './TimeEstimateField';
import TagsField from './TagsField';
import AssigneesField from './AssigneesField';
import PriorityField from './PriorityField';
import TrackTimeField from './TrackTimeField';
import RelationshipsField from './RelationshipsField';

const TaskPropertiesGrid = ({ task, onUpdate, onTaskRefresh }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            marginBottom: '2rem',
            padding: '1.25rem',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #f3f4f6'
        }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <StatusField status={task.status} onUpdate={(val) => onUpdate('status', val)} />
                <DatesField startDate={task.start_date} dueDate={task.due_date} onUpdate={onUpdate} />
                <TimeEstimateField estimate={task.time_estimate} onUpdate={(val) => onUpdate('time_estimate', val)} />
                <TagsField tags={task.tags} onUpdate={(val) => onUpdate('tags', val)} />
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AssigneesField assignee={task.assignee} onUpdate={(val) => onUpdate('assignee', val)} />
                <PriorityField priority={task.priority} onUpdate={(val) => onUpdate('priority', val)} />
                <TrackTimeField
                    taskId={task.id}
                    timeEntries={task.timeEntries || []}
                    onTaskRefresh={onTaskRefresh}
                />
                <RelationshipsField
                    taskId={task.id}
                    blockedBy={task.blockedBy || []}
                    blocking={task.blocking || []}
                    onTaskRefresh={onTaskRefresh}
                />
            </div>
        </div>
    );
};

export default TaskPropertiesGrid;
