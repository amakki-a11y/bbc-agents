const Anthropic = require('@anthropic-ai/sdk');

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

const parseCommand = async (commandText) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.warn("ANTHROPIC_API_KEY is missing. Returning mock response.");
        // Mock response for testing without API key
        if (commandText.toLowerCase().includes("milk")) {
            return { action: "create", entity: "task", data: { title: "Buy milk", due_date: null } };
        }
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
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Parse Error:", error);
        throw new Error("Failed to process AI command");
    }
};

module.exports = { parseCommand };
