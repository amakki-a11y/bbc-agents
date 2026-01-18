const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateAIResponse } = require('../services/aiService');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse relative date strings into Date objects
 */
const parseRelativeDate = (dateStr) => {
    if (!dateStr) return null;

    const lower = dateStr.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for ISO date format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
    }

    // Relative dates
    if (lower === 'today') {
        return today;
    }
    if (lower === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }
    if (lower === 'next week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
    }

    // Day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMatch = days.findIndex(d => lower.includes(d));
    if (dayMatch !== -1) {
        const target = new Date(today);
        const currentDay = target.getDay();
        let daysUntil = dayMatch - currentDay;
        if (daysUntil <= 0) daysUntil += 7; // Next occurrence
        target.setDate(target.getDate() + daysUntil);
        return target;
    }

    // "in X days"
    const inDaysMatch = lower.match(/in (\d+) days?/);
    if (inDaysMatch) {
        const target = new Date(today);
        target.setDate(target.getDate() + parseInt(inDaysMatch[1]));
        return target;
    }

    // Try to parse as date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;
};

/**
 * Determine if check-in is late (after 9 AM)
 */
const isLateCheckIn = (checkInTime) => {
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    return hours > 9 || (hours === 9 && minutes > 0);
};

/**
 * Calculate hours worked between check-in and check-out
 */
const calculateHoursWorked = (checkIn, checkOut) => {
    const diff = checkOut - checkIn;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
};

// ============================================
// ACTION HANDLERS
// ============================================

/**
 * Handle creating a task for the employee
 */
const handleCreateTask = async (employeeId, { title, description, priority, due_date }) => {
    try {
        // Get the employee's user_id
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { user_id: true, name: true }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Parse the due date
        const parsedDueDate = parseRelativeDate(due_date);

        // Create the task
        const task = await prisma.task.create({
            data: {
                title: title,
                description: description || null,
                priority: priority || 'medium',
                due_date: parsedDueDate,
                status: 'todo',
                user_id: employee.user_id
            }
        });

        return {
            success: true,
            message: `Task "${title}" created successfully`,
            task: {
                id: task.id,
                title: task.title,
                priority: task.priority,
                due_date: task.due_date ? task.due_date.toLocaleDateString() : null,
                status: task.status
            }
        };
    } catch (error) {
        console.error('handleCreateTask error:', error);
        return { success: false, error: 'Failed to create task' };
    }
};

/**
 * Handle employee check-in
 */
const handleCheckIn = async (employeeId) => {
    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employeeId,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (existingAttendance && existingAttendance.check_in) {
            return {
                success: false,
                error: 'Already checked in today',
                checkInTime: existingAttendance.check_in.toLocaleTimeString()
            };
        }

        const isLate = isLateCheckIn(now);
        const status = isLate ? 'late' : 'present';

        // Create or update attendance record
        let attendance;
        if (existingAttendance) {
            attendance = await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                    check_in: now,
                    status: status
                }
            });
        } else {
            attendance = await prisma.attendance.create({
                data: {
                    employee_id: employeeId,
                    date: today,
                    check_in: now,
                    status: status
                }
            });
        }

        return {
            success: true,
            message: isLate ? 'Checked in (late)' : 'Checked in on time',
            checkInTime: now.toLocaleTimeString(),
            status: status,
            isLate: isLate
        };
    } catch (error) {
        console.error('handleCheckIn error:', error);
        return { success: false, error: 'Failed to record check-in' };
    }
};

/**
 * Handle employee check-out
 */
