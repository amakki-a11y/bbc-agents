import { http } from './http';

/**
 * Generate a project plan from a goal description
 * @param {string} goal - The project goal/description
 * @param {Object} context - Optional context (teamSize, deadline, constraints)
 * @returns {Promise<Object>} The generated plan
 */
export const generatePlan = async (goal, context = {}) => {
    const response = await http.post('/ai/plan', { goal, context });
    return response.data;
};

/**
 * Create a project from an AI-generated plan
 * @param {Object} plan - The plan object with name, description, and tasks
 * @returns {Promise<Object>} The created project and tasks
 */
export const createProjectFromPlan = async (plan) => {
    const response = await http.post('/ai/plan/create', { plan });
    return response.data;
};

/**
 * Send a natural language command to the AI
 * @param {string} command - The command text
 * @returns {Promise<Object>} The command result
 */
export const sendCommand = async (command) => {
    const response = await http.post('/ai/command', { command });
    return response.data;
};

export default {
    generatePlan,
    createProjectFromPlan,
    sendCommand
};
