const Anthropic = require('@anthropic-ai/sdk');
const agentLogger = require('./agentLogger');

// Lazy initialization - only create client when needed
let anthropic = null;

const getClient = () => {
    if (!anthropic && process.env.ANTHROPIC_API_KEY) {
        anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
    }
    return anthropic;
};

const SYSTEM_PROMPT = `
You are a smart planner assistant. Your goal is to convert user natural language commands into structured JSON actions for a task manager and calendar app.
The current date is ${new Date().toISOString()}.

Supported Entities: "task", "event"
Supported Actions: "create", "update", "delete"

Output JSON Schema:
{
  "action": "create" | "update" | "delete",
  "entity": "task" | "event",
  "data": {
    // For Task Create:
    "title": string,
    "due_date": string (ISO 8601) | null,

    // For Event Create:
    "title": string,
    "start_time": string (ISO 8601),
    "end_time": string (ISO 8601),
    "description": string | null

    // For Update/Delete, try to identify by simple criteria if possible, but for v1 we might just return the intent and let the controller handle logic or ask for ID.
    // IMPORTANT: For this version, we will only support CREATE via strict AI. Update/Delete might require ID context which we don't have here yet.
    // If the user asks to update/delete, just return action="unknown" for now unless you are very sure.
  }
}

Rules:
- If due_date is not specified for a task, set it to null.
- If duration is not specified for an event, assume 1 hour.
- Return ONLY valid JSON. No markdown formatting.
`;

const PROJECT_PLANNER_PROMPT = `
You are an expert Project Manager AI. Your task is to break down a user's project goal into a structured, actionable plan.

Given a project description, create a comprehensive plan with 5-10 tasks that cover the full scope of the project.

Output JSON Schema:
{
  "name": string,           // A concise project name
  "description": string,    // A brief summary of the project scope
  "tasks": [
    {
      "title": string,              // Clear, actionable task title
      "description": string,        // What needs to be done
      "time_estimate": number,      // Estimated time in MINUTES
      "priority": "high" | "medium" | "low",
      "dependencies": []            // Array of task indices this depends on (0-indexed)
    }
  ],
  "total_estimated_time": number,   // Sum of all task estimates in minutes
  "complexity": "simple" | "moderate" | "complex"
}

Rules:
- Break down into 5-10 specific, actionable tasks
- Time estimates should be realistic (in minutes)
- Order tasks logically (dependencies first)
- Include setup, implementation, testing, and documentation phases where relevant
- Return ONLY valid JSON. No markdown formatting.
`;

const parseCommand = async (commandText) => {
    const startTime = Date.now();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        console.warn("ANTHROPIC_API_KEY is missing. Returning mock response.");
        // Mock response for testing without API key
        if (commandText.toLowerCase().includes("milk")) {
            const mockResult = { action: "create", entity: "task", data: { title: "Buy milk", due_date: null } };

            // Log mock response
            await agentLogger.logSuccess(
                'CommandParser',
                'parse_command',
                'command',
                null,
                'Mock response returned - API key missing',
                0.5,
                { inputContext: { commandText }, outputData: mockResult }
            );

            return mockResult;
        }

        await agentLogger.logFailure(
            'CommandParser',
            'parse_command',
            'command',
            'API key validation failed',
            'Anthropic API Key missing'
        );
        throw new Error("Anthropic API Key missing");
    }

    try {
        const client = getClient();
        const response = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                { role: "user", content: commandText },
            ],
        });

        const content = response.content[0].text.trim();
        // Strip code blocks if present
        const jsonStr = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const result = JSON.parse(jsonStr);

        const executionTime = Date.now() - startTime;

        // Log successful AI decision
        await agentLogger.logSuccess(
            'CommandParser',
            'parse_command',
            result.entity || 'command',
            null,
            `Parsed "${commandText}" into ${result.action} ${result.entity} action`,
            0.9,
            {
                inputContext: { commandText },
                outputData: result,
                executionTime
            }
        );

        return result;
    } catch (error) {
        const executionTime = Date.now() - startTime;

        // Log AI failure
        await agentLogger.logFailure(
            'CommandParser',
            'parse_command',
            'command',
            `Failed to parse command: "${commandText}"`,
            error.message,
            { inputContext: { commandText }, executionTime }
        );

        console.error("AI Parse Error:", error);
        throw new Error("Failed to process AI command");
    }
};

