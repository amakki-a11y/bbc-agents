const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Tool definitions for Claude to use
 */
const toolDefinitions = [
    {
        name: 'createTask',
        description: 'Create a new task for the employee. Use this when the employee wants to create, add, or set up a new task.',
        input_schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'The title of the task'
                },
                description: {
                    type: 'string',
                    description: 'Optional description of the task'
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Priority level of the task (defaults to medium)'
                },
                due_date: {
                    type: 'string',
                    description: 'Due date in ISO format (e.g., 2024-01-15) or relative (e.g., tomorrow, next monday)'
                }
            },
            required: ['title']
        }
    },
    {
        name: 'checkIn',
        description: 'Record employee check-in/arrival at work. Use when employee says things like "I\'m here", "check me in", "I arrived", "good morning" with intent to log arrival.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'checkOut',
        description: 'Record employee check-out/departure from work. Use when employee says things like "I\'m leaving", "check me out", "bye", "logging off", "going home".',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'requestLeave',
        description: 'Submit a leave/time-off request. Use when employee wants to take a day off, request vacation, sick leave, or any absence.',
        input_schema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'The date for leave in ISO format or relative (e.g., tomorrow, Friday, 2024-01-20)'
                },
                reason: {
                    type: 'string',
                    description: 'Reason for the leave request'
                }
            },
            required: ['date', 'reason']
        }
    },
    {
        name: 'messageManager',
        description: 'Send a message to the employee\'s direct manager. Use when employee wants to communicate with, notify, or inform their manager about something.',
        input_schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The message content to send to the manager'
                }
            },
            required: ['content']
        }
    },
    {
        name: 'messageHR',
        description: 'Send a message to the HR department. Use when employee wants to report issues, ask HR questions, or communicate with Human Resources.',
        input_schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The message content to send to HR'
                }
            },
            required: ['content']
        }
    },
    {
        name: 'getMyTasks',
        description: 'Retrieve the employee\'s current task list. Use when employee asks about their tasks, todos, work items, or what they need to do.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'getMyAttendance',
        description: 'Get the employee\'s attendance records. Use when employee asks about their attendance, check-ins, punctuality, or work hours.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    }
];

/**
 * Build system prompt with employee context
 */
const buildSystemPrompt = (context) => {
    const tasksInfo = context.tasks.length > 0
        ? context.tasks.map(t => {
            const due = t.due_date ? ` (Due: ${new Date(t.due_date).toLocaleDateString()})` : '';
            return `- ${t.title} [${t.status}] [${t.priority || 'medium'} priority]${due}`;
        }).join('\n')
        : 'No pending tasks';

    const attendanceInfo = context.attendance.length > 0
        ? context.attendance.map(a => {
            const date = new Date(a.date).toLocaleDateString();
            const checkIn = a.check_in ? new Date(a.check_in).toLocaleTimeString() : 'N/A';
            const checkOut = a.check_out ? new Date(a.check_out).toLocaleTimeString() : 'N/A';
            return `- ${date}: ${a.status} (In: ${checkIn}, Out: ${checkOut})`;
        }).join('\n')
        : 'No attendance records this week';

    const managerInfo = context.manager
        ? `${context.manager.name} (${context.manager.email})`
        : 'Not assigned';

    return `You are BBC Assistant, an AI assistant for BBC Agents company. You help employees with their work-related questions and tasks.

CURRENT EMPLOYEE INFORMATION:
- Name: ${context.employee.name}
- Email: ${context.employee.email}
- Department: ${context.department.name}
- Role: ${context.role.name}
- Status: ${context.employee.status}
- Hire Date: ${new Date(context.employee.hire_date).toLocaleDateString()}
- Manager: ${managerInfo}

PENDING TASKS (${context.tasks.length}):
${tasksInfo}

THIS WEEK'S ATTENDANCE:
${attendanceInfo}

UNREAD MESSAGES: ${context.unreadMessages}

YOUR CAPABILITIES - USE TOOLS TO PERFORM ACTIONS:
1. **createTask** - Create tasks for the employee (e.g., "Create a task to finish the report by Friday")
2. **checkIn** - Record check-in when employee arrives (e.g., "I'm here", "check me in")
3. **checkOut** - Record check-out when employee leaves (e.g., "I'm leaving", "check me out")
4. **requestLeave** - Submit leave requests (e.g., "I need Friday off for a doctor appointment")
5. **messageManager** - Send messages to employee's manager (e.g., "Tell my manager I'll be late")
6. **messageHR** - Send messages to HR department (e.g., "Report to HR about the broken AC")
7. **getMyTasks** - Show employee's tasks when asked
8. **getMyAttendance** - Show attendance records when asked

IMPORTANT TOOL USAGE RULES:
- When the employee wants to perform an action, USE THE APPROPRIATE TOOL - don't just describe what you would do
- For check-in: Use checkIn tool when employee says "I'm here", "check me in", "good morning I'm arriving", etc.
- For check-out: Use checkOut tool when employee says "I'm leaving", "bye", "logging off", "going home", etc.
- For tasks: Use createTask tool when employee says "create a task", "add a todo", "remind me to", etc.
- For leave: Use requestLeave tool for any day off, vacation, sick leave requests
- For messaging: Use messageManager/messageHR when employee wants to communicate with them
- Always confirm the action AFTER using the tool, not before

GUIDELINES:
- Be friendly but professional
- Keep responses concise (2-4 sentences for simple questions)
- Use the employee's name occasionally to personalize
- ALWAYS use tools when the employee requests an action - don't just say you will do something
- After using a tool, confirm what was done based on the tool result
- If you don't have information about something, be honest about it
- Format lists and important information clearly
- Use markdown formatting for better readability (bold for emphasis, bullet points for lists)`;
};

