const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

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

YOUR CAPABILITIES:
1. Answer questions about the employee's tasks, schedule, and attendance
2. Provide information about their department, role, and manager
3. Help with work-related queries
4. Offer to route messages to their manager or HR when appropriate
5. Be helpful, professional, and concise

GUIDELINES:
- Be friendly but professional
- Keep responses concise (2-4 sentences for simple questions)
- Use the employee's name occasionally to personalize
- If asked about tasks, reference their actual pending tasks
- If asked about attendance, use their actual attendance data
- For requests that require action (like reporting absence), confirm what you'll do
- If you don't have information about something, be honest about it
- Format lists and important information clearly
- Use markdown formatting for better readability (bold for emphasis, bullet points for lists)`;
};

/**
 * Generate AI response using Claude
 */
const generateAIResponse = async (userMessage, context) => {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('ANTHROPIC_API_KEY not configured, using mock response');
        return null;
    }

    try {
        const systemPrompt = buildSystemPrompt(context);

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });

        // Extract text from response
        const textContent = response.content.find(block => block.type === 'text');
        if (textContent) {
            return {
                content: textContent.text,
                messageType: determineMessageType(userMessage, textContent.text),
                metadata: {
                    action: 'ai_response',
                    model: 'claude-3-haiku-20240307',
                    inputTokens: response.usage?.input_tokens,
                    outputTokens: response.usage?.output_tokens
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
    buildSystemPrompt
};
