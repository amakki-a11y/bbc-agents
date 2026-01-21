import http from "./http";

export async function fetchTaskDetails(taskId) {
    const { data } = await http.get(`/tasks/details/${taskId}`);
    return data;
}

export async function createActionItem(taskId, { content, assignee_id = null }) {
    const { data } = await http.post(`/tasks/details/${taskId}/action-items`, {
        content,
        assignee_id,
    });
    return data;
}

export async function updateActionItem(actionItemId, patch) {
    const { data } = await http.put(
        `/tasks/details/action-items/${actionItemId}`,
        patch
    );
    return data;
}

export async function deleteActionItem(actionItemId) {
    const { data } = await http.delete(
        `/tasks/details/action-items/${actionItemId}`
    );
    return data;
}

// Subtask API functions
export async function createSubtask(taskId, { title }) {
    const { data } = await http.post(`/tasks/details/${taskId}/subtasks`, {
        title,
    });
    return data;
}

export async function updateSubtask(subtaskId, patch) {
    const { data } = await http.put(
        `/tasks/details/subtasks/${subtaskId}`,
        patch
    );
    return data;
}

export async function deleteSubtask(subtaskId) {
    const { data } = await http.delete(
        `/tasks/details/subtasks/${subtaskId}`
    );
    return data;
}
