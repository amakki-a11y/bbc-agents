const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// ========== RATE LIMITING & CACHING CONFIGURATION ==========

/**
 * Simple LRU Cache for common AI responses
 * Reduces API calls for frequently asked questions
 */
class ResponseCache {
    constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) { // 5 minute TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    generateKey(message, contextHash) {
        // Create a cache key from the message and a simplified context hash
        const normalizedMessage = message.toLowerCase().trim();
        return `${normalizedMessage}:${contextHash}`;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        // Remove oldest entry if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs
        });
    }

    clear() {
        this.cache.clear();
    }
}

/**
 * Request Queue to prevent API overload
 * Processes requests sequentially with rate limiting
 */
class RequestQueue {
    constructor(maxConcurrent = 2, minDelayMs = 100) {
        this.queue = [];
        this.activeRequests = 0;
        this.maxConcurrent = maxConcurrent;
        this.minDelayMs = minDelayMs;
        this.lastRequestTime = 0;
    }

    async enqueue(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        // Ensure minimum delay between requests
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minDelayMs) {
            setTimeout(() => this.processQueue(), this.minDelayMs - timeSinceLastRequest);
            return;
        }

        const { requestFn, resolve, reject } = this.queue.shift();
        this.activeRequests++;
        this.lastRequestTime = Date.now();

        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.activeRequests--;
            this.processQueue();
        }
    }
}

// Initialize cache and queue
const responseCache = new ResponseCache();
const requestQueue = new RequestQueue();

/**
 * Exponential backoff retry wrapper
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelayMs - Base delay in ms (default: 1000)
 * @returns {Promise} - Result of the function or throws after max retries
 */
