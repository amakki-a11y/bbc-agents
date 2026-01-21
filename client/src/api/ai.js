import { http } from './http';

// ==========================================
// PROJECT PLANNING
// ==========================================

/**
 * Generate a project plan from a goal description
 */
export const generatePlan = async (goal, context = {}) => {
    const response = await http.post('/ai/plan', { goal, context });
    return response.data;
};

/**
 * Create a project from an AI-generated plan
 */
export const createProjectFromPlan = async (plan) => {
    const response = await http.post('/ai/plan/create', { plan });
    return response.data;
};

/**
 * Send a natural language command to the AI
 */
export const sendCommand = async (command) => {
    const response = await http.post('/ai/command', { command });
    return response.data;
};

// ==========================================
// AI ASSIST
// ==========================================

/**
 * Get AI assistance for a project
 * @param {number} projectId - The project ID
 * @param {string} question - Optional question (defaults to status/priorities)
 */
export const assistProject = async (projectId, question = null) => {
    const response = await http.post(`/ai/project/${projectId}/assist`, { question });
    return response.data;
};

/**
 * Generate subtasks for a task
 * @param {number} taskId - The task ID
 * @param {number} count - Number of subtasks to generate (default 5)
 */
export const generateSubtasks = async (taskId, count = 5) => {
    const response = await http.post(`/ai/task/${taskId}/subtasks`, { count });
    return response.data;
};

/**
 * Save generated subtasks to database
 */
export const saveSubtasks = async (taskId, subtasks) => {
    const response = await http.post(`/ai/task/${taskId}/subtasks/save`, { subtasks });
    return response.data;
};

// ==========================================
// RISK MONITORING
// ==========================================

/**
 * Get risk summary for all user projects
 */
export const getRiskSummary = async () => {
    const response = await http.get('/ai/risks/summary');
    return response.data;
};

/**
 * Scan a project for risks
 */
export const scanProjectRisks = async (projectId) => {
    const response = await http.post(`/ai/project/${projectId}/scan`);
    return response.data;
};

/**
 * Toggle AI monitoring for a project
 */
export const toggleProjectMonitoring = async (projectId, enabled) => {
    const response = await http.post(`/ai/project/${projectId}/monitoring`, { enabled });
    return response.data;
};

export default {
    generatePlan,
    createProjectFromPlan,
    sendCommand,
    assistProject,
    generateSubtasks,
    saveSubtasks,
    getRiskSummary,
    scanProjectRisks,
    toggleProjectMonitoring
};