const handleCheckOut = async (employeeId) => {
    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find today's attendance record
        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employeeId,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (!attendance) {
            return {
                success: false,
                error: 'No check-in found for today. Please check in first.'
            };
        }

        if (attendance.check_out) {
            return {
                success: false,
                error: 'Already checked out today',
                checkOutTime: attendance.check_out.toLocaleTimeString()
            };
        }

        if (!attendance.check_in) {
            return {
                success: false,
                error: 'No check-in recorded. Please check in first.'
            };
        }

        // Calculate hours worked
        const hoursWorked = calculateHoursWorked(attendance.check_in, now);

        // Update attendance with check-out
        await prisma.attendance.update({
            where: { id: attendance.id },
            data: { check_out: now }
        });

        return {
            success: true,
            message: `Checked out. Worked ${hoursWorked.hours}h ${hoursWorked.minutes}m today.`,
            checkOutTime: now.toLocaleTimeString(),
            hoursWorked: `${hoursWorked.hours}h ${hoursWorked.minutes}m`,
            totalMinutes: hoursWorked.totalMinutes
        };
    } catch (error) {
        console.error('handleCheckOut error:', error);
        return { success: false, error: 'Failed to record check-out' };
    }
};

/**
 * Handle leave request
 */
const handleLeaveRequest = async (employeeId, { date, reason }) => {
    try {
        const leaveDate = parseRelativeDate(date);
        if (!leaveDate) {
            return { success: false, error: 'Could not parse leave date' };
        }

        // Get employee and manager info
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                manager: { select: { id: true, name: true, email: true } }
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Create attendance record for leave day
        const attendance = await prisma.attendance.create({
            data: {
                employee_id: employeeId,
                date: leaveDate,
                status: 'on_leave',
                notes: `Leave requested: ${reason}`
            }
        });

        // If has manager, notify them
        if (employee.manager) {
            await prisma.message.create({
                data: {
                    employee_id: employee.manager.id,
                    content: `**Leave Request from ${employee.name}**\n\nDate: ${leaveDate.toLocaleDateString()}\nReason: ${reason}\n\nPlease review and approve.`,
                    sender: 'bot',
                    message_type: 'request',
                    status: 'pending',
                    metadata: JSON.stringify({
                        action: 'leave_request',
                        fromEmployee: employeeId,
                        leaveDate: leaveDate.toISOString(),
                        reason: reason
                    })
                }
            });
        }

        return {
            success: true,
            message: `Leave request submitted for ${leaveDate.toLocaleDateString()}`,
            leaveDate: leaveDate.toLocaleDateString(),
            reason: reason,
            managerNotified: employee.manager ? employee.manager.name : null
        };
    } catch (error) {
        console.error('handleLeaveRequest error:', error);
        return { success: false, error: 'Failed to submit leave request' };
    }
};

/**
 * Handle sending message to manager
 */
const handleMessageManager = async (employeeId, content) => {
    try {
        // Get employee and manager
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                manager: { select: { id: true, name: true, email: true } },
                department: { select: { name: true } }
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        if (!employee.manager) {
            return { success: false, error: 'No manager assigned. Contact HR for assistance.' };
        }

        // Create message for manager
        await prisma.message.create({
            data: {
                employee_id: employee.manager.id,
                content: `**Message from ${employee.name} (${employee.department.name}):**\n\n${content}`,
                sender: 'bot',
                message_type: 'request',
                status: 'pending',
                metadata: JSON.stringify({
                    action: 'message_from_employee',
                    fromEmployee: employeeId,
                    fromName: employee.name
                })
            }
        });

        // Create confirmation for sender
        await prisma.message.create({
            data: {
                employee_id: employeeId,
                content: `Message sent to ${employee.manager.name}: "${content}"`,
                sender: 'bot',
                message_type: 'request',
                routed_to: employee.manager.id,
                status: 'delivered',
                metadata: JSON.stringify({
                    action: 'message_routed',
                    routedTo: employee.manager.name
                })
            }
        });

        return {
            success: true,
            message: `Message sent to your manager ${employee.manager.name}`,
            sentTo: employee.manager.name
        };
    } catch (error) {
        console.error('handleMessageManager error:', error);
        return { success: false, error: 'Failed to send message to manager' };
    }
};