const withRetry = async (fn, maxRetries = 3, baseDelayMs = 1000) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if this is a rate limit error
            const isRateLimit = error.status === 429 ||
                               error.message?.includes('rate') ||
                               error.message?.includes('too many') ||
                               error.message?.includes('overloaded');

            // Don't retry on non-retryable errors
            const isRetryable = isRateLimit ||
                               error.status === 500 ||
                               error.status === 502 ||
                               error.status === 503 ||
                               error.message?.includes('timeout');

            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff + jitter
            const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
            console.log(`AI API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

/**
 * Generate a simple hash of the context for caching
 * Only includes relevant fields that affect the response
 */
const hashContext = (context) => {
    const relevantData = {
        employeeId: context.employee?.id,
        tasksCount: context.allTasks?.length || context.tasks?.length || 0,
        unreadMessages: context.unreadMessages
    };
    return JSON.stringify(relevantData);
};

/**
 * Friendly error messages for rate limiting
 */
const FRIENDLY_ERROR_MESSAGES = {
    rateLimit: "I'm a bit busy right now. Please try again in a moment. 🙏",
    overloaded: "Our AI service is experiencing high demand. Please try again shortly.",
    timeout: "The request took too long. Please try again.",
    generic: "Something went wrong. Please try again in a moment."
};

/**
 * Check if a message is cacheable (simple queries without side effects)
 */
const isCacheableQuery = (message) => {
    const lowerMessage = message.toLowerCase();
    const cacheablePatterns = [
        'who can i message',
        'my contacts',
        'my tasks',
        'my attendance',
        'my stats',
        'my goals',
        'leaderboard',
        'who\'s in',
        'who\'s out',
        'pulse check',
        'my profile'
    ];

    return cacheablePatterns.some(pattern => lowerMessage.includes(pattern));
};

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
        description: 'Check unread messages and inbox summary. Use for "check messages", "any new messages?", "my inbox"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'readMessage',
        description: 'Read a specific message from someone and mark it as read. Use for "read message from [name]", "open message from [name]", "what did [name] say?"',
        input_schema: {
            type: 'object',
            properties: {
                sender_name: { type: 'string', description: 'Name of the person who sent the message' }
            },
            required: ['sender_name']
        }
    },
    {
        name: 'replyToMessage',
        description: 'Reply to a message from someone. Use for "reply to [name]", "respond to [name]"',
        input_schema: {
            type: 'object',
            properties: {
                sender_name: { type: 'string', description: 'Name of the person to reply to' },
                content: { type: 'string', description: 'Reply content' }
            },
            required: ['sender_name', 'content']
        }
    },
    {
        name: 'getMessageableContacts',
        description: 'Get list of people the employee can message based on hierarchy rules. Use for "who can I message?", "my contacts", "message options"',
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
    },

    // === EXECUTIVE: PEOPLE & PRESENCE ===
    {
        name: 'getWhosInOffice',
        description: 'Get list of employees currently in the office (checked in but not checked out today). Use for "who\'s in?", "who\'s at work?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getWhosAbsent',
        description: 'Get employees who are absent today (no attendance record). Use for "who\'s absent?", "who\'s missing?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'checkEmployeeAvailability',
        description: 'Check if a specific employee is available/in office. Use for "is [name] available?", "is [name] in?"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee to check' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getDepartmentStatus',
        description: 'Get attendance status of all employees in a department. Use for "show [dept] team status"',
        input_schema: {
            type: 'object',
            properties: {
                department_name: { type: 'string', description: 'Department name (e.g., Engineering, HR, Sales)' }
            },
            required: ['department_name']
        }
    },

    // === EXECUTIVE: PERFORMANCE & ANALYTICS ===
    {
        name: 'getEmployeeHoursWorked',
        description: 'Get total hours worked by an employee this week. Use for "how much did [name] work?"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' },
                period: { type: 'string', enum: ['today', 'week', 'month'], description: 'Time period (default: week)' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getEmployeeProductivity',
        description: 'Get productivity metrics: tasks completed, hours worked, attendance rate. Use for "show [name]\'s productivity"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getTaskLeaderboard',
        description: 'Get ranking of employees by tasks completed. Use for "who completed most tasks?", "top performers"',
        input_schema: {
            type: 'object',
            properties: {
                period: { type: 'string', enum: ['week', 'month'], description: 'Time period (default: week)' },
                limit: { type: 'integer', description: 'Number of top performers to show (default: 5)' }
            },
            required: []
        }
    },
    {
        name: 'getTeamAttendanceRate',
        description: 'Get attendance rate percentage for team/department. Use for "team attendance rate", "attendance this week"',
        input_schema: {
            type: 'object',
            properties: {
                department_name: { type: 'string', description: 'Optional department name (omit for all employees)' }
            },
            required: []
        }
    },

    // === EXECUTIVE: TASK MANAGEMENT ===
    {
        name: 'assignTask',
        description: 'Create and assign a task to a specific employee. Use for "assign [task] to [name]"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of employee to assign task to' },
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
                due_date: { type: 'string', description: 'Due date' }
            },
            required: ['employee_name', 'title']
        }
    },
    {
        name: 'getEmployeeProgress',
        description: 'Get an employee\'s task progress grouped by status. Use for "show [name]\'s progress"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getOverdueTasks',
        description: 'Get all overdue tasks (due date passed, not done). Use for "what\'s overdue?", "overdue tasks"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Optional: filter by employee name' }
            },
            required: []
        }
    },
    {
        name: 'reassignTask',
        description: 'Reassign an existing task to a different employee. Use for "reassign [task] to [name]"',
        input_schema: {
            type: 'object',
            properties: {
                task_title: { type: 'string', description: 'Title of the task to reassign' },
                new_employee_name: { type: 'string', description: 'Name of new assignee' }
            },
            required: ['task_title', 'new_employee_name']
        }
    },

    // === EXECUTIVE: QUICK REPORTS ===
    {
        name: 'getDailyStandupReport',
        description: 'Get daily standup report: who\'s in, today\'s tasks, meetings. Use for "daily standup", "morning report"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getRedFlags',
        description: 'Get issues needing attention: overdue tasks, absences, pending approvals. Use for "show red flags", "what needs attention?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getProjectStatus',
        description: 'Get status of tasks in a specific project. Use for "project [X] status", "how\'s project [X]?"',
        input_schema: {
            type: 'object',
            properties: {
                project_name: { type: 'string', description: 'Name of the project' }
            },
            required: ['project_name']
        }
    },
    {
        name: 'getWhoNeedsHelp',
        description: 'Find employees struggling: overdue tasks, low completion, behind schedule. Use for "who needs help?", "who\'s struggling?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getPulseCheck',
        description: 'Quick company status: attendance %, tasks due, issues. Use for "pulse check", "company status", "how are we doing?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getEndOfDayWrapup',
        description: 'End of day summary: today\'s accomplishments + tomorrow preview. Use for "wrap up", "end of day", "EOD summary"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getDailyBriefing',
        description: 'Daily briefing with company pulse, issues needing attention, personal day overview, and AI insights. Use for "briefing", "good morning", "morning", "what did I miss", "catch me up", "daily update"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === GOALS & OKR TRACKING ===
    {
        name: 'createGoal',
        description: 'Create a new goal for self, team member, department, or company. Use for "set goal [X]", "create goal [X]", "new goal [X] for [person/dept]"',
        input_schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Goal title (e.g., "Complete 20 tasks", "100% attendance")' },
                targetValue: { type: 'number', description: 'Target value to achieve (e.g., 20 for 20 tasks, 100 for 100%)' },
                unit: { type: 'string', enum: ['tasks', 'hours', 'percent', 'dollars', 'customers', 'projects'], description: 'Unit of measurement' },
                owner_name: { type: 'string', description: 'Name of employee/department to assign goal to (omit for self)' },
                owner_type: { type: 'string', enum: ['employee', 'department', 'company'], description: 'Type of owner (default: employee)' },
                due_date: { type: 'string', description: 'Due date (e.g., "end of month", "Jan 31", "in 2 weeks")' },
                auto_track: { type: 'string', enum: ['tasks_completed', 'hours_worked', 'attendance_rate'], description: 'Auto-track field (optional)' },
                description: { type: 'string', description: 'Goal description' }
            },
            required: ['title', 'targetValue', 'unit']
        }
    },
    {
        name: 'getGoals',
        description: 'Get goals list. Use for "show goals", "my goals", "company goals", "[name]\'s goals", "team goals", "department goals"',
        input_schema: {
            type: 'object',
            properties: {
                owner_name: { type: 'string', description: 'Name of employee/department (omit for own goals)' },
                owner_type: { type: 'string', enum: ['employee', 'department', 'company'], description: 'Filter by owner type' },
                status: { type: 'string', enum: ['active', 'completed', 'at_risk', 'all'], description: 'Filter by status (default: active)' }
            },
            required: []
        }
    },
    {
        name: 'getGoalProgress',
        description: 'Get detailed progress on a specific goal. Use for "how is [goal] progressing?", "[goal] status", "progress on [goal]"',
        input_schema: {
            type: 'object',
            properties: {
                goal_title: { type: 'string', description: 'Title of the goal to check' },
                goal_id: { type: 'integer', description: 'ID of the goal (if known)' }
            },
            required: []
        }
    },
    {
        name: 'updateGoalProgress',
        description: 'Manually update goal progress. Use for "update goal [X] to [Y]", "set [goal] progress to [value]"',
        input_schema: {
            type: 'object',
            properties: {
                goal_title: { type: 'string', description: 'Title of the goal to update' },
                goal_id: { type: 'integer', description: 'ID of the goal (if known)' },
                new_value: { type: 'number', description: 'New current value' }
            },
            required: ['new_value']
        }
    },
    {
        name: 'getGoalsAtRisk',
        description: 'Get goals that are behind schedule or at risk. Use for "goals at risk", "what goals need attention?", "struggling goals"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'completeGoal',
        description: 'Mark a goal as completed. Use for "complete goal [X]", "mark goal [X] done", "goal [X] achieved"',
        input_schema: {
            type: 'object',
            properties: {
                goal_title: { type: 'string', description: 'Title of the goal to complete' },
                goal_id: { type: 'integer', description: 'ID of the goal (if known)' }
            },
            required: []
        }
    },

    // === GAMIFICATION ===
    {
        name: 'getLeaderboard',
        description: 'Get points leaderboard. Use for "leaderboard", "top scorers", "who\'s winning?", "rankings"',
        input_schema: {
            type: 'object',
            properties: {
                period: { type: 'string', enum: ['week', 'month', 'all'], description: 'Time period (default: week)' }
            },
            required: []
        }
    },
    {
        name: 'getMyStats',
        description: 'Get personal gamification stats: points, level, streak, achievements. Use for "my stats", "my points", "my level", "how am I doing?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getAchievements',
        description: 'Get achievements list. Use for "my achievements", "my badges", "what have I earned?", "[name]\'s achievements"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of employee (omit for own achievements)' }
            },
            required: []
        }
    },
    {
        name: 'getStreaks',
        description: 'Get streak information for employees. Use for "streaks", "who has the longest streak?", "my streak"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === SMART INSIGHTS & PREDICTIONS (Phase 5) ===
    {
        name: 'getBurnoutRisk',
        description: 'Identify employees at risk of burnout based on hours worked and overdue tasks. Use for "burnout risk", "who\'s overworked?", "stress check", "workload concerns"',
        input_schema: {
            type: 'object',
            properties: {
                threshold_hours: { type: 'number', description: 'Hours per week threshold (default: 45)' },
                threshold_overdue: { type: 'number', description: 'Overdue tasks threshold (default: 5)' }
            },
            required: []
        }
    },
    {
        name: 'getPerformanceTrends',
        description: 'Compare task completion trends week-over-week by department or individual. Use for "performance trends", "how is [dept] trending?", "trending up/down?", "week over week"',
        input_schema: {
            type: 'object',
            properties: {
                department_name: { type: 'string', description: 'Department name (omit for all departments)' },
                employee_name: { type: 'string', description: 'Employee name (for individual trends)' }
            },
            required: []
        }
    },
    {
        name: 'getProjectRiskAnalysis',
        description: 'Identify projects at risk of missing deadlines. Use for "project risks", "which projects are at risk?", "risky projects", "project concerns"',
        input_schema: {
            type: 'object',
            properties: {
                overdue_threshold: { type: 'number', description: 'Percentage of overdue tasks to flag (default: 30)' },
                days_threshold: { type: 'number', description: 'Days remaining with low progress (default: 7)' }
            },
            required: []
        }
    },
    {
        name: 'getWorkloadBalance',
        description: 'Analyze task distribution across employees and suggest rebalancing. Use for "workload balance", "task distribution", "workload spread", "who has too much/little?"',
        input_schema: {
            type: 'object',
            properties: {
                department_name: { type: 'string', description: 'Department to analyze (omit for all)' }
            },
            required: []
        }
    },
    {
        name: 'getPredictedDelays',
        description: 'Predict tasks likely to miss deadlines based on progress patterns. Use for "predicted delays", "what might be late?", "delay forecast", "likely to miss deadline"',
        input_schema: {
            type: 'object',
            properties: {
                days_no_progress: { type: 'number', description: 'Days without progress threshold (default: 3)' }
            },
            required: []
        }
    },
    {
        name: 'getRecognitionSuggestions',
        description: 'Suggest employees who deserve recognition based on performance. Use for "who deserves recognition?", "star performers", "who to recognize?", "shout outs"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getAnomalyAlerts',
        description: 'Detect unusual patterns in employee activity. Use for "anything unusual?", "anomalies", "strange patterns", "what\'s different?"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // === EMPLOYEE LIFECYCLE MANAGEMENT ===

    // CV Parsing & Onboarding
    {
        name: 'parseEmployeeCV',
        description: 'Parse CV/resume text and extract structured data (education, experience, skills). Use for "parse CV", "analyze resume", "extract CV data for [name]"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee whose CV to parse' },
                cv_text: { type: 'string', description: 'The CV/resume text content to parse' }
            },
            required: ['employee_name', 'cv_text']
        }
    },
    {
        name: 'getOnboardingStatus',
        description: 'Get onboarding progress for new employees. Use for "onboarding status", "new employee progress", "[name]\'s onboarding"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of employee (omit for all new hires)' }
            },
            required: []
        }
    },
    {
        name: 'updateOnboardingProgress',
        description: 'Update onboarding progress percentage. Use for "update [name] onboarding to X%", "mark onboarding complete"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' },
                progress: { type: 'integer', description: 'Progress percentage (0-100)' },
                status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'], description: 'Onboarding status' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getEmployeeProfile',
        description: 'Get comprehensive employee profile including skills, education, experience. Use for "[name]\'s profile", "show [name] details", "employee info for [name]"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' }
            },
            required: ['employee_name']
        }
    },

    // Probation Management
    {
        name: 'getProbationStatus',
        description: 'Get probation status and AI analysis for an employee. Use for "[name] probation status", "how is [name] doing in probation?", "probation progress"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of employee (omit for all on probation)' }
            },
            required: []
        }
    },
    {
        name: 'createProbationReview',
        description: 'Create a probation review for an employee with ratings. Use for "probation review for [name]", "rate [name]\'s probation"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' },
                performance_rating: { type: 'integer', description: 'Performance rating 1-5' },
                attendance_rating: { type: 'integer', description: 'Attendance rating 1-5' },
                attitude_rating: { type: 'integer', description: 'Attitude rating 1-5' },
                learning_rating: { type: 'integer', description: 'Learning/growth rating 1-5' },
                teamwork_rating: { type: 'integer', description: 'Teamwork rating 1-5' },
                strengths: { type: 'string', description: 'Observed strengths' },
                improvements: { type: 'string', description: 'Areas for improvement' },
                concerns: { type: 'string', description: 'Any concerns' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getProbationAlerts',
        description: 'Get alerts for probations ending soon, overdue reviews, at-risk employees. Use for "probation alerts", "who\'s probation ending?", "probation concerns"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'extendProbation',
        description: 'Extend an employee\'s probation period. Use for "extend [name] probation by X weeks"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' },
                weeks: { type: 'integer', description: 'Number of weeks to extend' },
                reason: { type: 'string', description: 'Reason for extension' }
            },
            required: ['employee_name', 'weeks']
        }
    },
    {
        name: 'completeProbation',
        description: 'Mark probation as passed or failed. Use for "[name] passed probation", "confirm [name] employment", "fail [name] probation"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' },
                outcome: { type: 'string', enum: ['passed', 'failed'], description: 'Probation outcome' },
                notes: { type: 'string', description: 'Final notes' }
            },
            required: ['employee_name', 'outcome']
        }
    },

    // Performance Analysis
    {
        name: 'analyzeEmployeePerformance',
        description: 'Get AI analysis of employee performance across all metrics. Use for "[name] performance analysis", "analyze [name]", "performance insights for [name]"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' }
            },
            required: ['employee_name']
        }
    },
    {
        name: 'getAttritionRisk',
        description: 'Analyze attrition/flight risk for employees. Use for "attrition risk", "who might leave?", "flight risk", "retention concerns", "[name] attrition risk"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of specific employee (omit for all high-risk)' }
            },
            required: []
        }
    },

    // Employee Search & Discovery
    {
        name: 'searchEmployees',
        description: 'Search employees by skills, department, status, etc. Use for "find employees with [skill]", "who knows [X]?", "search employees"',
        input_schema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query (name, email, job title)' },
                skills: { type: 'string', description: 'Comma-separated skills to search for' },
                department: { type: 'string', description: 'Department filter' },
                status: { type: 'string', enum: ['active', 'on_leave', 'probation'], description: 'Employee status filter' }
            },
            required: []
        }
    },
    {
        name: 'getEmployeesNeedingAttention',
        description: 'Get all employees requiring HR/manager attention. Use for "who needs attention?", "HR alerts", "employee concerns", "people to check on"',
        input_schema: { type: 'object', properties: {}, required: [] }
    },

    // Department & Team Analytics
    {
        name: 'getDepartmentAnalytics',
        description: 'Get analytics summary by department. Use for "department analytics", "[dept] stats", "team performance by department"',
        input_schema: {
            type: 'object',
            properties: {
                department_name: { type: 'string', description: 'Specific department (omit for all departments)' }
            },
            required: []
        }
    },

    // Skills Management
    {
        name: 'getEmployeeSkills',
        description: 'Get skills for an employee or find employees by skill. Use for "[name]\'s skills", "who has [skill]?", "skill matrix"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of employee to get skills for' },
                skill_name: { type: 'string', description: 'Skill name to search for across employees' }
            },
            required: []
        }
    },
    {
        name: 'addEmployeeSkill',
        description: 'Add a skill to an employee\'s profile. Use for "add [skill] to [name]", "[name] knows [skill]"',
        input_schema: {
            type: 'object',
            properties: {
                employee_name: { type: 'string', description: 'Name of the employee' },
                skill_name: { type: 'string', description: 'Name of the skill' },
                category: { type: 'string', enum: ['technical', 'soft', 'language', 'certification'], description: 'Skill category' },
                proficiency: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'], description: 'Proficiency level' }
            },
            required: ['employee_name', 'skill_name']
        }
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
Tasks: createTask, updateTask, deleteTask, getMyTasks, delegateTask
Attendance: checkIn, checkOut, getMyAttendance
Leave: requestLeave, getLeaveBalance
Messages: messageManager, messageHR, messageEmployee, escalateIssue, announceToTeam, checkMessages, readMessage, replyToMessage, getMessageableContacts
Meetings: scheduleMeeting, getMyMeetings
Approvals: requestApproval, getPendingApprovals, approveRequest, rejectRequest
Reminders: setReminder, getReminders, getWeeklySummary

EXECUTIVE TOOLS (managers/admins):
Presence: getWhosInOffice ("who's in?"), getWhosAbsent ("who's out?"), checkEmployeeAvailability ("is X in?"), getDepartmentStatus
Analytics: getEmployeeHoursWorked ("how much did X work?"), getEmployeeProductivity, getTaskLeaderboard ("top performers", "who's killing it?"), getTeamAttendanceRate
Task Mgmt: assignTask ("assign X to Y"), getEmployeeProgress ("show X's progress"), getOverdueTasks ("what's overdue?"), reassignTask ("reassign X to Y")
Reports: getDailyStandupReport, getRedFlags ("red flags", "what needs attention?"), getProjectStatus
Quick: getWhoNeedsHelp ("who needs help?"), getPulseCheck ("pulse check"), getEndOfDayWrapup ("wrap up"), getDailyBriefing ("briefing", "good morning", "what did I miss")

GOALS & OKR:
createGoal ("set goal X", "create goal X for Y"), getGoals ("show goals", "my goals", "company goals"), getGoalProgress ("how is X progressing?"), updateGoalProgress ("update goal X to Y"), getGoalsAtRisk ("goals at risk"), completeGoal ("complete goal X")

GAMIFICATION:
getLeaderboard ("leaderboard", "who's winning?"), getMyStats ("my stats", "my points", "my level"), getAchievements ("my achievements", "my badges"), getStreaks ("streaks", "my streak")

SMART INSIGHTS (Phase 5):
getBurnoutRisk ("burnout risk", "who's overworked?"), getPerformanceTrends ("performance trends", "how is [dept] trending?"), getProjectRiskAnalysis ("project risks", "risky projects"), getWorkloadBalance ("workload balance", "task distribution"), getPredictedDelays ("predicted delays", "what might be late?"), getRecognitionSuggestions ("who deserves recognition?", "star performers"), getAnomalyAlerts ("anything unusual?", "anomalies")

EMPLOYEE LIFECYCLE (HR/Manager tools):
CV & Onboarding: parseEmployeeCV ("parse CV", "analyze resume"), getOnboardingStatus ("onboarding status"), updateOnboardingProgress ("update onboarding"), getEmployeeProfile ("[name]'s profile")
Probation: getProbationStatus ("[name] probation"), createProbationReview ("probation review for [name]"), getProbationAlerts ("probation alerts"), extendProbation ("extend probation"), completeProbation ("confirm employment", "pass/fail probation")
Performance: analyzeEmployeePerformance ("analyze [name]", "performance insights"), getAttritionRisk ("who might leave?", "flight risk")
Discovery: searchEmployees ("find employees with [skill]", "who knows [X]?"), getEmployeesNeedingAttention ("who needs attention?", "HR alerts"), getDepartmentAnalytics ("department stats")
Skills: getEmployeeSkills ("[name]'s skills", "who has [skill]?"), addEmployeeSkill ("add [skill] to [name]")

VOICE COMMAND EXAMPLES:
- "Who's in?" → "8 in office: John, Sarah, Mike +5 more"
- "Who's out?" → "3 absent: Ahmed (no show), Lisa (sick), Tom (vacation)"
- "Is Sarah in?" → "Yes, Sarah checked in at 8:45 AM"
- "How much did Ahmed work?" → "Ahmed: 38.5 hours this week"
- "Show Ahmed's progress" → "Ahmed: 5 done, 3 in progress, 2 pending, 1 overdue"
- "Who's killing it?" → "🥇 Sarah (18) 🥈 Ahmed (15) 🥉 John (12)"
- "Who needs help?" → "⚠️ Mike: 5 overdue tasks. Lisa: 0 completed this week"
- "What's overdue?" → "4 overdue: Report (John, 2d), Design (Sarah, 1d) +2 more"
- "Assign 'Review report' to Ahmed" → "✓ Assigned 'Review report' to Ahmed"
- "Pulse check" → "📊 82% attendance | 12 tasks due | 2 issues"
- "Red flags" → "🚨 3 overdue, 2 pending approvals, 1 absent without notice"
- "Wrap up" → "Today: 8 done, 2 pending. Tomorrow: 3 meetings, 5 tasks due"
- "Good morning" / "Briefing" → Full daily briefing with pulse, issues, your day, AI insight
- "Set goal: complete 20 tasks by Jan 31" → "✓ Goal created: Complete 20 tasks [░░░░░░░░░░] 0/20, due Jan 31"
- "My goals" → "3 active goals: • Complete 20 tasks [████████░░] 80% • 100% attendance [██████████] ✓"
- "Goals at risk" → "⚠️ 1 at risk: Launch project (40%, due in 5 days)"
- "Leaderboard" → "🏆 This Week: 🥇 Sarah (150 pts) 🥈 Ahmed (120 pts) 🥉 John (95 pts)"
- "My stats" → "📊 Level 5 | 450 pts | 🔥 7-day streak | 12 achievements"
- "My achievements" → "🏆 5 badges: Task Master, Early Bird, Streak Keeper, Goal Crusher, Team Player"
- "Burnout risk" → "⚠️ Burnout risk: Ahmed (52 hrs), Sarah (6 overdue tasks)"
- "Performance trends" → "📈 Marketing: +23% vs last week | 📉 Sales: -12%"
- "Project risks" → "🚨 At risk: Website Redesign (40% done, due in 5 days)"
- "Workload balance" → "⚖️ Imbalanced: Ahmed (12 tasks) vs Mike (2 tasks)"
- "Predicted delays" → "⚠️ Likely delays: Q1 Report (no progress, due in 2 days)"
- "Who deserves recognition?" → "🌟 Recognize: Sarah (15 tasks, 10-day streak)"
- "Anything unusual?" → "🔍 Unusual: John - 0 tasks this week (usually 8+)"

EMPLOYEE LIFECYCLE EXAMPLES:
- "Ahmed's profile" → "📋 Ahmed: Software Engineer, Engineering. Skills: Python, JavaScript +3. 2 yrs experience"
- "Probation status" → "📊 3 on probation: Sarah (week 6, on track), Mike (week 10, needs review), Lisa (week 2, new)"
- "Who might leave?" → "⚠️ Flight risk: Ahmed (high - no promotion in 2 yrs), Sarah (medium - declining engagement)"
- "Find employees with Python" → "🔍 Found 5: Ahmed (expert), Sarah (advanced), John (intermediate) +2 more"
- "Who needs attention?" → "🚨 Attention: 2 probation ending, 3 high attrition risk, 1 overdue review"
- "Department analytics" → "📊 Engineering: 12 staff, 78 avg performance | Marketing: 8 staff, 82 avg"
- "Sarah's onboarding" → "📋 Sarah onboarding: 60% complete, in_progress. Pending: IT setup, policy review"

MESSAGING VOICE COMMANDS:
- "Message my manager" / "tell my boss" → messageManager
- "Contact HR" / "message HR about..." → messageHR
- "Message [name]" / "send to [name]" → messageEmployee (checks hierarchy first)
- "Escalate [issue]" / "escalate to manager" → escalateIssue (urgent, sends to manager)
- "Announce to my team" / "tell my team" → announceToTeam (managers only)
- "Check messages" / "any new messages?" / "my inbox" → checkMessages
- "Read message from [name]" / "what did [name] say?" → readMessage
- "Reply to [name]" / "respond to [name]" → replyToMessage
- "Who can I message?" / "my contacts" → getMessageableContacts

HIERARCHY RULES FOR MESSAGING:
- Admin/HR: Can message anyone
- Employee: Manager, HR, same department only
- Manager: Team, other managers, HR, own manager
- HOD: Department, other HODs, management

RULES:
1. ALWAYS use tools - never fake responses
2. Max 2 sentences per response (except getDailyBriefing which returns formatted briefing)
3. Numbers first, then names
4. Use "+X more" for long lists (>5 items)
5. Emojis: 🚨 alerts, ✓ confirmations, 📊 stats, 🥇🥈🥉 rankings, ☀️ briefings`;
};

