const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get complete context about an employee for AI bot
 */
const getEmployeeContext = async (employeeId) => {
    // Get employee details with department and role
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            department: true,
            role: true,
            manager: {
                select: { id: true, name: true, email: true }
            },
            user: {
                select: { id: true, email: true }
            }
        }
    });

    if (!employee) return null;

    // Get pending tasks for this user
    const tasks = await prisma.task.findMany({
        where: {
            user_id: employee.user_id,
            status: { not: 'done' }
        },
        orderBy: { due_date: 'asc' },
        take: 10,
        select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            due_date: true
        }
    });

    // Get this week's attendance
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findMany({
        where: {
            employee_id: employeeId,
            date: { gte: startOfWeek }
        },
        orderBy: { date: 'desc' }
    });

    // Get unread messages
    const unreadMessages = await prisma.message.count({
        where: {
            employee_id: employeeId,
            sender: 'bot',
            status: { not: 'read' }
        }
    });

    return {
        employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
            hire_date: employee.hire_date
        },
        department: {
            id: employee.department.id,
            name: employee.department.name
        },
        role: {
            id: employee.role.id,
            name: employee.role.name,
            permissions: JSON.parse(employee.role.permissions || '[]')
        },
        manager: employee.manager,
        tasks,
        attendance,
        unreadMessages
    };
};

/**
 * Generate bot response based on message content (mock AI for now)
 */
