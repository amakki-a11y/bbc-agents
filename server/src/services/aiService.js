const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Tool definitions for Claude to use
 */
const toolDefinitions = [
    // === TASK MANAGEMENT ===
    {
        name: 'createTask',
        description: 'Create a new task for the employee. Use this when the employee wants to create, add, or set up a new task.',
        input_schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'The title of the task' },
                description: { type: 'string', description: 'Optional description of the task' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level (defaults to medium)' },
                due_date: { type: 'string', description: 'Due date in ISO format or relative (e.g., tomorrow, next monday)' }
            },
            required: ['title']
        }
    },
    {
        name: 'delegateTask',
        description: 'Delegate a task to a team member. Only managers can use this. Use when manager wants to assign work to their subordinate.',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee to delegate to' },
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
                due_date: { type: 'string', description: 'Due date' }
            },
            required: ['employee_name', 'title']
        }
    },
    {
        name: 'getMyTasks',
        description: 'Retrieve the employee\'s current task list. Use when employee asks about their tasks, todos, or work items.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'updateTask',
        description: 'Update/edit an existing task. Use when employee wants to modify, edit, change, or update a task\'s title, description, priority, due date, or status.',
        input_schema: {
            type: 'object',
            properties: {
                task_title: { type: 'string', description: 'Current title of the task to update (used to find the task)' },
                task_id: { type: 'integer', description: 'ID of the task to update (if known)' },
                new_title: { type: 'string', description: 'New title for the task' },
                description: { type: 'string', description: 'New description for the task' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'New priority level' },
                due_date: { type: 'string', description: 'New due date (ISO format or relative like "tomorrow")' },
                status: { type: 'string', enum: ['todo', 'in_progress', 'done'], description: 'New status' }
            },
            required: []
        }
    },
    {
        name: 'deleteTask',
        description: 'Delete/remove a task. Use when employee wants to delete, remove, or cancel a task.',
        input_schema: {
            type: 'object',
            properties: {
                task_title: { type: 'string', description: 'Title of the task to delete (used to find the task)' },
                task_id: { type: 'integer', description: 'ID of the task to delete (if known)' }
            },
            required: []
        }
    },

    // === ATTENDANCE ===
    {
        name: 'checkIn',
        description: 'Record employee check-in/arrival at work. Use when employee says "I\'m here", "check me in", "I arrived".',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'checkOut',
        description: 'Record employee check-out/departure from work. Use when employee says "I\'m leaving", "check me out", "bye".',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getMyAttendance',
        description: 'Get the employee\'s attendance records. Use when employee asks about attendance, check-ins, or work hours.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === LEAVE MANAGEMENT ===
    {
        name: 'requestLeave',
        description: 'Submit a leave/time-off request. Use when employee wants to take a day off, vacation, or sick leave.',
        input_schema: {
            type: 'object',
            properties: {
                start_date: { type: 'string', description: 'Start date for leave' },
                end_date: { type: 'string', description: 'End date for leave (same as start for single day)' },
                leave_type: { type: 'string', description: 'Type of leave (annual, sick, personal, etc.)' },
                reason: { type: 'string', description: 'Reason for the leave request' }
            },
            required: ['start_date', 'reason']
        }
    },
    {
        name: 'getLeaveBalance',
        description: 'Check the employee\'s remaining leave balance. Use when employee asks about vacation days left.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === MESSAGING ===
    {
        name: 'messageManager',
        description: 'Send a message to the employee\'s direct manager.',
        input_schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Message content to send' },
                priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Message priority' }
            },
            required: ['content']
        }
    },
    {
        name: 'messageHR',
        description: 'Send a message to the HR department.',
        input_schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Message content to send' },
                priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Message priority' }
            },
            required: ['content']
        }
    },
    {
        name: 'messageEmployee',
        description: 'Send a message to another employee. Subject to hierarchy permissions (can message: manager, HR, same department colleagues).',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee to message' },
                content: { type: 'string', description: 'Message content' },
                priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'Message priority' }
            },
            required: ['employee_name', 'content']
        }
    },
    {
        name: 'escalateIssue',
        description: 'Escalate an issue up the management chain. Sends to manager, and can chain up to higher management.',
        input_schema: {
            type: 'object',
            properties: {
                issue: { type: 'string', description: 'Description of the issue to escalate' },
                urgency: { type: 'string', enum: ['normal', 'high', 'critical'], description: 'Urgency level' }
            },
            required: ['issue']
        }
    },
    {
        name: 'announceToTeam',
        description: 'Send an announcement to all direct reports. Only managers can use this.',
        input_schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Announcement content' },
                priority: { type: 'string', enum: ['normal', 'high', 'urgent'], description: 'Priority level' }
            },
            required: ['content']
        }
    },
    {
        name: 'checkMessages',
        description: 'Check unread messages and inbox summary.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === MEETINGS ===
    {
        name: 'scheduleMeeting',
        description: 'Schedule a meeting with employees. Use when employee wants to set up a meeting, call, or sync.',
        input_schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Meeting title' },
                attendees: { type: 'string', description: 'Comma-separated names of attendees' },
                date: { type: 'string', description: 'Date for the meeting' },
                time: { type: 'string', description: 'Time for the meeting (e.g., 2pm, 14:00)' },
                duration: { type: 'integer', description: 'Duration in minutes (default 30)' },
                description: { type: 'string', description: 'Meeting description or agenda' }
            },
            required: ['title', 'attendees', 'date', 'time']
        }
    },
    {
        name: 'getMyMeetings',
        description: 'Get upcoming meetings for the employee.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === APPROVALS ===
    {
        name: 'requestApproval',
        description: 'Request approval from manager for something (expense, purchase, overtime, travel, etc.).',
        input_schema: {
            type: 'object',
            properties: {
                request_type: { type: 'string', enum: ['expense', 'purchase', 'overtime', 'travel', 'other'], description: 'Type of approval' },
                title: { type: 'string', description: 'Brief title of the request' },
                description: { type: 'string', description: 'Detailed description' },
                amount: { type: 'number', description: 'Amount if applicable (for expense/purchase)' }
            },
            required: ['request_type', 'title', 'description']
        }
    },
    {
        name: 'getPendingApprovals',
        description: 'Get pending approval requests. For managers: shows requests to approve. For employees: shows their pending requests.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'approveRequest',
        description: 'Approve a pending request. Only for managers reviewing requests.',
        input_schema: {
            type: 'object',
            properties: {
                request_id: { type: 'string', description: 'ID of the request to approve' },
                notes: { type: 'string', description: 'Optional approval notes' }
            },
            required: ['request_id']
        }
    },
    {
        name: 'rejectRequest',
        description: 'Reject a pending request. Only for managers reviewing requests.',
        input_schema: {
            type: 'object',
            properties: {
                request_id: { type: 'string', description: 'ID of the request to reject' },
                reason: { type: 'string', description: 'Reason for rejection' }
            },
            required: ['request_id', 'reason']
        }
    },

    // === TEAM MANAGEMENT (Managers) ===
    {
        name: 'checkTeamStatus',
        description: 'Check team status including attendance and tasks. Only for managers.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === REMINDERS & SUMMARY ===
    {
        name: 'setReminder',
        description: 'Set a reminder for a future time.',
        input_schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'What to be reminded about' },
                remind_at: { type: 'string', description: 'When to remind (e.g., "tomorrow 9am", "Friday 2pm", "in 2 hours")' },
                priority: { type: 'string', enum: ['low', 'normal', 'high'], description: 'Reminder priority' }
            },
            required: ['content', 'remind_at']
        }
    },
    {
        name: 'getReminders',
        description: 'Get active reminders.',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getWeeklySummary',
        description: 'Get a weekly summary of tasks, attendance, and activities.',
        input_schema: { type: 'object', properties: {}, required: [] }
    }
];

