import TaskTitle from "./TaskTitle";
import AiHelperBar from "./AiHelperBar";
import TaskPropertiesGrid from "./TaskPropertiesGrid";
import DescriptionActions from "./DescriptionActions";
import TaskTabs from "./TaskTabs";
import TaskTabDetails from "./TaskTabDetails";
import TaskTabSubtasks from "./TaskTabSubtasks";

const TaskDetailsMain = ({ task, onUpdate, activeTab, setActiveTab, onTaskRefresh }) => {
    return (
        <div style={{ padding: "0 2rem 2rem 2rem", overflowY: "auto" }}>
            <div style={{ maxWidth: "850px", margin: "0 0" }}>
                <TaskTitle title={task.title} onUpdate={(val) => onUpdate("title", val)} />
                <AiHelperBar />
                <TaskPropertiesGrid task={task} onUpdate={onUpdate} />
                <DescriptionActions />

                {/* Tabs */}
                <TaskTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Details Tab */}
                {activeTab === "details" && <TaskTabDetails task={task} onUpdate={onUpdate} />}

                {/* Subtasks Tab */}
                {activeTab === "subtasks" && (
                    <div style={{ padding: "16px 0" }}>
                        <TaskTabSubtasks
                            taskId={task.id}
                            task={task}
                            onTaskRefresh={onTaskRefresh}
                        />
                    </div>
                )}

                {/* Action Items tab UI is rendered in TaskDetailsPage.jsx */}
            </div>
        </div>
    );
};

export default TaskDetailsMain;
