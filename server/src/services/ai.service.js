const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'needs_to_be_provided_by_user') {
        console.warn("OPENAI_API_KEY is missing or invalid. Returning mock response.");
        // Mock response for testing without billable key
        if (commandText.includes("milk")) {
            return { action: "create", entity: "task", data: { title: "Buy milk", due_date: null } };
        }
        throw new Error("OpenAI API Key missing");
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: commandText },
            ],
            temperature: 0,
        });

        const content = response.choices[0].message.content.trim();
        // Strip code blocks if present
        const jsonStr = content.replace(/^```json/, '').replace(/```$/, '');
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Parse Error:", error);
        throw new Error("Failed to process AI command");
    }
};

module.exports = { parseCommand };
