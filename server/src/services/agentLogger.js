const prisma = require('../lib/prisma');

/**
 * Log an AI agent decision for tracking and debugging
 * Handles errors gracefully - won't crash the app if logging fails
 *
 * @param {Object} params
 * @param {string} params.agentName - Name of the AI agent (e.g., "SchedulerBot")
 * @param {string} params.agentVersion - Optional version string
 * @param {string} params.action - Action performed (e.g., "auto_schedule")
 * @param {string} params.entityType - Type of entity affected (e.g., "task")
 * @param {number} params.entityId - ID of affected entity
 * @param {string} params.reasoning - AI's explanation for the decision (REQUIRED)
 * @param {number} params.confidenceScore - Confidence level 0.0-1.0
 * @param {Object} params.inputContext - The prompt/context given to AI
 * @param {Object} params.outputData - The structured output/decision
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.status - success, failed, flagged_for_review, rolled_back
 * @param {string} params.errorMessage - Error details if failed
 * @param {number} params.executionTime - Milliseconds taken
 * @returns {Promise<Object|null>} The created AgentAction or null if failed
 */
const logAgentDecision = async ({
    agentName,
    agentVersion = null,
    action,
    entityType,
    entityId = null,
    reasoning,
    confidenceScore,
    inputContext = null,
    outputData = null,
    metadata = null,
    status = 'success',
    errorMessage = null,
    executionTime = null
}) => {
    try {
        // Validate required fields
        if (!agentName || !action || !entityType || !reasoning || confidenceScore === undefined) {
            console.error('AgentLogger: Missing required fields', {
                agentName,
                action,
                entityType,
                reasoning: !!reasoning,
                confidenceScore
            });
            return null;
        }

        // Validate confidence score range
        const normalizedConfidence = Math.max(0, Math.min(1, confidenceScore));

        // Auto-flag low confidence decisions for review
        const finalStatus = normalizedConfidence < 0.5 && status === 'success'
            ? 'flagged_for_review'
            : status;

        const agentAction = await prisma.agentAction.create({
            data: {
                agent_name: agentName,
                agent_version: agentVersion,
                action,
                entity_type: entityType,
                entity_id: entityId,
                reasoning,
                confidence_score: normalizedConfidence,
                input_context: inputContext,
                output_data: outputData,
                metadata,
                status: finalStatus,
                error_message: errorMessage,
                execution_time: executionTime
            }
        });

        // Log warning for low confidence decisions
        if (normalizedConfidence < 0.7) {
            console.warn(`AgentLogger: Low confidence decision by ${agentName}`, {
                action,
                confidence: normalizedConfidence,
                id: agentAction.id
            });
        }

        return agentAction;
    } catch (error) {
        // Don't crash the app - just log the error
        console.error('AgentLogger: Failed to log agent decision', error);
        return null;
    }
};

/**
 * Log a successful AI agent action
 */
const logSuccess = async (agentName, action, entityType, entityId, reasoning, confidenceScore, options = {}) => {
    return logAgentDecision({
        agentName,
        action,
        entityType,
        entityId,
        reasoning,
        confidenceScore,
        status: 'success',
        ...options
    });
};

/**
 * Log a failed AI agent action
 */
const logFailure = async (agentName, action, entityType, reasoning, errorMessage, options = {}) => {
    return logAgentDecision({
        agentName,
        action,
        entityType,
        reasoning,
        confidenceScore: 0,
        status: 'failed',
        errorMessage,
        ...options
    });
};

/**
 * Log an action that needs human review
 */
const logForReview = async (agentName, action, entityType, entityId, reasoning, confidenceScore, options = {}) => {
    return logAgentDecision({
        agentName,
        action,
        entityType,
        entityId,
        reasoning,
        confidenceScore,
        status: 'flagged_for_review',
        ...options
    });
};

/**
 * Wrap an AI operation with automatic logging
 * @param {Object} config - Agent and action configuration
 * @param {Function} operation - The async function to execute
 * @returns {Promise<Object>} Result with data and agentAction
 */
const withAgentLogging = async (config, operation) => {
    const startTime = Date.now();
    let result = null;
    let error = null;

    try {
        result = await operation();
    } catch (err) {
        error = err;
    }

    const executionTime = Date.now() - startTime;

    const agentAction = await logAgentDecision({
        ...config,
        status: error ? 'failed' : 'success',
        errorMessage: error?.message,
        executionTime,
        outputData: result
    });

    if (error) throw error;

    return { data: result, agentAction };
};

module.exports = {
    logAgentDecision,
    logSuccess,
    logFailure,
    logForReview,
    withAgentLogging
};