/**
 * Build system prompt with employee context
 */
const buildSystemPrompt = (context) => {
    // Count tasks by status
    const allTasks = context.allTasks || context.tasks || [];
    const todoTasks = allTasks.filter(t => t.status === 'todo');
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
    const doneTasks = allTasks.filter(t => t.status === 'done');

    const tasksInfo = allTasks.length > 0
        ? allTasks.map(t => {
            const due = t.due_date ? ` (Due: ${new Date(t.due_date).toLocaleDateString()})` : '';
            return `- ${t.title} [${t.status}] [${t.priority || 'medium'}]${due}`;
        }).join('\n')
        : 'No tasks';

    const taskSummary = `Total: ${allTasks.length} | Todo: ${todoTasks.length} | In Progress: ${inProgressTasks.length} | Done: ${doneTasks.length}`;

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

    // Determine role capabilities
    const isManager = context.subordinates && context.subordinates.length > 0;
    const isAdmin = context.role.name === 'Admin';
    const isHOD = context.role.name === 'Head of Department';

    const subordinatesInfo = isManager && context.subordinates
        ? `\nDIRECT REPORTS (${context.subordinates.length}): ${context.subordinates.map(s => s.name).join(', ')}`
        : '';

    const roleCapabilities = isAdmin
        ? 'ADMIN - Full access to all features and messaging'
        : isHOD
        ? 'HEAD OF DEPARTMENT - Can message department, other HODs, management; can delegate tasks'
        : isManager
        ? 'MANAGER - Can message team, other managers, HR; can delegate tasks and announce to team'
        : 'EMPLOYEE - Can message manager, HR, and same department colleagues';

    const meetingsInfo = context.upcomingMeetings !== undefined ? context.upcomingMeetings : 0;
    const approvalsInfo = context.pendingApprovals !== undefined ? context.pendingApprovals : 0;

    return `You are BBC Assistant. Be concise and helpful.

RESPONSE STYLE - CRITICAL:
- Maximum 1-2 sentences for simple queries
- Use bullet points ONLY when listing 3+ items
- Never repeat what the user asked
- No filler phrases like "Let me check...", "Based on...", "I can see that..."
- After tool use, give brief confirmation only

GOOD RESPONSES:
- "✓ Checked in at 9:15 AM"
- "You have 5 tasks: 3 todo, 1 in progress, 1 done."
- "Task created: Review report (due tomorrow)"

BAD RESPONSES (too long):
- "Okay, let me check your tasks. Based on your task list, I can see that you have..."
- "I've successfully checked you in. Your check-in time has been recorded as..."

TASK STATUS DEFINITIONS:
- "todo" = pending/not started
- "in_progress" = currently working on
- "done" = completed/finished
When user asks about "completed" or "done" tasks, count status="done"

CURRENT TIME: ${new Date().toLocaleString()}

EMPLOYEE: ${context.employee.name} | ${context.department.name} | ${context.role.name}
MANAGER: ${managerInfo}${subordinatesInfo}

TASKS (${taskSummary}):
${tasksInfo}

ATTENDANCE THIS WEEK:
${attendanceInfo}

QUICK STATS:
- Unread Messages: ${context.unreadMessages}
- Upcoming Meetings: ${meetingsInfo}${isManager ? ` | Pending Approvals: ${approvalsInfo}` : ''}

TOOLS AVAILABLE:
Tasks: createTask, updateTask, deleteTask, getMyTasks, delegateTask (managers)
Attendance: checkIn, checkOut, getMyAttendance
Leave: requestLeave, getLeaveBalance
Messages: messageManager, messageHR, messageEmployee, escalateIssue, announceToTeam (managers), checkMessages
Meetings: scheduleMeeting, getMyMeetings
Approvals: requestApproval, getPendingApprovals, approveRequest, rejectRequest
Other: checkTeamStatus (managers), setReminder, getReminders, getWeeklySummary

RULES:
1. ALWAYS use tools for actions - never fake responses
2. Be brief - confirm actions in 1 line
3. For task counts, use the TASK STATUS DEFINITIONS above`;
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