const generateBotResponse = async (message, context) => {
    const lowerMessage = message.toLowerCase();

    // Task-related queries
    if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('work')) {
        if (context.tasks.length === 0) {
            return {
                content: `Great news, ${context.employee.name}! You have no pending tasks. Would you like me to help you create a new task?`,
                messageType: 'question',
                metadata: { action: 'no_tasks' }
            };
        }

        const taskList = context.tasks.map((t, i) => {
            const dueInfo = t.due_date
                ? ` (Due: ${new Date(t.due_date).toLocaleDateString()})`
                : '';
            const priorityIcon = t.priority === 'high' ? '!' : t.priority === 'medium' ? '-' : '';
            return `${i + 1}. ${priorityIcon}${t.title}${dueInfo} [${t.status}]`;
        }).join('\n');

        return {
            content: `Here are your pending tasks, ${context.employee.name}:\n\n${taskList}\n\nTotal: ${context.tasks.length} task(s). Would you like me to help you with any of these?`,
            messageType: 'question',
            metadata: { action: 'list_tasks', taskCount: context.tasks.length }
        };
    }

    // Attendance-related queries
    if (lowerMessage.includes('late') || lowerMessage.includes('absent') || lowerMessage.includes('attendance')) {
        const lateCount = context.attendance.filter(a => a.status === 'late').length;
        const absentCount = context.attendance.filter(a => a.status === 'absent').length;
        const presentCount = context.attendance.filter(a => a.status === 'present').length;

        let attendanceSummary = `This week's attendance summary:\n`;
        attendanceSummary += `- Present: ${presentCount} day(s)\n`;
        attendanceSummary += `- Late: ${lateCount} time(s)\n`;
        attendanceSummary += `- Absent: ${absentCount} day(s)`;

        if (lateCount > 0 || absentCount > 0) {
            attendanceSummary += `\n\nWould you like me to report this to your manager or HR?`;
        }

        return {
            content: attendanceSummary,
            messageType: 'report',
            metadata: {
                action: 'attendance_summary',
                late: lateCount,
                absent: absentCount,
                present: presentCount
            }
        };
    }

    // Report to manager
    if (lowerMessage.includes('report') && (lowerMessage.includes('manager') || lowerMessage.includes('hr'))) {
        if (context.manager) {
            return {
                content: `I can forward your message to ${context.manager.name} (${context.manager.email}). Please type the message you'd like me to send, or say "cancel" to abort.`,
                messageType: 'request',
                metadata: {
                    action: 'prepare_route',
                    routeTo: context.manager.id,
                    routeToName: context.manager.name
                }
            };
        } else {
            return {
                content: `You don't have a manager assigned in the system. Would you like me to route your message to HR instead?`,
                messageType: 'request',
                metadata: { action: 'no_manager' }
            };
        }
    }

    // Help command
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return {
            content: `Hello ${context.employee.name}! I'm your BBC Assistant. Here's what I can help you with:\n\n` +
                `**Tasks & Work**\n` +
                `- "Show my tasks" - View your pending tasks\n` +
                `- "What's my workload?" - Get task summary\n\n` +
                `**Attendance**\n` +
                `- "Am I late this week?" - Check attendance status\n` +
                `- "Report absence" - Notify your manager\n\n` +
                `**Communication**\n` +
                `- "Message my manager" - Send message to your manager\n` +
                `- "Route to HR" - Forward to HR department\n\n` +
                `**Information**\n` +
                `- "Who is my manager?" - View manager info\n` +
                `- "My profile" - View your details\n\n` +
                `Just type naturally and I'll do my best to help!`,
            messageType: 'question',
            metadata: { action: 'help' }
        };
    }

    // Profile/info queries
    if (lowerMessage.includes('profile') || lowerMessage.includes('my info') || lowerMessage.includes('who am i')) {
        return {
            content: `Here's your profile, ${context.employee.name}:\n\n` +
                `**Name:** ${context.employee.name}\n` +
                `**Email:** ${context.employee.email}\n` +
                `**Department:** ${context.department.name}\n` +
                `**Role:** ${context.role.name}\n` +
                `**Manager:** ${context.manager ? context.manager.name : 'Not assigned'}\n` +
                `**Status:** ${context.employee.status}\n` +
                `**Hire Date:** ${new Date(context.employee.hire_date).toLocaleDateString()}`,
            messageType: 'question',
            metadata: { action: 'profile' }
        };
    }

    // Manager query
    if (lowerMessage.includes('manager') || lowerMessage.includes('supervisor') || lowerMessage.includes('boss')) {
        if (context.manager) {
            return {
                content: `Your manager is **${context.manager.name}** (${context.manager.email}). Would you like me to send them a message?`,
                messageType: 'question',
                metadata: { action: 'manager_info', managerId: context.manager.id }
            };
        } else {
            return {
                content: `You don't have a manager assigned in the system. Please contact HR if you believe this is incorrect.`,
                messageType: 'question',
                metadata: { action: 'no_manager' }
            };
        }
    }

    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

        return {
            content: `${greeting}, ${context.employee.name}! How can I assist you today? Type "help" to see what I can do.`,
            messageType: 'question',
            metadata: { action: 'greeting' }
        };
    }

    // Default response
    return {
        content: `I understand you said: "${message}"\n\nI'm still learning! Here are some things I can help with:\n` +
            `- Check your tasks: "Show my tasks"\n` +
            `- Attendance info: "Am I late this week?"\n` +
            `- Contact manager: "Message my manager"\n\n` +
            `Type "help" for more options.`,
        messageType: 'question',
        metadata: { action: 'unknown', originalMessage: message }
    };
};

/**
 * Handle incoming bot message
 */
const handleBotMessage = async (req, res) => {
    try {
        const { content, messageType = 'question' } = req.body;
        const employeeId = req.employee?.id;

        if (!employeeId) {
            return res.status(400).json({
                error: 'Employee profile required',
                message: 'You need an employee profile to use the bot. Please contact HR.'
            });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                employee_id: employeeId,
                content: content.trim(),
                sender: 'employee',
                message_type: messageType,
                status: 'delivered'
            }
        });

        // Get employee context
        const context = await getEmployeeContext(employeeId);

        // Generate bot response
        const botResponse = await generateBotResponse(content, context);

        // Save bot response
        const botMessage = await prisma.message.create({
            data: {
                employee_id: employeeId,
                content: botResponse.content,
                sender: 'bot',
                message_type: botResponse.messageType,
                status: 'delivered',
                metadata: JSON.stringify(botResponse.metadata || {})
            }
        });

        res.json({
            userMessage: {
                id: userMessage.id,
                content: userMessage.content,
                sender: userMessage.sender,
                created_at: userMessage.created_at
            },
            botMessage: {
                id: botMessage.id,
                content: botMessage.content,
                sender: botMessage.sender,
                message_type: botMessage.message_type,
                metadata: botResponse.metadata,
                created_at: botMessage.created_at
            }
        });
    } catch (error) {
        console.error('Bot message error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
};

/**
 * Get conversation history for an employee
 */
const getConversationHistory = async (req, res) => {
    try {
        const employeeId = req.employee?.id;
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor || undefined;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee profile required' });
        }

        const messages = await prisma.message.findMany({
            where: { employee_id: employeeId },
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                content: true,
                sender: true,
                message_type: true,
                status: true,
                metadata: true,
                created_at: true
            }
        });

        let nextCursor = undefined;
        if (messages.length > limit) {
            const nextItem = messages.pop();
            nextCursor = nextItem.id;
        }

        // Parse metadata JSON
        const parsedMessages = messages.map(m => ({
            ...m,
            metadata: m.metadata ? JSON.parse(m.metadata) : null
        }));

        // Reverse to show oldest first
        parsedMessages.reverse();

        if (nextCursor) {
            res.set('X-Next-Cursor', nextCursor);
        }

        res.json(parsedMessages);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
};