/**
 * Handle sending message to HR
 */
const handleMessageHR = async (employeeId, content) => {
    try {
        // Get employee info
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: { select: { name: true } }
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Find HR employees (in HR department)
        const hrEmployees = await prisma.employee.findMany({
            where: {
                department: { name: { contains: 'HR' } }
            },
            select: { id: true, name: true }
        });

        if (hrEmployees.length === 0) {
            // If no HR department found, create a general HR message
            await prisma.message.create({
                data: {
                    employee_id: employeeId,
                    content: `**HR Message Logged**\n\nYour message has been recorded for HR review:\n\n"${content}"`,
                    sender: 'bot',
                    message_type: 'request',
                    status: 'pending',
                    metadata: JSON.stringify({
                        action: 'hr_message_logged',
                        content: content
                    })
                }
            });

            return {
                success: true,
                message: 'Your message has been logged for HR review',
                note: 'HR department will be notified'
            };
        }

        // Send message to all HR employees
        for (const hr of hrEmployees) {
            await prisma.message.create({
                data: {
                    employee_id: hr.id,
                    content: `**HR Request from ${employee.name} (${employee.department.name}):**\n\n${content}`,
                    sender: 'bot',
                    message_type: 'request',
                    status: 'pending',
                    metadata: JSON.stringify({
                        action: 'hr_request',
                        fromEmployee: employeeId,
                        fromName: employee.name
                    })
                }
            });
        }

        return {
            success: true,
            message: `Message sent to HR department`,
            notifiedCount: hrEmployees.length
        };
    } catch (error) {
        console.error('handleMessageHR error:', error);
        return { success: false, error: 'Failed to send message to HR' };
    }
};

/**
 * Handle getting employee's tasks
 */
const handleGetMyTasks = async (employeeId, context) => {
    // Tasks are already in context
    if (context.tasks.length === 0) {
        return {
            success: true,
            message: 'You have no pending tasks',
            tasks: []
        };
    }

    return {
        success: true,
        message: `You have ${context.tasks.length} pending task(s)`,
        tasks: context.tasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority || 'medium',
            due_date: t.due_date ? new Date(t.due_date).toLocaleDateString() : null
        }))
    };
};

/**
 * Handle getting employee's attendance
 */
const handleGetMyAttendance = async (employeeId, context) => {
    if (context.attendance.length === 0) {
        return {
            success: true,
            message: 'No attendance records this week',
            attendance: []
        };
    }

    const records = context.attendance.map(a => ({
        date: new Date(a.date).toLocaleDateString(),
        status: a.status,
        checkIn: a.check_in ? new Date(a.check_in).toLocaleTimeString() : null,
        checkOut: a.check_out ? new Date(a.check_out).toLocaleTimeString() : null
    }));

    const summary = {
        present: context.attendance.filter(a => a.status === 'present').length,
        late: context.attendance.filter(a => a.status === 'late').length,
        absent: context.attendance.filter(a => a.status === 'absent').length,
        onLeave: context.attendance.filter(a => a.status === 'on_leave').length
    };

    return {
        success: true,
        message: `This week: ${summary.present} present, ${summary.late} late, ${summary.absent} absent, ${summary.onLeave} on leave`,
        attendance: records,
        summary: summary
    };
};

/**
 * Master action handler - routes to appropriate handler
 */
const createActionHandler = (employeeId, context) => {
    return async (toolName, toolInput) => {
        switch (toolName) {
            case 'createTask':
                return await handleCreateTask(employeeId, toolInput);
            case 'checkIn':
                return await handleCheckIn(employeeId);
            case 'checkOut':
                return await handleCheckOut(employeeId);
            case 'requestLeave':
                return await handleLeaveRequest(employeeId, toolInput);
            case 'messageManager':
                return await handleMessageManager(employeeId, toolInput.content);
            case 'messageHR':
                return await handleMessageHR(employeeId, toolInput.content);
            case 'getMyTasks':
                return await handleGetMyTasks(employeeId, context);
            case 'getMyAttendance':
                return await handleGetMyAttendance(employeeId, context);
            default:
                return { success: false, error: `Unknown action: ${toolName}` };
        }
    };
};

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
 * Generate mock bot response based on message content (fallback when AI unavailable)
 */
