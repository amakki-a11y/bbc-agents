import StatusField from './StatusField';
import DatesField from './DatesField';
import TimeEstimateField from './TimeEstimateField';
import TagsField from './TagsField';
import AssigneesField from './AssigneesField';
import PriorityField from './PriorityField';
import TrackTimeField from './TrackTimeField';
import RelationshipsField from './RelationshipsField';

const TaskPropertiesGrid = ({ task, onUpdate }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '1.5rem' }}>
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
                <TrackTimeField />
                <RelationshipsField />
            </div>
        </div>
    );
};

export default TaskPropertiesGrid;
