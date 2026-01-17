/**
 * TaskDetailModal.jsx
 * 
 * This component serves as a wrapper around the AdvancedTaskDetail component,
 * connecting it to the ProjectContext for global state management.
 * 
 * The refactoring extracts the detailed task view logic into:
 * - AdvancedTaskDetail: Main layout with tabs (Details, Subtasks, Action Items)
 * - PropertyGrid: Displays task properties (status, priority, dates, etc.)
 * - ActivityPanel: Shows activity log and allows adding comments
 * - TaskLayout: Modal overlay and header structure
 * 
 * Props:
 * - task: The task object to display/edit
 * - onClose: Callback to close the modal
 */

import { useProject } from '../context/ProjectContext';
import AdvancedTaskDetail from './TaskDetail/AdvancedTaskDetail';

const TaskDetailModal = ({ task, onClose }) => {
    const { updateTask } = useProject();

    // The updateTask from ProjectContext accepts (taskId, updates)
    // AdvancedTaskDetail expects onUpdate(taskId, updates) - signatures match
    return (
        <AdvancedTaskDetail
            task={task}
            onClose={onClose}
            onUpdate={updateTask}
        />
    );
};

export default TaskDetailModal;