const generateMockResponse = async (message, context, employeeId) => {
    const lowerMessage = message.toLowerCase();

    // Check-in handling
    if (lowerMessage.includes('check me in') || lowerMessage.includes("i'm here") ||
        lowerMessage.includes('i arrived') || lowerMessage.includes('im here')) {
        if (employeeId) {
            const result = await handleCheckIn(employeeId);
            if (result.success) {
                return {
                    content: `${result.isLate ? '⚠️' : '✅'} ${result.message} at ${result.checkInTime}. Have a productive day, ${context.employee.name}!`,
                    messageType: 'report',
                    metadata: { action: 'check_in', ...result }
                };
            } else {
                return {
                    content: result.error,
                    messageType: 'report',
                    metadata: { action: 'check_in_failed', error: result.error }
                };
            }
        }
    }

    // Check-out handling
    if (lowerMessage.includes('check me out') || lowerMessage.includes("i'm leaving") ||
        lowerMessage.includes('logging off') || lowerMessage.includes('going home') ||
        lowerMessage.includes('im leaving')) {
        if (employeeId) {
            const result = await handleCheckOut(employeeId);
            if (result.success) {
                return {
                    content: `✅ ${result.message} See you tomorrow, ${context.employee.name}!`,
                    messageType: 'report',
                    metadata: { action: 'check_out', ...result }
                };
            } else {
                return {
                    content: result.error,
                    messageType: 'report',
                    metadata: { action: 'check_out_failed', error: result.error }
                };
            }
        }
    }

    // Create task handling
    if (lowerMessage.includes('create') && lowerMessage.includes('task') ||
        lowerMessage.includes('add') && lowerMessage.includes('task') ||
        lowerMessage.includes('remind me to')) {
        // Extract task details from message
        const titleMatch = message.match(/(?:create|add)\s+(?:a\s+)?task\s+(?:called\s+|titled\s+|named\s+)?["']?([^"']+?)["']?\s*(?:due|by|for|$)/i) ||
                          message.match(/remind me to\s+(.+?)(?:\s+(?:by|on|tomorrow|next|due)|$)/i);
        const title = titleMatch ? titleMatch[1].trim() : 'New Task';

        // Check for due date keywords
        let dueDate = null;
        if (lowerMessage.includes('tomorrow')) dueDate = 'tomorrow';
        else if (lowerMessage.includes('today')) dueDate = 'today';
        else if (lowerMessage.includes('next week')) dueDate = 'next week';
        else if (lowerMessage.includes('friday')) dueDate = 'friday';
        else if (lowerMessage.includes('monday')) dueDate = 'monday';

        if (employeeId) {
            const result = await handleCreateTask(employeeId, {
                title: title,
                due_date: dueDate,
                priority: lowerMessage.includes('urgent') || lowerMessage.includes('high priority') ? 'high' : 'medium'
            });

            if (result.success) {
                return {
                    content: `✅ Task created: **${result.task.title}**\n- Priority: ${result.task.priority}\n- Due: ${result.task.due_date || 'Not set'}\n- Status: ${result.task.status}`,
                    messageType: 'report',
                    metadata: { action: 'task_created', ...result }
                };
            } else {
                return {
                    content: `Failed to create task: ${result.error}`,
                    messageType: 'report',
                    metadata: { action: 'task_failed', error: result.error }
                };
            }
        }
    }

    // Leave request handling
    if ((lowerMessage.includes('need') || lowerMessage.includes('want') || lowerMessage.includes('request')) &&
        (lowerMessage.includes('off') || lowerMessage.includes('leave') || lowerMessage.includes('vacation'))) {
        // Extract date
        let leaveDate = null;
        if (lowerMessage.includes('tomorrow')) leaveDate = 'tomorrow';
        else if (lowerMessage.includes('friday')) leaveDate = 'friday';
        else if (lowerMessage.includes('monday')) leaveDate = 'monday';

        // Extract reason
        const reasonMatch = message.match(/(?:for|because|due to)\s+(.+?)(?:\.|$)/i);
        const reason = reasonMatch ? reasonMatch[1].trim() : 'Personal reason';

        if (leaveDate && employeeId) {
            const result = await handleLeaveRequest(employeeId, { date: leaveDate, reason });
            if (result.success) {
                return {
                    content: `✅ Leave request submitted for ${result.leaveDate}\n- Reason: ${result.reason}\n${result.managerNotified ? `- Manager (${result.managerNotified}) has been notified` : ''}`,
                    messageType: 'request',
                    metadata: { action: 'leave_requested', ...result }
                };
            }
        }
    }

    // Message manager
    if (lowerMessage.includes('tell') && lowerMessage.includes('manager') ||
        lowerMessage.includes('message') && lowerMessage.includes('manager') ||
        lowerMessage.includes('notify') && lowerMessage.includes('manager')) {
        const contentMatch = message.match(/(?:manager|boss|supervisor)\s+(?:that\s+)?(.+)/i);
        const msgContent = contentMatch ? contentMatch[1].trim() : message;

        if (employeeId && context.manager) {
            const result = await handleMessageManager(employeeId, msgContent);
            if (result.success) {
                return {
                    content: `✅ ${result.message}`,
                    messageType: 'request',
                    metadata: { action: 'message_sent_to_manager', ...result }
                };
            }
        } else if (!context.manager) {
            return {
                content: `You don't have a manager assigned. Would you like to message HR instead?`,
                messageType: 'request',
                metadata: { action: 'no_manager' }
            };
        }
    }

    // Message HR
    if (lowerMessage.includes('report to hr') || lowerMessage.includes('message hr') ||
        lowerMessage.includes('tell hr') || lowerMessage.includes('contact hr')) {
        const contentMatch = message.match(/(?:hr|human resources)\s+(?:about\s+|that\s+)?(.+)/i);
        const msgContent = contentMatch ? contentMatch[1].trim() : message;

        if (employeeId) {
            const result = await handleMessageHR(employeeId, msgContent);
            if (result.success) {
                return {
                    content: `✅ ${result.message}`,
                    messageType: 'request',
                    metadata: { action: 'message_sent_to_hr', ...result }
                };
            }
        }
    }

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
                `**Attendance**\n` +
                `- "Check me in" or "I'm here" - Record your arrival\n` +
                `- "Check me out" or "I'm leaving" - Record your departure\n` +
                `- "Show my attendance" - View this week's records\n\n` +
                `**Tasks**\n` +
                `- "Create a task called X due tomorrow" - Create new task\n` +
                `- "Show my tasks" - View your pending tasks\n` +
                `- "Remind me to X" - Quick task creation\n\n` +
                `**Leave Requests**\n` +
                `- "I need Friday off for a doctor appointment" - Request leave\n` +
                `- "Request vacation for tomorrow" - Submit leave\n\n` +
                `**Communication**\n` +
                `- "Tell my manager I'll be late" - Message your manager\n` +
                `- "Report to HR about the broken AC" - Message HR department\n\n` +
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

        // Create action handler for tool calls
        const actionHandler = createActionHandler(employeeId, context);

        // Try AI response first, fall back to mock if unavailable
        let botResponse = await generateAIResponse(content, context, actionHandler);

        // If AI failed or returned null, use mock response
        if (!botResponse) {
            console.log('Using mock response (AI unavailable or failed)');
            botResponse = await generateMockResponse(content, context, employeeId);
        }

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