/**
 * Generate AI response using Claude with tool support
 */
const generateAIResponse = async (userMessage, context, actionHandler = null) => {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('ANTHROPIC_API_KEY not configured, using mock response');
        return null;
    }

    try {
        const systemPrompt = buildSystemPrompt(context);
        const messages = [
            {
                role: 'user',
                content: userMessage
            }
        ];

        // Initial response with tools
        let response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
            tools: toolDefinitions
        });

        const toolResults = [];
        let finalTextContent = '';

        // Process response - handle tool use if needed
        while (response.stop_reason === 'tool_use') {
            // Find all tool use blocks
            const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');

            // Collect any text content before tool use
            const textBlock = response.content.find(block => block.type === 'text');
            if (textBlock) {
                finalTextContent += textBlock.text;
            }

            // Execute each tool and collect results
            const toolResultsForMessage = [];
            for (const toolUse of toolUseBlocks) {
                let toolResult;

                if (actionHandler) {
                    // Execute the tool using the provided handler
                    toolResult = await actionHandler(toolUse.name, toolUse.input);
                    toolResults.push({
                        tool: toolUse.name,
                        input: toolUse.input,
                        result: toolResult
                    });
                } else {
                    // No handler provided - return tool info for external handling
                    toolResult = { success: false, error: 'No action handler provided' };
                }

                toolResultsForMessage.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(toolResult)
                });
            }

            // Add assistant message and tool results to conversation
            messages.push({
                role: 'assistant',
                content: response.content
            });
            messages.push({
                role: 'user',
                content: toolResultsForMessage
            });

            // Continue the conversation
            response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                system: systemPrompt,
                messages,
                tools: toolDefinitions
            });
        }

        // Extract final text from response
        const textContent = response.content.find(block => block.type === 'text');
        if (textContent) {
            finalTextContent += textContent.text;
        }

        if (finalTextContent) {
            return {
                content: finalTextContent,
                messageType: determineMessageType(userMessage, finalTextContent),
                metadata: {
                    action: toolResults.length > 0 ? 'tool_executed' : 'ai_response',
                    model: 'claude-3-haiku-20240307',
                    inputTokens: response.usage?.input_tokens,
                    outputTokens: response.usage?.output_tokens,
                    toolsUsed: toolResults.length > 0 ? toolResults : undefined
                }
            };
        }

        return null;
    } catch (error) {
        console.error('Claude API error:', error.message);

        // Return null to trigger fallback to mock response
        return null;
    }
};

/**
 * Determine message type based on content
 */
const determineMessageType = (userMessage, aiResponse) => {
    const lowerUser = userMessage.toLowerCase();
    const lowerAI = aiResponse.toLowerCase();

    if (lowerUser.includes('report') || lowerUser.includes('notify') || lowerAI.includes('i will notify')) {
        return 'report';
    }
    if (lowerUser.includes('request') || lowerUser.includes('please') || lowerAI.includes('request')) {
        return 'request';
    }
    if (lowerAI.includes('announcement') || lowerAI.includes('everyone')) {
        return 'announcement';
    }
    return 'question';
};

module.exports = {
    generateAIResponse,
    buildSystemPrompt,
    toolDefinitions
};