/**
 * Generate a full project plan from a goal description
 * @param {string} goal - The project goal/description
 * @param {Object} context - Optional context (team size, deadline, etc.)
 * @returns {Object} Project plan with tasks and time estimates
 */
const generateProjectPlan = async (goal, context = {}) => {
    const startTime = Date.now();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        console.warn("ANTHROPIC_API_KEY is missing. Returning mock project plan.");

        // Mock response for testing without API key
        const mockPlan = {
            name: "Sample Project",
            description: `Project based on: ${goal}`,
            tasks: [
                { title: "Research & Planning", description: "Gather requirements and plan approach", time_estimate: 120, priority: "high", dependencies: [] },
                { title: "Setup Environment", description: "Configure development environment", time_estimate: 60, priority: "high", dependencies: [0] },
                { title: "Core Implementation", description: "Build the main functionality", time_estimate: 240, priority: "high", dependencies: [1] },
                { title: "Testing", description: "Write and run tests", time_estimate: 90, priority: "medium", dependencies: [2] },
                { title: "Documentation", description: "Document the solution", time_estimate: 60, priority: "low", dependencies: [2] },
                { title: "Review & Deploy", description: "Final review and deployment", time_estimate: 60, priority: "medium", dependencies: [3, 4] }
            ],
            total_estimated_time: 630,
            complexity: "moderate"
        };

        await agentLogger.logSuccess(
            'ProjectPlanner',
            'generate_plan',
            'project',
            null,
            'Mock project plan generated - API key missing',
            0.5,
            { inputContext: { goal, context }, outputData: mockPlan }
        );

        return mockPlan;
    }

    try {
        const client = getClient();

        // Build the user message with context if provided
        let userMessage = `Create a project plan for: ${goal}`;
        if (context.teamSize) userMessage += `\nTeam size: ${context.teamSize}`;
        if (context.deadline) userMessage += `\nDeadline: ${context.deadline}`;
        if (context.constraints) userMessage += `\nConstraints: ${context.constraints}`;

        const response = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            system: PROJECT_PLANNER_PROMPT,
            messages: [
                { role: "user", content: userMessage },
            ],
        });

        const content = response.content[0].text.trim();
        // Strip code blocks if present
        let jsonStr = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').replace(/^```\s*/, '');

        // Fix common JSON issues from AI responses
        // Remove trailing commas before } or ]
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        let plan;
        try {
            plan = JSON.parse(jsonStr);
        } catch (parseError) {
            // Try to fix common issues
            try {
                // Replace newlines inside strings with spaces
                // This regex finds strings and replaces newlines within them
                const fixedJson = jsonStr.replace(/"([^"\\]|\\.)*"/g, (match) => {
                    return match.replace(/\n/g, ' ').replace(/\r/g, '');
                });
                plan = JSON.parse(fixedJson);
            } catch (secondError) {
                console.error('JSON Parse Error. Raw content (first 1000 chars):', content.substring(0, 1000));
                throw new Error('AI returned invalid JSON: ' + parseError.message);
            }
        }

        const executionTime = Date.now() - startTime;

        // Calculate confidence based on task count and completeness
        const taskCount = plan.tasks?.length || 0;
        const hasEstimates = plan.tasks?.every(t => t.time_estimate > 0);
        const confidence = taskCount >= 5 && taskCount <= 10 && hasEstimates ? 0.9 : 0.7;

        // Log successful plan generation
        await agentLogger.logSuccess(
            'ProjectPlanner',
            'generate_plan',
            'project',
            null,
            `Generated project "${plan.name}" with ${taskCount} tasks (${plan.total_estimated_time || 'N/A'} min total)`,
            confidence,
            {
                inputContext: { goal, context },
                outputData: plan,
                executionTime,
                metadata: {
                    taskCount,
                    complexity: plan.complexity,
                    totalTime: plan.total_estimated_time
                }
            }
        );

        return plan;
    } catch (error) {
        const executionTime = Date.now() - startTime;

        // Log AI failure
        await agentLogger.logFailure(
            'ProjectPlanner',
            'generate_plan',
            'project',
            `Failed to generate plan for goal: "${goal}"`,
            error.message,
            { inputContext: { goal, context }, executionTime }
        );

        console.error("AI Project Plan Error:", error);
        throw new Error("Failed to generate project plan");
    }
};

module.exports = { parseCommand, generateProjectPlan };