/**
 * Get employee context (exposed as API endpoint)
 */
const getContext = async (req, res) => {
    try {
        const employeeId = req.employee?.id;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee profile required' });
        }

        const context = await getEmployeeContext(employeeId);
        res.json(context);
    } catch (error) {
        console.error('Get context error:', error);
        res.status(500).json({ error: 'Failed to fetch context' });
    }
};

/**
 * Route/forward a message to another employee
 */
const routeMessage = async (req, res) => {
    try {
        const { toEmployeeId, content, messageType = 'request' } = req.body;
        const fromEmployeeId = req.employee?.id;

        if (!fromEmployeeId) {
            return res.status(400).json({ error: 'Employee profile required' });
        }

        if (!toEmployeeId || !content) {
            return res.status(400).json({ error: 'toEmployeeId and content are required' });
        }

        // Verify target employee exists
        const targetEmployee = await prisma.employee.findUnique({
            where: { id: toEmployeeId },
            select: { id: true, name: true, email: true }
        });

        if (!targetEmployee) {
            return res.status(404).json({ error: 'Target employee not found' });
        }

        // Get sender info
        const sender = await prisma.employee.findUnique({
            where: { id: fromEmployeeId },
            select: { name: true, department: { select: { name: true } } }
        });

        // Create message for sender (record that they sent it)
        const senderMessage = await prisma.message.create({
            data: {
                employee_id: fromEmployeeId,
                content: `Message sent to ${targetEmployee.name}: "${content}"`,
                sender: 'bot',
                message_type: 'request',
                routed_to: toEmployeeId,
                status: 'delivered',
                metadata: JSON.stringify({
                    action: 'message_routed',
                    routedTo: targetEmployee.name
                })
            }
        });

        // Create message for recipient
        const recipientMessage = await prisma.message.create({
            data: {
                employee_id: toEmployeeId,
                content: `**Message from ${sender.name} (${sender.department.name}):**\n\n${content}`,
                sender: 'bot',
                message_type: messageType,
                status: 'pending',
                metadata: JSON.stringify({
                    action: 'message_received',
                    fromEmployee: fromEmployeeId,
                    fromName: sender.name
                })
            }
        });

        res.json({
            success: true,
            message: `Message successfully sent to ${targetEmployee.name}`,
            senderMessage: {
                id: senderMessage.id,
                content: senderMessage.content,
                created_at: senderMessage.created_at
            }
        });
    } catch (error) {
        console.error('Route message error:', error);
        res.status(500).json({ error: 'Failed to route message' });
    }
};

/**
 * Mark messages as read
 */
const markAsRead = async (req, res) => {
    try {
        const employeeId = req.employee?.id;
        const { messageIds } = req.body;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee profile required' });
        }

        const where = {
            employee_id: employeeId,
            sender: 'bot'
        };

        if (messageIds && Array.isArray(messageIds)) {
            where.id = { in: messageIds };
        }

        await prisma.message.updateMany({
            where,
            data: { status: 'read' }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

module.exports = {
    handleBotMessage,
    getConversationHistory,
    getContext,
    routeMessage,
    markAsRead
};