/**
 * Generate AI response using Claude with tool support
 * Includes: exponential backoff, caching, request queuing
 */
const generateAIResponse = async (userMessage, context, actionHandler = null) => {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('ANTHROPIC_API_KEY not configured, using mock response');
        return null;
    }

    // Check cache for cacheable queries
    const contextHash = hashContext(context);
    const cacheKey = responseCache.generateKey(userMessage, contextHash);

    if (isCacheableQuery(userMessage)) {
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse) {
            console.log('Returning cached AI response');
            return {
                ...cachedResponse,
                metadata: { ...cachedResponse.metadata, fromCache: true }
            };
        }
    }

    // Queue the request to prevent API overload
    return requestQueue.enqueue(async () => {
        try {
            const systemPrompt = buildSystemPrompt(context);
            const messages = [
                {
                    role: 'user',
                    content: userMessage
                }
            ];

            // Initial response with tools - wrapped in retry logic
            let response = await withRetry(async () => {
                return await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages,
                    tools: toolDefinitions
                });
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

            // Continue the conversation - wrapped in retry logic
            response = await withRetry(async () => {
                return await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages,
                    tools: toolDefinitions
                });
            });
        }

        // Extract final text from response
        const textContent = response.content.find(block => block.type === 'text');
        if (textContent) {
            finalTextContent += textContent.text;
        }

        if (finalTextContent) {
            const result = {
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

            // Cache successful responses for cacheable queries (only if no tools were used)
            if (isCacheableQuery(userMessage) && toolResults.length === 0) {
                responseCache.set(cacheKey, result);
            }

            return result;
        }

        return null;
        } catch (error) {
            console.error('Claude API error:', error.message);

            // Determine friendly error message based on error type
            let friendlyMessage = FRIENDLY_ERROR_MESSAGES.generic;

            if (error.status === 429 || error.message?.includes('rate') || error.message?.includes('too many')) {
                friendlyMessage = FRIENDLY_ERROR_MESSAGES.rateLimit;
            } else if (error.message?.includes('overloaded') || error.status === 529) {
                friendlyMessage = FRIENDLY_ERROR_MESSAGES.overloaded;
            } else if (error.message?.includes('timeout')) {
                friendlyMessage = FRIENDLY_ERROR_MESSAGES.timeout;
            }

            // Return friendly error instead of null for rate limit errors
            if (error.status === 429 || error.status === 529 || error.message?.includes('rate') || error.message?.includes('overloaded')) {
                return {
                    content: friendlyMessage,
                    messageType: 'error',
                    metadata: {
                        action: 'rate_limited',
                        error: true,
                        retryAfter: error.headers?.['retry-after'] || 30
                    }
                };
            }

            // Return null for other errors to trigger fallback
            return null;
        }
    });
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

/**
 * Clear the response cache (useful for testing or maintenance)
 */
const clearResponseCache = () => {
    responseCache.clear();
    console.log('AI response cache cleared');
};

/**
 * Get current queue status (for monitoring)
 */
const getQueueStatus = () => ({
    activeRequests: requestQueue.activeRequests,
    queueLength: requestQueue.queue.length
});

module.exports = {
    generateAIResponse,
    buildSystemPrompt,
    toolDefinitions,
    clearResponseCache,
    getQueueStatus
};
