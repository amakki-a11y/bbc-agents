const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateAIResponse } = require('../services/aiService');
const cache = require('../utils/cache');

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

        if (!employee.user_id) {
            return { success: false, error: 'Employee account not linked to user. Please contact HR.' };
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
                user_id: employee.user_id,
                project_id: 1
            }
        });

        // Clear task cache
        cache.delByPrefix('tasks');

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
 * Handle updating an existing task
 */
const handleUpdateTask = async (employeeId, { task_id, task_title, new_title, description, priority, due_date, status }) => {
    try {
        // Get the employee's user_id
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { user_id: true, name: true }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        if (!employee.user_id) {
            return { success: false, error: 'Employee account not linked to user. Please contact HR.' };
        }

        // Find the task - by ID or by title
        let task;
        if (task_id) {
            task = await prisma.task.findFirst({
                where: { id: task_id, user_id: employee.user_id }
            });
        } else if (task_title) {
            task = await prisma.task.findFirst({
                where: {
                    user_id: employee.user_id,
                    title: { contains: task_title, mode: 'insensitive' }
                }
            });
        }

        if (!task) {
            return { success: false, error: `Task "${task_title || task_id}" not found` };
        }

        // Build update data - only include fields that were provided
        const updateData = {};
        if (new_title) updateData.title = new_title;
        if (description !== undefined) updateData.description = description;
        if (priority) updateData.priority = priority;
        if (status) updateData.status = status;
        if (due_date) {
            const parsedDueDate = parseRelativeDate(due_date);
            if (parsedDueDate) updateData.due_date = parsedDueDate;
        }

        if (Object.keys(updateData).length === 0) {
            return { success: false, error: 'No updates provided' };
        }

        // Update the task
        const updatedTask = await prisma.task.update({
            where: { id: task.id },
            data: updateData
        });

        // Clear task cache
        cache.delByPrefix('tasks');

        return {
            success: true,
            message: `Task "${updatedTask.title}" updated successfully`,
            task: {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                due_date: updatedTask.due_date ? updatedTask.due_date.toLocaleDateString() : null,
                status: updatedTask.status
            }
        };
    } catch (error) {
        console.error('handleUpdateTask error:', error);
        return { success: false, error: 'Failed to update task' };
    }
};

/**
 * Handle deleting a task
 */
const handleDeleteTask = async (employeeId, { task_id, task_title }) => {
    try {
        // Get the employee's user_id
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { user_id: true, name: true }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        if (!employee.user_id) {
            return { success: false, error: 'Employee account not linked to user. Please contact HR.' };
        }

        // Find the task - by ID or by title
        let task;
        if (task_id) {
            task = await prisma.task.findFirst({
                where: { id: task_id, user_id: employee.user_id }
            });
        } else if (task_title) {
            task = await prisma.task.findFirst({
                where: {
                    user_id: employee.user_id,
                    title: { contains: task_title, mode: 'insensitive' }
                }
            });
        }

        if (!task) {
            return { success: false, error: `Task "${task_title || task_id}" not found` };
        }

        // Delete the task
        await prisma.task.delete({
            where: { id: task.id }
        });

        // Clear task cache
        cache.delByPrefix('tasks');

        return {
            success: true,
            message: `Task "${task.title}" deleted successfully`,
            deletedTask: {
                id: task.id,
                title: task.title
            }
        };
    } catch (error) {
        console.error('handleDeleteTask error:', error);
        return { success: false, error: 'Failed to delete task' };
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

        // Clear attendance cache so pages refresh with new data
        cache.delByPrefix('attendance');

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

        // Clear attendance cache so pages refresh with new data
        cache.delByPrefix('attendance');

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

// ============================================
// NEW HANDLERS - MESSAGING
// ============================================

/**
 * Check if employee can message another employee based on hierarchy
 */
const canMessageEmployee = async (senderId, recipientId, senderContext) => {
    const recipient = await prisma.employee.findUnique({
        where: { id: recipientId },
        include: { department: true, role: true }
    });

    if (!recipient) return { allowed: false, reason: 'Recipient not found' };

    const senderRole = senderContext.role.name;
    const senderDeptId = senderContext.department.id;

    // Admin can message anyone
    if (senderRole === 'Admin') return { allowed: true };

    // Can always message own manager
    if (senderContext.manager && senderContext.manager.id === recipientId) {
        return { allowed: true };
    }

    // Can message HR department members
    if (recipient.department.name.toLowerCase().includes('hr')) {
        return { allowed: true };
    }

    // Same department
    if (recipient.department_id === senderDeptId) {
        return { allowed: true };
    }

    // Managers can message other managers
    if ((senderRole === 'Head of Department' || senderContext.subordinates?.length > 0) &&
        (recipient.role.name === 'Head of Department' || recipient.role.name === 'Admin')) {
        return { allowed: true };
    }

    // Check if recipient is a subordinate
    if (senderContext.subordinates?.some(s => s.id === recipientId)) {
        return { allowed: true };
    }

    return { allowed: false, reason: 'You can only message your manager, HR, or colleagues in your department' };
};

/**
 * Handle messaging a specific employee
 */
const handleMessageEmployee = async (employeeId, { employee_name, content, priority = 'normal' }, context) => {
    try {
        // Find the recipient by name
        const recipient = await prisma.employee.findFirst({
            where: {
                name: { contains: employee_name, mode: 'insensitive' }
            },
            include: { department: true }
        });

        if (!recipient) {
            return { success: false, error: `Could not find employee "${employee_name}"` };
        }

        // Check permission
        const permission = await canMessageEmployee(employeeId, recipient.id, context);
        if (!permission.allowed) {
            return { success: false, error: permission.reason };
        }

        // Get sender info
        const sender = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true }
        });

        // Create message for recipient
        await prisma.message.create({
            data: {
                employee_id: recipient.id,
                sender_employee_id: employeeId,
                content: `**Message from ${sender.name} (${sender.department.name}):**\n\n${content}`,
                sender: 'employee',
                message_type: 'request',
                priority: priority,
                status: 'pending',
                metadata: JSON.stringify({ fromEmployee: employeeId, fromName: sender.name })
            }
        });

        return {
            success: true,
            message: `Message sent to ${recipient.name}`,
            recipient: recipient.name,
            department: recipient.department.name
        };
    } catch (error) {
        console.error('handleMessageEmployee error:', error);
        return { success: false, error: 'Failed to send message' };
    }
};

/**
 * Handle escalating an issue
 */
const handleEscalateIssue = async (employeeId, { issue, urgency = 'normal' }, context) => {
    try {
        if (!context.manager) {
            return { success: false, error: 'No manager assigned to escalate to' };
        }

        const priorityMap = { normal: 'high', high: 'urgent', critical: 'urgent' };
        const priority = priorityMap[urgency] || 'high';

        // Create escalation message to manager
        await prisma.message.create({
            data: {
                employee_id: context.manager.id,
                sender_employee_id: employeeId,
                content: `**⚠️ ESCALATION from ${context.employee.name}**\n\n**Issue:** ${issue}\n**Urgency:** ${urgency}\n**Department:** ${context.department.name}\n\nPlease review and take action.`,
                sender: 'employee',
                message_type: 'escalation',
                priority: priority,
                status: 'pending',
                metadata: JSON.stringify({
                    action: 'escalation',
                    fromEmployee: employeeId,
                    urgency: urgency
                })
            }
        });

        return {
            success: true,
            message: `Issue escalated to ${context.manager.name}`,
            escalatedTo: context.manager.name,
            urgency: urgency
        };
    } catch (error) {
        console.error('handleEscalateIssue error:', error);
        return { success: false, error: 'Failed to escalate issue' };
    }
};

/**
 * Handle announcing to team (managers only)
 */
const handleAnnounceToTeam = async (employeeId, { content, priority = 'normal' }, context) => {
    try {
        // Check if user is a manager
        const subordinates = await prisma.employee.findMany({
            where: { manager_id: employeeId }
        });

        if (subordinates.length === 0) {
            return { success: false, error: 'You have no direct reports to announce to' };
        }

        // Send announcement to all subordinates
        for (const sub of subordinates) {
            await prisma.message.create({
                data: {
                    employee_id: sub.id,
                    sender_employee_id: employeeId,
                    content: `**📢 Team Announcement from ${context.employee.name}:**\n\n${content}`,
                    sender: 'employee',
                    message_type: 'announcement',
                    priority: priority,
                    status: 'pending',
                    metadata: JSON.stringify({ action: 'team_announcement', fromManager: employeeId })
                }
            });
        }

        return {
            success: true,
            message: `Announcement sent to ${subordinates.length} team member(s)`,
            recipientCount: subordinates.length
        };
    } catch (error) {
        console.error('handleAnnounceToTeam error:', error);
        return { success: false, error: 'Failed to send announcement' };
    }
};

/**
 * Handle checking messages
 */
const handleCheckMessages = async (employeeId) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                employee_id: employeeId,
                status: { in: ['pending', 'delivered'] },
                sender: { not: 'employee' }
            },
            orderBy: { created_at: 'desc' },
            take: 10,
            include: {
                senderEmployee: { select: { name: true, department: { select: { name: true } } } }
            }
        });

        const unreadCount = messages.filter(m => m.status !== 'read').length;

        return {
            success: true,
            unreadCount: unreadCount,
            messages: messages.map(m => ({
                id: m.id,
                from: m.senderEmployee?.name || 'System',
                preview: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
                priority: m.priority,
                type: m.message_type,
                time: m.created_at
            }))
        };
    } catch (error) {
        console.error('handleCheckMessages error:', error);
        return { success: false, error: 'Failed to check messages' };
    }
};

// ============================================
// NEW HANDLERS - MEETINGS
// ============================================

/**
 * Handle scheduling a meeting
 */
const handleScheduleMeeting = async (employeeId, { title, attendees, date, time, duration = 30, description }, context) => {
    try {
        // Parse attendee names
        const attendeeNames = attendees.split(',').map(n => n.trim());
        const attendeeRecords = await prisma.employee.findMany({
            where: {
                name: { in: attendeeNames.map(n => ({ contains: n, mode: 'insensitive' })) }
            }
        });

        // Try to find attendees by partial name match
        const foundAttendees = [];
        for (const name of attendeeNames) {
            const found = await prisma.employee.findFirst({
                where: { name: { contains: name, mode: 'insensitive' } }
            });
            if (found) foundAttendees.push(found);
        }

        if (foundAttendees.length === 0) {
            return { success: false, error: `Could not find any employees matching: ${attendees}` };
        }

        // Parse date and time
        const meetingDate = parseRelativeDate(date);
        if (!meetingDate) {
            return { success: false, error: 'Could not parse meeting date' };
        }

        // Parse time
        const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2] || '0');
            const ampm = timeMatch[3]?.toLowerCase();
            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
            meetingDate.setHours(hours, minutes, 0, 0);
        }

        const endTime = new Date(meetingDate.getTime() + duration * 60000);

        // Create meeting
        const meeting = await prisma.meeting.create({
            data: {
                title: title,
                description: description || null,
                organizer_id: employeeId,
                start_time: meetingDate,
                end_time: endTime,
                attendees: JSON.stringify(foundAttendees.map(a => a.id)),
                status: 'scheduled'
            }
        });

        // Notify attendees
        for (const attendee of foundAttendees) {
            await prisma.message.create({
                data: {
                    employee_id: attendee.id,
                    sender_employee_id: employeeId,
                    content: `**📅 Meeting Invitation**\n\n**Title:** ${title}\n**When:** ${meetingDate.toLocaleString()}\n**Duration:** ${duration} minutes\n**Organizer:** ${context.employee.name}\n${description ? `\n**Agenda:** ${description}` : ''}`,
                    sender: 'employee',
                    message_type: 'request',
                    priority: 'normal',
                    status: 'pending',
                    metadata: JSON.stringify({ action: 'meeting_invite', meetingId: meeting.id })
                }
            });
        }

        return {
            success: true,
            message: `Meeting "${title}" scheduled for ${meetingDate.toLocaleString()}`,
            meetingId: meeting.id,
            attendees: foundAttendees.map(a => a.name),
            startTime: meetingDate,
            duration: duration
        };
    } catch (error) {
        console.error('handleScheduleMeeting error:', error);
        return { success: false, error: 'Failed to schedule meeting' };
    }
};

/**
 * Handle getting meetings
 */
const handleGetMyMeetings = async (employeeId) => {
    try {
        const now = new Date();

        // Get meetings where user is organizer or attendee
        const meetings = await prisma.meeting.findMany({
            where: {
                OR: [
                    { organizer_id: employeeId },
                    { attendees: { contains: employeeId } }
                ],
                start_time: { gte: now },
                status: { not: 'cancelled' }
            },
            orderBy: { start_time: 'asc' },
            take: 10,
            include: {
                organizer: { select: { name: true } }
            }
        });

        return {
            success: true,
            meetings: meetings.map(m => ({
                id: m.id,
                title: m.title,
                organizer: m.organizer.name,
                startTime: m.start_time,
                endTime: m.end_time,
                status: m.status
            })),
            count: meetings.length
        };
    } catch (error) {
        console.error('handleGetMyMeetings error:', error);
        return { success: false, error: 'Failed to get meetings' };
    }
};

// ============================================
// NEW HANDLERS - APPROVALS
// ============================================

/**
 * Handle requesting approval
 */
const handleRequestApproval = async (employeeId, { request_type, title, description, amount }, context) => {
    try {
        if (!context.manager) {
            return { success: false, error: 'No manager assigned to request approval from' };
        }

        const approval = await prisma.approvalRequest.create({
            data: {
                requester_id: employeeId,
                approver_id: context.manager.id,
                request_type: request_type,
                title: title,
                description: description,
                amount: amount || null,
                status: 'pending',
                priority: 'normal'
            }
        });

        // Notify manager
        await prisma.message.create({
            data: {
                employee_id: context.manager.id,
                sender_employee_id: employeeId,
                content: `**✅ Approval Request**\n\n**Type:** ${request_type}\n**Title:** ${title}\n**From:** ${context.employee.name}\n${amount ? `**Amount:** $${amount}\n` : ''}\n**Details:** ${description}\n\nPlease review and approve/reject.`,
                sender: 'employee',
                message_type: 'request',
                priority: 'normal',
                status: 'pending',
                metadata: JSON.stringify({ action: 'approval_request', approvalId: approval.id })
            }
        });

        return {
            success: true,
            message: `Approval request sent to ${context.manager.name}`,
            requestId: approval.id,
            type: request_type
        };
    } catch (error) {
        console.error('handleRequestApproval error:', error);
        return { success: false, error: 'Failed to submit approval request' };
    }
};

/**
 * Handle getting pending approvals
 */
const handleGetPendingApprovals = async (employeeId, context) => {
    try {
        // Get requests made by user
        const myRequests = await prisma.approvalRequest.findMany({
            where: { requester_id: employeeId, status: 'pending' },
            include: { approver: { select: { name: true } } }
        });

        // Get requests to approve (if manager)
        const toApprove = await prisma.approvalRequest.findMany({
            where: { approver_id: employeeId, status: 'pending' },
            include: { requester: { select: { name: true } } }
        });

        return {
            success: true,
            myPendingRequests: myRequests.map(r => ({
                id: r.id,
                type: r.request_type,
                title: r.title,
                approver: r.approver.name,
                createdAt: r.created_at
            })),
            requestsToApprove: toApprove.map(r => ({
                id: r.id,
                type: r.request_type,
                title: r.title,
                requester: r.requester.name,
                amount: r.amount,
                createdAt: r.created_at
            }))
        };
    } catch (error) {
        console.error('handleGetPendingApprovals error:', error);
        return { success: false, error: 'Failed to get approvals' };
    }
};

/**
 * Handle approving a request
 */
const handleApproveRequest = async (employeeId, { request_id, notes }) => {
    try {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: request_id },
            include: { requester: true }
        });

        if (!request) {
            return { success: false, error: 'Request not found' };
        }

        if (request.approver_id !== employeeId) {
            return { success: false, error: 'You are not authorized to approve this request' };
        }

        await prisma.approvalRequest.update({
            where: { id: request_id },
            data: {
                status: 'approved',
                decision_notes: notes || null,
                decided_at: new Date()
            }
        });

        // Notify requester
        await prisma.message.create({
            data: {
                employee_id: request.requester_id,
                content: `**✅ Request Approved**\n\nYour ${request.request_type} request "${request.title}" has been approved.${notes ? `\n\n**Notes:** ${notes}` : ''}`,
                sender: 'bot',
                message_type: 'report',
                status: 'pending'
            }
        });

        return {
            success: true,
            message: `Request approved`,
            requestTitle: request.title
        };
    } catch (error) {
        console.error('handleApproveRequest error:', error);
        return { success: false, error: 'Failed to approve request' };
    }
};

/**
 * Handle rejecting a request
 */
const handleRejectRequest = async (employeeId, { request_id, reason }) => {
    try {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: request_id },
            include: { requester: true }
        });

        if (!request) {
            return { success: false, error: 'Request not found' };
        }

        if (request.approver_id !== employeeId) {
            return { success: false, error: 'You are not authorized to reject this request' };
        }

        await prisma.approvalRequest.update({
            where: { id: request_id },
            data: {
                status: 'rejected',
                decision_notes: reason,
                decided_at: new Date()
            }
        });

        // Notify requester
        await prisma.message.create({
            data: {
                employee_id: request.requester_id,
                content: `**❌ Request Rejected**\n\nYour ${request.request_type} request "${request.title}" has been rejected.\n\n**Reason:** ${reason}`,
                sender: 'bot',
                message_type: 'report',
                status: 'pending'
            }
        });

        return {
            success: true,
            message: `Request rejected`,
            requestTitle: request.title
        };
    } catch (error) {
        console.error('handleRejectRequest error:', error);
        return { success: false, error: 'Failed to reject request' };
    }
};

// ============================================
// NEW HANDLERS - TEAM MANAGEMENT
// ============================================

/**
 * Handle checking team status (managers only)
 */
const handleCheckTeamStatus = async (employeeId, context) => {
    try {
        const subordinates = await prisma.employee.findMany({
            where: { manager_id: employeeId },
            include: { department: true }
        });

        if (subordinates.length === 0) {
            return { success: false, error: 'You have no direct reports' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's attendance for team
        const attendance = await prisma.attendance.findMany({
            where: {
                employee_id: { in: subordinates.map(s => s.id) },
                date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            }
        });

        // Get pending tasks for team
        const tasks = await prisma.task.findMany({
            where: {
                user_id: { in: subordinates.filter(s => s.user_id).map(s => s.user_id) },
                status: { not: 'done' }
            }
        });

        const teamStatus = subordinates.map(sub => {
            const att = attendance.find(a => a.employee_id === sub.id);
            const subTasks = tasks.filter(t => t.user_id === sub.user_id);
            return {
                name: sub.name,
                status: att ? (att.check_in ? 'Present' : 'Expected') : 'No record',
                checkIn: att?.check_in ? new Date(att.check_in).toLocaleTimeString() : null,
                pendingTasks: subTasks.length
            };
        });

        const presentCount = teamStatus.filter(s => s.status === 'Present').length;

        return {
            success: true,
            teamSize: subordinates.length,
            presentToday: presentCount,
            team: teamStatus
        };
    } catch (error) {
        console.error('handleCheckTeamStatus error:', error);
        return { success: false, error: 'Failed to get team status' };
    }
};

/**
 * Handle delegating a task (managers only)
 */
const handleDelegateTask = async (employeeId, { employee_name, title, description, priority, due_date }, context) => {
    try {
        // Find the subordinate
        const subordinate = await prisma.employee.findFirst({
            where: {
                manager_id: employeeId,
                name: { contains: employee_name, mode: 'insensitive' }
            }
        });

        if (!subordinate) {
            return { success: false, error: `"${employee_name}" is not your direct report or not found` };
        }

        if (!subordinate.user_id) {
            return { success: false, error: `${subordinate.name} doesn't have a linked user account for tasks` };
        }

        const parsedDueDate = parseRelativeDate(due_date);

        // Create task for subordinate
        const task = await prisma.task.create({
            data: {
                title: title,
                description: description || `Delegated by ${context.employee.name}`,
                priority: priority || 'medium',
                due_date: parsedDueDate,
                status: 'todo',
                user_id: subordinate.user_id,
                project_id: 1
            }
        });

        // Notify subordinate
        await prisma.message.create({
            data: {
                employee_id: subordinate.id,
                sender_employee_id: employeeId,
                content: `**📋 Task Assigned**\n\n**Title:** ${title}\n**From:** ${context.employee.name}\n**Priority:** ${priority || 'medium'}\n${parsedDueDate ? `**Due:** ${parsedDueDate.toLocaleDateString()}` : ''}\n${description ? `\n**Description:** ${description}` : ''}`,
                sender: 'employee',
                message_type: 'request',
                priority: 'normal',
                status: 'pending',
                metadata: JSON.stringify({ action: 'task_delegated', taskId: task.id })
            }
        });

        return {
            success: true,
            message: `Task "${title}" delegated to ${subordinate.name}`,
            taskId: task.id,
            assignee: subordinate.name
        };
    } catch (error) {
        console.error('handleDelegateTask error:', error);
        return { success: false, error: 'Failed to delegate task' };
    }
};

// ============================================
// NEW HANDLERS - REMINDERS & SUMMARY
// ============================================

/**
 * Handle setting a reminder
 */
const handleSetReminder = async (employeeId, { content, remind_at, priority = 'normal' }) => {
    try {
        const reminderTime = parseRelativeDate(remind_at);
        if (!reminderTime) {
            return { success: false, error: 'Could not parse reminder time' };
        }

        // Parse time if included
        const timeMatch = remind_at.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2] || '0');
            const ampm = timeMatch[3]?.toLowerCase();
            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
            reminderTime.setHours(hours, minutes, 0, 0);
        }

        const reminder = await prisma.reminder.create({
            data: {
                employee_id: employeeId,
                content: content,
                remind_at: reminderTime,
                priority: priority,
                is_sent: false
            }
        });

        return {
            success: true,
            message: `Reminder set for ${reminderTime.toLocaleString()}`,
            reminderId: reminder.id,
            reminderTime: reminderTime
        };
    } catch (error) {
        console.error('handleSetReminder error:', error);
        return { success: false, error: 'Failed to set reminder' };
    }
};

/**
 * Handle getting reminders
 */
const handleGetReminders = async (employeeId) => {
    try {
        const reminders = await prisma.reminder.findMany({
            where: {
                employee_id: employeeId,
                is_sent: false,
                remind_at: { gte: new Date() }
            },
            orderBy: { remind_at: 'asc' },
            take: 10
        });

        return {
            success: true,
            reminders: reminders.map(r => ({
                id: r.id,
                content: r.content,
                remindAt: r.remind_at,
                priority: r.priority
            })),
            count: reminders.length
        };
    } catch (error) {
        console.error('handleGetReminders error:', error);
        return { success: false, error: 'Failed to get reminders' };
    }
};

/**
 * Handle getting leave balance
 */
const handleGetLeaveBalance = async (employeeId) => {
    try {
        const currentYear = new Date().getFullYear();

        const balances = await prisma.leaveBalance.findMany({
            where: {
                employee_id: employeeId,
                year: currentYear
            },
            include: { leave_type: true }
        });

        if (balances.length === 0) {
            return {
                success: true,
                message: 'No leave balances found for this year',
                balances: []
            };
        }

        return {
            success: true,
            year: currentYear,
            balances: balances.map(b => ({
                type: b.leave_type.name,
                total: b.total_days,
                used: b.used_days,
                pending: b.pending_days,
                remaining: b.total_days - b.used_days - b.pending_days
            }))
        };
    } catch (error) {
        console.error('handleGetLeaveBalance error:', error);
        return { success: false, error: 'Failed to get leave balance' };
    }
};

/**
 * Handle getting weekly summary
 */
const handleGetWeeklySummary = async (employeeId, context) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Attendance summary
        const attendance = context.attendance || [];
        const attendanceSummary = {
            present: attendance.filter(a => a.status === 'present').length,
            late: attendance.filter(a => a.status === 'late').length,
            absent: attendance.filter(a => a.status === 'absent').length
        };

        // Tasks completed this week
        const completedTasks = await prisma.task.count({
            where: {
                user_id: context.employee.user_id,
                status: 'done',
                updated_at: { gte: startOfWeek }
            }
        });

        // Pending tasks
        const pendingTasks = context.tasks?.length || 0;

        // Messages received this week
        const messagesReceived = await prisma.message.count({
            where: {
                employee_id: employeeId,
                created_at: { gte: startOfWeek }
            }
        });

        return {
            success: true,
            weekOf: startOfWeek.toLocaleDateString(),
            summary: {
                attendance: attendanceSummary,
                tasksCompleted: completedTasks,
                tasksPending: pendingTasks,
                messagesReceived: messagesReceived
            }
        };
    } catch (error) {
        console.error('handleGetWeeklySummary error:', error);
        return { success: false, error: 'Failed to get weekly summary' };
    }
};

// ============================================
// EXECUTIVE HANDLERS: PEOPLE & PRESENCE
// ============================================

/**
 * Get employees currently in the office (checked in, not checked out)
 */
const handleGetWhosInOffice = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const inOffice = await prisma.attendance.findMany({
            where: {
                date: { gte: today, lt: tomorrow },
                check_in: { not: null },
                check_out: null
            },
            include: {
                employee: {
                    select: { name: true, department: { select: { name: true } } }
                }
            }
        });

        const names = inOffice.map(a => a.employee.name);
        const displayNames = names.length > 5
            ? `${names.slice(0, 5).join(', ')} +${names.length - 5} more`
            : names.join(', ');
        return {
            success: true,
            count: inOffice.length,
            employees: names,
            message: inOffice.length > 0
                ? `${inOffice.length} in office: ${displayNames}`
                : 'No one in office yet'
        };
    } catch (error) {
        console.error('handleGetWhosInOffice error:', error);
        return { success: false, error: 'Failed to get office status' };
    }
};

/**
 * Get employees who are absent today (no attendance record)
 */
const handleGetWhosAbsent = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Get all active employees
        const allEmployees = await prisma.employee.findMany({
            where: { status: 'active' },
            select: { id: true, name: true, department: { select: { name: true } } }
        });

        // Get employees with attendance today
        const attendanceToday = await prisma.attendance.findMany({
            where: {
                date: { gte: today, lt: tomorrow }
            },
            select: { employee_id: true }
        });

        const presentIds = new Set(attendanceToday.map(a => a.employee_id));
        const absent = allEmployees.filter(e => !presentIds.has(e.id));

        // Check for on-leave employees
        const onLeave = await prisma.attendance.findMany({
            where: {
                employee_id: { in: absent.map(e => e.id) },
                date: { gte: today, lt: tomorrow },
                status: 'on_leave'
            },
            select: { employee_id: true, notes: true }
        });
        const leaveMap = new Map(onLeave.map(l => [l.employee_id, l.notes || 'leave']));

        const absentList = absent.map(e => {
            const reason = leaveMap.get(e.id);
            return reason ? `${e.name} (${reason})` : `${e.name} (no show)`;
        });

        const displayList = absentList.length > 5
            ? `${absentList.slice(0, 5).join(', ')} +${absentList.length - 5} more`
            : absentList.join(', ');

        return {
            success: true,
            count: absent.length,
            employees: absent.map(e => e.name),
            message: absent.length > 0
                ? `${absent.length} absent: ${displayList}`
                : '✓ Everyone is present!'
        };
    } catch (error) {
        console.error('handleGetWhosAbsent error:', error);
        return { success: false, error: 'Failed to get absence status' };
    }
};

/**
 * Check if a specific employee is available/in office
 */
const handleCheckEmployeeAvailability = async ({ employee_name }) => {
    try {
        const employee = await prisma.employee.findFirst({
            where: { name: { contains: employee_name, mode: 'insensitive' } },
            select: { id: true, name: true, status: true }
        });

        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.id,
                date: { gte: today, lt: tomorrow }
            }
        });

        let status = 'absent';
        let checkInTime = null;
        let message = '';

        if (attendance) {
            if (attendance.check_in && !attendance.check_out) {
                status = 'in office';
                checkInTime = attendance.check_in;
                message = `Yes, ${employee.name} checked in at ${new Date(checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else if (attendance.check_out) {
                status = 'left';
                message = `No, ${employee.name} left at ${new Date(attendance.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else if (attendance.status === 'on_leave') {
                status = 'on leave';
                message = `No, ${employee.name} is on leave today`;
            }
        } else {
            message = `No, ${employee.name} hasn't checked in yet`;
        }

        return {
            success: true,
            name: employee.name,
            status: status,
            checkInTime: checkInTime ? new Date(checkInTime).toLocaleTimeString() : null,
            message
        };
    } catch (error) {
        console.error('handleCheckEmployeeAvailability error:', error);
        return { success: false, error: 'Failed to check availability' };
    }
};

/**
 * Get attendance status of all employees in a department
 */
const handleGetDepartmentStatus = async ({ department_name }) => {
    try {
        const department = await prisma.department.findFirst({
            where: { name: { contains: department_name, mode: 'insensitive' } }
        });

        if (!department) {
            return { success: false, error: `Department "${department_name}" not found` };
        }

        const employees = await prisma.employee.findMany({
            where: { department_id: department.id, status: 'active' },
            select: { id: true, name: true }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                employee_id: { in: employees.map(e => e.id) },
                date: { gte: today, lt: tomorrow }
            }
        });

        const attendanceMap = new Map(attendanceRecords.map(a => [a.employee_id, a]));

        const statusList = employees.map(e => {
            const att = attendanceMap.get(e.id);
            let status = 'absent';
            if (att?.check_in && !att?.check_out) status = 'in';
            else if (att?.check_out) status = 'left';
            else if (att?.status === 'on_leave') status = 'leave';
            return { name: e.name, status };
        });

        const inOffice = statusList.filter(s => s.status === 'in');
        const absent = statusList.filter(s => s.status === 'absent');

        return {
            success: true,
            department: department.name,
            total: employees.length,
            inOffice: inOffice.length,
            absent: absent.length,
            details: statusList,
            message: `${department.name}: ${inOffice.length}/${employees.length} in office`
        };
    } catch (error) {
        console.error('handleGetDepartmentStatus error:', error);
        return { success: false, error: 'Failed to get department status' };
    }
};

// ============================================
// EXECUTIVE HANDLERS: PERFORMANCE & ANALYTICS
// ============================================

/**
 * Get total hours worked by an employee
 */
const handleGetEmployeeHoursWorked = async ({ employee_name, period = 'week' }) => {
    try {
        const employee = await prisma.employee.findFirst({
            where: { name: { contains: employee_name, mode: 'insensitive' } },
            select: { id: true, name: true }
        });

        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const today = new Date();
        let startDate = new Date(today);

        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate.setDate(today.getDate() - today.getDay());
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'month') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }

        const attendance = await prisma.attendance.findMany({
            where: {
                employee_id: employee.id,
                date: { gte: startDate },
                check_in: { not: null },
                check_out: { not: null }
            }
        });

        let totalMinutes = 0;
        for (const record of attendance) {
            const diff = record.check_out - record.check_in;
            totalMinutes += Math.floor(diff / (1000 * 60));
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
            success: true,
            name: employee.name,
            period: period,
            hoursWorked: `${hours}h ${minutes}m`,
            daysWorked: attendance.length,
            message: `${employee.name}: ${hours}h ${minutes}m this ${period} (${attendance.length} days)`
        };
    } catch (error) {
        console.error('handleGetEmployeeHoursWorked error:', error);
        return { success: false, error: 'Failed to get hours worked' };
    }
};

/**
 * Get productivity metrics for an employee
 */
const handleGetEmployeeProductivity = async ({ employee_name }) => {
    try {
        const employee = await prisma.employee.findFirst({
            where: { name: { contains: employee_name, mode: 'insensitive' } },
            include: { user: { select: { id: true } } }
        });

        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Tasks this week
        const tasks = employee.user ? await prisma.task.findMany({
            where: { user_id: employee.user.id }
        }) : [];

        const tasksCompleted = tasks.filter(t => t.status === 'done').length;
        const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
        const tasksTodo = tasks.filter(t => t.status === 'todo').length;

        // Attendance this week
        const attendance = await prisma.attendance.findMany({
            where: {
                employee_id: employee.id,
                date: { gte: startOfWeek },
                check_in: { not: null }
            }
        });

        // Calculate hours
        let totalMinutes = 0;
        for (const record of attendance) {
            if (record.check_out) {
                totalMinutes += Math.floor((record.check_out - record.check_in) / (1000 * 60));
            }
        }

        const workDays = 5; // Assuming 5-day work week
        const attendanceRate = Math.round((attendance.length / workDays) * 100);

        return {
            success: true,
            name: employee.name,
            tasks: { done: tasksCompleted, inProgress: tasksInProgress, todo: tasksTodo },
            hoursWorked: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
            attendanceRate: `${attendanceRate}%`,
            message: `${employee.name}: ${tasksCompleted} done, ${tasksInProgress} in progress | ${Math.floor(totalMinutes / 60)}h worked | ${attendanceRate}% attendance`
        };
    } catch (error) {
        console.error('handleGetEmployeeProductivity error:', error);
        return { success: false, error: 'Failed to get productivity' };
    }
};

/**
 * Get leaderboard of employees by tasks completed
 */
const handleGetTaskLeaderboard = async ({ period = 'week', limit = 5 }) => {
    try {
        const today = new Date();
        let startDate = new Date(today);

        if (period === 'week') {
            startDate.setDate(today.getDate() - today.getDay());
        } else {
            startDate.setDate(1);
        }
        startDate.setHours(0, 0, 0, 0);

        // Get all completed tasks this period with user info
        const completedTasks = await prisma.task.findMany({
            where: {
                status: 'done',
                updated_at: { gte: startDate }
            },
            include: {
                user: {
                    include: {
                        employee: { select: { name: true } }
                    }
                }
            }
        });

        // Count by user
        const userCounts = {};
        for (const task of completedTasks) {
            const name = task.user?.employee?.name || `User ${task.user_id}`;
            userCounts[name] = (userCounts[name] || 0) + 1;
        }

        // Sort and get top performers
        const medals = ['🥇', '🥈', '🥉'];
        const leaderboard = Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count], i) => ({ rank: i + 1, name, tasksCompleted: count }));

        const formatEntry = (entry, i) => {
            const medal = i < 3 ? medals[i] : `${i + 1}.`;
            return `${medal} ${entry.name} (${entry.tasksCompleted})`;
        };

        return {
            success: true,
            period: period,
            leaderboard: leaderboard,
            message: leaderboard.length > 0
                ? leaderboard.slice(0, 5).map((l, i) => formatEntry(l, i)).join(' ')
                : 'No completed tasks this period'
        };
    } catch (error) {
        console.error('handleGetTaskLeaderboard error:', error);
        return { success: false, error: 'Failed to get leaderboard' };
    }
};

/**
 * Get team attendance rate
 */
const handleGetTeamAttendanceRate = async ({ department_name }) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        let whereClause = { status: 'active' };
        if (department_name) {
            const dept = await prisma.department.findFirst({
                where: { name: { contains: department_name, mode: 'insensitive' } }
            });
            if (dept) {
                whereClause.department_id = dept.id;
            }
        }

        const employees = await prisma.employee.findMany({
            where: whereClause,
            select: { id: true, name: true }
        });

        const workDays = Math.min(today.getDay() || 7, 5); // Days so far this week (max 5)
        const expectedAttendance = employees.length * workDays;

        const actualAttendance = await prisma.attendance.count({
            where: {
                employee_id: { in: employees.map(e => e.id) },
                date: { gte: startOfWeek },
                check_in: { not: null }
            }
        });

        const rate = expectedAttendance > 0
            ? Math.round((actualAttendance / expectedAttendance) * 100)
            : 0;

        return {
            success: true,
            department: department_name || 'All',
            employeeCount: employees.length,
            attendanceRate: `${rate}%`,
            present: actualAttendance,
            expected: expectedAttendance,
            message: `${department_name || 'Team'} attendance: ${rate}% (${actualAttendance}/${expectedAttendance} check-ins this week)`
        };
    } catch (error) {
        console.error('handleGetTeamAttendanceRate error:', error);
        return { success: false, error: 'Failed to get attendance rate' };
    }
};

// ============================================
// EXECUTIVE HANDLERS: TASK MANAGEMENT
// ============================================

/**
 * Assign a task to an employee
 */
const handleAssignTask = async (employeeId, { employee_name, title, description, priority, due_date }) => {
    try {
        const targetEmployee = await prisma.employee.findFirst({
            where: { name: { contains: employee_name, mode: 'insensitive' } },
            include: { user: { select: { id: true } } }
        });

        if (!targetEmployee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        if (!targetEmployee.user) {
            return { success: false, error: `${targetEmployee.name} has no user account linked` };
        }

        const parsedDueDate = parseRelativeDate(due_date);

        const task = await prisma.task.create({
            data: {
                title: title,
                description: description || null,
                priority: priority || 'medium',
                due_date: parsedDueDate,
                status: 'todo',
                user_id: targetEmployee.user.id,
                project_id: 1
            }
        });

        cache.delByPrefix('tasks');

        return {
            success: true,
            message: `Task assigned to ${targetEmployee.name}: "${title}"`,
            task: { id: task.id, title, assignee: targetEmployee.name, priority: priority || 'medium' }
        };
    } catch (error) {
        console.error('handleAssignTask error:', error);
        return { success: false, error: 'Failed to assign task' };
    }
};

/**
 * Get an employee's task progress
 */
const handleGetEmployeeProgress = async ({ employee_name }) => {
    try {
        const employee = await prisma.employee.findFirst({
            where: { name: { contains: employee_name, mode: 'insensitive' } },
            include: { user: { select: { id: true } } }
        });

        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        if (!employee.user) {
            return { success: false, error: `${employee.name} has no user account linked` };
        }

        const tasks = await prisma.task.findMany({
            where: { user_id: employee.user.id },
            select: { title: true, status: true, priority: true, due_date: true }
        });

        const today = new Date();
        const done = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const todo = tasks.filter(t => t.status === 'todo').length;
        const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length;

        return {
            success: true,
            name: employee.name,
            total: tasks.length,
            done, inProgress, todo, overdue,
            message: `${employee.name}: ${done} done, ${inProgress} in progress, ${todo} todo${overdue > 0 ? `, ${overdue} overdue` : ''}`
        };
    } catch (error) {
        console.error('handleGetEmployeeProgress error:', error);
        return { success: false, error: 'Failed to get progress' };
    }
};

/**
 * Get all overdue tasks
 */
const handleGetOverdueTasks = async ({ employee_name }) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let whereClause = {
            status: { not: 'done' },
            due_date: { lt: today }
        };

        if (employee_name) {
            const employee = await prisma.employee.findFirst({
                where: { name: { contains: employee_name, mode: 'insensitive' } },
                include: { user: { select: { id: true } } }
            });
            if (employee?.user) {
                whereClause.user_id = employee.user.id;
            }
        }

        const overdueTasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                user: {
                    include: { employee: { select: { name: true } } }
                }
            },
            orderBy: { due_date: 'asc' }
        });

        const taskList = overdueTasks.map(t => {
            const daysOverdue = Math.floor((today - new Date(t.due_date)) / (1000 * 60 * 60 * 24));
            return {
                title: t.title,
                assignee: t.user?.employee?.name || 'Unassigned',
                daysOverdue,
                priority: t.priority
            };
        });

        return {
            success: true,
            count: taskList.length,
            tasks: taskList,
            message: taskList.length > 0
                ? `${taskList.length} overdue: ${taskList.slice(0, 5).map(t => `${t.title} (${t.assignee}, ${t.daysOverdue}d)`).join(', ')}${taskList.length > 5 ? '...' : ''}`
                : 'No overdue tasks'
        };
    } catch (error) {
        console.error('handleGetOverdueTasks error:', error);
        return { success: false, error: 'Failed to get overdue tasks' };
    }
};

/**
 * Reassign a task to a different employee
 */
const handleReassignTask = async ({ task_title, new_employee_name }) => {
    try {
        const task = await prisma.task.findFirst({
            where: { title: { contains: task_title, mode: 'insensitive' } },
            include: { user: { include: { employee: { select: { name: true } } } } }
        });

        if (!task) {
            return { success: false, error: `Task "${task_title}" not found` };
        }

        const newEmployee = await prisma.employee.findFirst({
            where: { name: { contains: new_employee_name, mode: 'insensitive' } },
            include: { user: { select: { id: true } } }
        });

        if (!newEmployee) {
            return { success: false, error: `Employee "${new_employee_name}" not found` };
        }

        if (!newEmployee.user) {
            return { success: false, error: `${newEmployee.name} has no user account linked` };
        }

        const oldAssignee = task.user?.employee?.name || 'Unassigned';

        await prisma.task.update({
            where: { id: task.id },
            data: { user_id: newEmployee.user.id }
        });

        cache.delByPrefix('tasks');

        return {
            success: true,
            message: `Task "${task.title}" reassigned: ${oldAssignee} → ${newEmployee.name}`,
            task: { title: task.title, from: oldAssignee, to: newEmployee.name }
        };
    } catch (error) {
        console.error('handleReassignTask error:', error);
        return { success: false, error: 'Failed to reassign task' };
    }
};

// ============================================
// EXECUTIVE HANDLERS: QUICK REPORTS
// ============================================

/**
 * Get daily standup report
 */
const handleGetDailyStandupReport = async (employeeId, context) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Who's in
        const inOffice = await prisma.attendance.findMany({
            where: {
                date: { gte: today, lt: tomorrow },
                check_in: { not: null },
                check_out: null
            },
            include: { employee: { select: { name: true } } }
        });

        // Today's tasks (for current user's team or all)
        const todayTasks = await prisma.task.findMany({
            where: {
                OR: [
                    { due_date: { gte: today, lt: tomorrow } },
                    { status: 'in_progress' }
                ]
            },
            include: { user: { include: { employee: { select: { name: true } } } } },
            take: 10
        });

        // Today's meetings
        const meetings = await prisma.meeting.findMany({
            where: {
                start_time: { gte: today, lt: tomorrow },
                status: { not: 'cancelled' }
            },
            take: 5
        });

        const inOfficeNames = inOffice.map(a => a.employee.name);

        return {
            success: true,
            date: today.toLocaleDateString(),
            inOffice: { count: inOffice.length, names: inOfficeNames },
            todayTasks: todayTasks.length,
            meetings: meetings.length,
            message: `Daily standup: ${inOffice.length} in office, ${todayTasks.length} tasks due, ${meetings.length} meetings`
        };
    } catch (error) {
        console.error('handleGetDailyStandupReport error:', error);
        return { success: false, error: 'Failed to get standup report' };
    }
};

/**
 * Get red flags - issues needing attention
 */
const handleGetRedFlags = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Overdue tasks
        const overdueTasks = await prisma.task.count({
            where: {
                status: { not: 'done' },
                due_date: { lt: today }
            }
        });

        // Absent today
        const allActive = await prisma.employee.count({ where: { status: 'active' } });
        const presentToday = await prisma.attendance.count({
            where: {
                date: { gte: today, lt: tomorrow },
                check_in: { not: null }
            }
        });
        const absentCount = allActive - presentToday;

        // Pending approvals
        const pendingApprovals = await prisma.approvalRequest.count({
            where: { status: 'pending' }
        });

        // High priority overdue
        const highPriorityOverdue = await prisma.task.count({
            where: {
                status: { not: 'done' },
                due_date: { lt: today },
                priority: 'high'
            }
        });

        const flags = [];
        if (overdueTasks > 0) flags.push(`${overdueTasks} overdue tasks`);
        if (absentCount > 0) flags.push(`${absentCount} absent`);
        if (pendingApprovals > 0) flags.push(`${pendingApprovals} pending approvals`);
        if (highPriorityOverdue > 0) flags.push(`${highPriorityOverdue} high-priority overdue`);

        return {
            success: true,
            flags: {
                overdueTasks,
                absentEmployees: absentCount,
                pendingApprovals,
                highPriorityOverdue
            },
            message: flags.length > 0
                ? `⚠️ Red flags: ${flags.join(', ')}`
                : '✓ No red flags - all clear!'
        };
    } catch (error) {
        console.error('handleGetRedFlags error:', error);
        return { success: false, error: 'Failed to get red flags' };
    }
};

/**
 * Get project status
 */
const handleGetProjectStatus = async ({ project_name }) => {
    try {
        const project = await prisma.project.findFirst({
            where: { name: { contains: project_name, mode: 'insensitive' } },
            include: {
                tasks: {
                    select: { title: true, status: true, priority: true, due_date: true }
                }
            }
        });

        if (!project) {
            return { success: false, error: `Project "${project_name}" not found` };
        }

        const tasks = project.tasks;
        const today = new Date();
        const done = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const todo = tasks.filter(t => t.status === 'todo').length;
        const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length;

        const completionRate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

        return {
            success: true,
            project: project.name,
            total: tasks.length,
            done, inProgress, todo, overdue,
            completionRate: `${completionRate}%`,
            message: `${project.name}: ${completionRate}% complete (${done}/${tasks.length} done, ${inProgress} in progress${overdue > 0 ? `, ${overdue} overdue` : ''})`
        };
    } catch (error) {
        console.error('handleGetProjectStatus error:', error);
        return { success: false, error: 'Failed to get project status' };
    }
};

/**
 * Find employees who need help (overdue tasks, low completion)
 */
const handleGetWhoNeedsHelp = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        // Get all employees with their tasks
        const employees = await prisma.employee.findMany({
            where: { status: 'active' },
            include: {
                user: {
                    include: {
                        tasks: {
                            select: { status: true, due_date: true, updated_at: true }
                        }
                    }
                }
            }
        });

        const struggling = [];

        for (const emp of employees) {
            const tasks = emp.user?.tasks || [];
            const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length;
            const completedThisWeek = tasks.filter(t => t.status === 'done' && new Date(t.updated_at) >= startOfWeek).length;
            const totalPending = tasks.filter(t => t.status !== 'done').length;

            if (overdue >= 3 || (totalPending > 5 && completedThisWeek === 0)) {
                struggling.push({
                    name: emp.name,
                    overdue,
                    completedThisWeek,
                    issue: overdue >= 3 ? `${overdue} overdue` : '0 completed this week'
                });
            }
        }

        struggling.sort((a, b) => b.overdue - a.overdue);

        return {
            success: true,
            count: struggling.length,
            employees: struggling.slice(0, 5),
            message: struggling.length > 0
                ? `⚠️ ${struggling.slice(0, 3).map(s => `${s.name}: ${s.issue}`).join('. ')}${struggling.length > 3 ? ` +${struggling.length - 3} more` : ''}`
                : '✓ Everyone is on track!'
        };
    } catch (error) {
        console.error('handleGetWhoNeedsHelp error:', error);
        return { success: false, error: 'Failed to check who needs help' };
    }
};

/**
 * Quick pulse check - company status overview
 */
const handleGetPulseCheck = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Attendance
        const totalActive = await prisma.employee.count({ where: { status: 'active' } });
        const checkedIn = await prisma.attendance.count({
            where: {
                date: { gte: today, lt: tomorrow },
                check_in: { not: null }
            }
        });
        const attendanceRate = totalActive > 0 ? Math.round((checkedIn / totalActive) * 100) : 0;

        // Tasks due today
        const tasksDueToday = await prisma.task.count({
            where: {
                due_date: { gte: today, lt: tomorrow },
                status: { not: 'done' }
            }
        });

        // Issues (overdue + pending approvals)
        const overdue = await prisma.task.count({
            where: { status: { not: 'done' }, due_date: { lt: today } }
        });
        const pendingApprovals = await prisma.approvalRequest.count({
            where: { status: 'pending' }
        });
        const issues = overdue + pendingApprovals;

        return {
            success: true,
            stats: { attendanceRate, checkedIn, totalActive, tasksDueToday, overdue, pendingApprovals },
            message: `📊 ${attendanceRate}% attendance (${checkedIn}/${totalActive}) | ${tasksDueToday} tasks due today | ${issues > 0 ? `${issues} issues` : 'No issues'}`
        };
    } catch (error) {
        console.error('handleGetPulseCheck error:', error);
        return { success: false, error: 'Failed to get pulse check' };
    }
};

/**
 * End of day wrap-up - today summary + tomorrow preview
 */
const handleGetEndOfDayWrapup = async (employeeId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const dayAfter = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

        // Today's completed tasks
        const completedToday = await prisma.task.count({
            where: {
                status: 'done',
                updated_at: { gte: today, lt: tomorrow }
            }
        });

        // Still pending today
        const pendingToday = await prisma.task.count({
            where: {
                due_date: { gte: today, lt: tomorrow },
                status: { not: 'done' }
            }
        });

        // Tomorrow's meetings
        const tomorrowMeetings = await prisma.meeting.count({
            where: {
                start_time: { gte: tomorrow, lt: dayAfter },
                status: { not: 'cancelled' }
            }
        });

        // Tomorrow's tasks due
        const tomorrowTasks = await prisma.task.count({
            where: {
                due_date: { gte: tomorrow, lt: dayAfter },
                status: { not: 'done' }
            }
        });

        return {
            success: true,
            today: { completed: completedToday, pending: pendingToday },
            tomorrow: { meetings: tomorrowMeetings, tasksDue: tomorrowTasks },
            message: `Today: ${completedToday} done, ${pendingToday} pending. Tomorrow: ${tomorrowMeetings} meetings, ${tomorrowTasks} tasks due`
        };
    } catch (error) {
        console.error('handleGetEndOfDayWrapup error:', error);
        return { success: false, error: 'Failed to get wrap-up' };
    }
};

/**
 * Daily Briefing - comprehensive morning update
 */
const handleGetDailyBriefing = async (employeeId, context) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const employeeName = context.employee.name;
        const isAdmin = context.role.name === 'Admin';
        const isManager = context.subordinates && context.subordinates.length > 0;

        // ========== COMPANY PULSE ==========
        const totalActive = await prisma.employee.count({ where: { status: 'active' } });
        const checkedInToday = await prisma.attendance.count({
            where: { date: { gte: today, lt: tomorrow }, check_in: { not: null } }
        });
        const attendanceRate = totalActive > 0 ? Math.round((checkedInToday / totalActive) * 100) : 0;

        // On leave today
        const onLeaveToday = await prisma.attendance.count({
            where: { date: { gte: today, lt: tomorrow }, status: 'on_leave' }
        });

        // Absent without notice (no attendance record at all)
        const employeesWithAttendance = await prisma.attendance.findMany({
            where: { date: { gte: today, lt: tomorrow } },
            select: { employee_id: true }
        });
        const presentIds = new Set(employeesWithAttendance.map(a => a.employee_id));
        const absentWithoutNotice = totalActive - presentIds.size;

        // Tasks completed yesterday (company-wide)
        const completedYesterday = await prisma.task.count({
            where: { status: 'done', updated_at: { gte: yesterday, lt: today } }
        });

        // ========== NEEDS ATTENTION ==========
        // Pending approvals for this user (if manager/admin)
        let pendingApprovals = 0;
        if (isManager || isAdmin) {
            pendingApprovals = await prisma.approvalRequest.count({
                where: { approver_id: employeeId, status: 'pending' }
            });
        }

        // Overdue tasks (personal for employees, company-wide for admins/managers)
        let overdueTasks = 0;
        if (isAdmin) {
            overdueTasks = await prisma.task.count({
                where: { status: { not: 'done' }, due_date: { lt: today } }
            });
        } else if (context.employee.user_id) {
            overdueTasks = await prisma.task.count({
                where: { user_id: context.employee.user_id, status: { not: 'done' }, due_date: { lt: today } }
            });
        }

        // Escalated issues (messages with priority urgent/high for managers)
        let escalatedIssues = 0;
        if (isManager || isAdmin) {
            escalatedIssues = await prisma.message.count({
                where: { employee_id: employeeId, priority: { in: ['urgent', 'high'] }, status: { not: 'read' } }
            });
        }

        // ========== YOUR DAY ==========
        // User's meetings today
        const myMeetingsToday = await prisma.meeting.count({
            where: {
                OR: [
                    { organizer_id: employeeId },
                    { attendees: { contains: employeeId } }
                ],
                start_time: { gte: today, lt: tomorrow },
                status: { not: 'cancelled' }
            }
        });

        // User's tasks due today
        let myTasksDueToday = 0;
        if (context.employee.user_id) {
            myTasksDueToday = await prisma.task.count({
                where: { user_id: context.employee.user_id, due_date: { gte: today, lt: tomorrow }, status: { not: 'done' } }
            });
        }

        // Unread messages
        const unreadMessages = context.unreadMessages || 0;

        // ========== AI INSIGHT ==========
        let insight = '';

        // Find top performer this week
        const tasksThisWeek = await prisma.task.findMany({
            where: { status: 'done', updated_at: { gte: startOfWeek } },
            include: { user: { include: { employee: { select: { name: true } } } } }
        });

        const performerCounts = {};
        for (const task of tasksThisWeek) {
            const name = task.user?.employee?.name;
            if (name) performerCounts[name] = (performerCounts[name] || 0) + 1;
        }

        const topPerformer = Object.entries(performerCounts).sort((a, b) => b[1] - a[1])[0];

        // Find someone struggling (5+ overdue)
        const strugglingEmployee = await prisma.task.groupBy({
            by: ['user_id'],
            where: { status: { not: 'done' }, due_date: { lt: today } },
            _count: { id: true },
            having: { id: { _count: { gte: 5 } } },
            take: 1
        });

        let strugglingName = null;
        let strugglingCount = 0;
        if (strugglingEmployee.length > 0) {
            const user = await prisma.user.findUnique({
                where: { id: strugglingEmployee[0].user_id },
                include: { employee: { select: { name: true } } }
            });
            strugglingName = user?.employee?.name;
            strugglingCount = strugglingEmployee[0]._count.id;
        }

        // Find project near completion
        const projects = await prisma.project.findMany({
            include: { tasks: { select: { status: true } } }
        });
        let nearCompleteProject = null;
        for (const project of projects) {
            if (project.tasks.length >= 5) {
                const done = project.tasks.filter(t => t.status === 'done').length;
                const rate = Math.round((done / project.tasks.length) * 100);
                if (rate >= 80 && rate < 100) {
                    nearCompleteProject = { name: project.name, rate };
                    break;
                }
            }
        }

        // Pick insight
        if (topPerformer && topPerformer[1] >= 10) {
            insight = `💡 ${topPerformer[0]} completed ${topPerformer[1]} tasks this week - top performer!`;
        } else if (strugglingName && (isManager || isAdmin)) {
            insight = `💡 ${strugglingName} has ${strugglingCount} overdue tasks - may need support`;
        } else if (nearCompleteProject) {
            insight = `💡 Project "${nearCompleteProject.name}" is ${nearCompleteProject.rate}% complete - almost there!`;
        } else if (attendanceRate === 100) {
            insight = `💡 100% attendance today - great team commitment!`;
        } else if (topPerformer) {
            insight = `💡 ${topPerformer[0]} leads with ${topPerformer[1]} tasks completed this week`;
        }

        // ========== BUILD BRIEFING ==========
        const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';

        let briefing = `☀️ ${greeting}, ${employeeName}! Here's your briefing:\n\n`;

        briefing += `📊 **COMPANY PULSE**\n`;
        briefing += `• ${checkedInToday}/${totalActive} employees in office (${attendanceRate}%)\n`;
        if (onLeaveToday > 0 || absentWithoutNotice > 0) {
            const absenceInfo = [];
            if (onLeaveToday > 0) absenceInfo.push(`${onLeaveToday} on leave`);
            if (absentWithoutNotice > 0) absenceInfo.push(`${absentWithoutNotice} absent`);
            briefing += `• ${absenceInfo.join(', ')}\n`;
        }
        briefing += `• ${completedYesterday} tasks completed yesterday\n\n`;

        // Needs attention section (only if there are issues)
        const hasIssues = pendingApprovals > 0 || overdueTasks > 0 || escalatedIssues > 0;
        if (hasIssues) {
            briefing += `🚨 **NEEDS ATTENTION**\n`;
            if (pendingApprovals > 0) briefing += `• ${pendingApprovals} pending approvals waiting for you\n`;
            if (overdueTasks > 0) briefing += `• ${overdueTasks} overdue tasks\n`;
            if (escalatedIssues > 0) briefing += `• ${escalatedIssues} escalated issues\n`;
            briefing += `\n`;
        }

        briefing += `🎯 **YOUR DAY**\n`;
        briefing += `• ${myMeetingsToday} meetings scheduled\n`;
        briefing += `• ${myTasksDueToday} tasks due today\n`;
        briefing += `• ${unreadMessages} messages unread\n`;

        if (insight) {
            briefing += `\n${insight}`;
        }

        return {
            success: true,
            briefing: {
                companyPulse: { checkedIn: checkedInToday, total: totalActive, attendanceRate, onLeave: onLeaveToday, absentWithoutNotice, completedYesterday },
                needsAttention: { pendingApprovals, overdueTasks, escalatedIssues },
                yourDay: { meetings: myMeetingsToday, tasksDue: myTasksDueToday, unreadMessages },
                insight
            },
            message: briefing
        };
    } catch (error) {
        console.error('handleGetDailyBriefing error:', error);
        return { success: false, error: 'Failed to generate briefing' };
    }
};

// ============================================
// GOALS & OKR HANDLERS
// ============================================

/**
 * Generate ASCII progress bar
 */
const getProgressBar = (current, target) => {
    const percent = Math.min(100, Math.round((current / target) * 100));
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + percent + '%';
};

/**
 * Calculate goal status based on progress and time remaining
 */
const calculateGoalStatus = (currentValue, targetValue, dueDate) => {
    const percent = (currentValue / targetValue) * 100;
    const today = new Date();
    const due = new Date(dueDate);
    const totalDays = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));

    if (percent >= 100) return 'completed';
    if (totalDays < 0) return 'failed';
    if (percent < 50 && totalDays < 7) return 'at_risk';
    return 'active';
};

/**
 * Auto-track goal progress based on autoTrackField
 */
const autoTrackGoalProgress = async (goal) => {
    if (!goal.autoTrackField || !goal.ownerId) return goal.currentValue;

    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.dueDate);

    try {
        switch (goal.autoTrackField) {
            case 'tasks_completed': {
                const employee = await prisma.employee.findUnique({
                    where: { id: goal.ownerId },
                    select: { user_id: true }
                });
                if (!employee?.user_id) return goal.currentValue;

                const count = await prisma.task.count({
                    where: {
                        user_id: employee.user_id,
                        status: 'done',
                        updated_at: { gte: startDate, lte: endDate }
                    }
                });
                return count;
            }
            case 'hours_worked': {
                const attendances = await prisma.attendance.findMany({
                    where: {
                        employee_id: goal.ownerId,
                        date: { gte: startDate, lte: endDate },
                        check_in: { not: null },
                        check_out: { not: null }
                    }
                });
                let totalHours = 0;
                for (const a of attendances) {
                    if (a.check_in && a.check_out) {
                        totalHours += (new Date(a.check_out) - new Date(a.check_in)) / (1000 * 60 * 60);
                    }
                }
                return Math.round(totalHours * 10) / 10;
            }
            case 'attendance_rate': {
                const startOfPeriod = new Date(startDate);
                const endOfPeriod = new Date(Math.min(endDate, new Date()));
                let workDays = 0;
                const current = new Date(startOfPeriod);
                while (current <= endOfPeriod) {
                    const day = current.getDay();
                    if (day !== 0 && day !== 6) workDays++;
                    current.setDate(current.getDate() + 1);
                }

                const presentDays = await prisma.attendance.count({
                    where: {
                        employee_id: goal.ownerId,
                        date: { gte: startOfPeriod, lte: endOfPeriod },
                        status: { in: ['present', 'late'] }
                    }
                });
                return workDays > 0 ? Math.round((presentDays / workDays) * 100) : 0;
            }
            default:
                return goal.currentValue;
        }
    } catch (error) {
        console.error('autoTrackGoalProgress error:', error);
        return goal.currentValue;
    }
};

/**
 * Handle creating a new goal
 */
const handleCreateGoal = async (employeeId, { title, targetValue, unit, owner_name, owner_type, due_date, auto_track, description }) => {
    try {
        let ownerId = null;
        let ownerType = owner_type || 'employee';

        // Determine owner
        if (owner_name) {
            if (ownerType === 'department') {
                const dept = await prisma.department.findFirst({
                    where: { name: { contains: owner_name, mode: 'insensitive' } }
                });
                if (!dept) return { success: false, error: `Department "${owner_name}" not found` };
                ownerId = dept.id;
            } else {
                const emp = await prisma.employee.findFirst({
                    where: { name: { contains: owner_name, mode: 'insensitive' } }
                });
                if (!emp) return { success: false, error: `Employee "${owner_name}" not found` };
                ownerId = emp.id;
                ownerType = 'employee';
            }
        } else {
            // Self goal
            ownerId = employeeId;
            ownerType = 'employee';
        }

        // Parse due date
        const parsedDueDate = parseRelativeDate(due_date) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

        const goal = await prisma.goal.create({
            data: {
                title,
                description: description || null,
                goalType: ownerType === 'company' ? 'company' : ownerType === 'department' ? 'department' : 'individual',
                targetValue,
                currentValue: 0,
                unit,
                ownerType,
                ownerId,
                startDate: new Date(),
                dueDate: parsedDueDate,
                status: 'active',
                autoTrackField: auto_track || null,
                createdBy: employeeId
            }
        });

        const dueStr = parsedDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const ownerStr = owner_name ? ` for ${owner_name}` : '';

        return {
            success: true,
            message: `✓ Goal created: ${title}${ownerStr} ${getProgressBar(0, targetValue)} 0/${targetValue} ${unit}, due ${dueStr}`,
            goal: { id: goal.id, title: goal.title }
        };
    } catch (error) {
        console.error('handleCreateGoal error:', error);
        return { success: false, error: 'Failed to create goal' };
    }
};

/**
 * Handle getting goals list
 */
const handleGetGoals = async (employeeId, { owner_name, owner_type, status }) => {
    try {
        const where = {};

        // Filter by status
        if (status && status !== 'all') {
            where.status = status;
        } else if (!status) {
            where.status = 'active';
        }

        // Filter by owner
        if (owner_name) {
            if (owner_type === 'department') {
                const dept = await prisma.department.findFirst({
                    where: { name: { contains: owner_name, mode: 'insensitive' } }
                });
                if (dept) {
                    where.ownerType = 'department';
                    where.ownerId = dept.id;
                }
            } else {
                const emp = await prisma.employee.findFirst({
                    where: { name: { contains: owner_name, mode: 'insensitive' } }
                });
                if (emp) {
                    where.ownerType = 'employee';
                    where.ownerId = emp.id;
                }
            }
        } else if (owner_type === 'company') {
            where.ownerType = 'company';
        } else if (!owner_type) {
            // Default to own goals
            where.ownerType = 'employee';
            where.ownerId = employeeId;
        }

        const goals = await prisma.goal.findMany({
            where,
            orderBy: { dueDate: 'asc' },
            take: 10
        });

        if (goals.length === 0) {
            return { success: true, message: 'No goals found.' };
        }

        // Auto-track and update progress
        const goalsWithProgress = [];
        for (const goal of goals) {
            const currentValue = await autoTrackGoalProgress(goal);
            if (currentValue !== goal.currentValue) {
                await prisma.goal.update({
                    where: { id: goal.id },
                    data: { currentValue, status: calculateGoalStatus(currentValue, goal.targetValue, goal.dueDate) }
                });
                goal.currentValue = currentValue;
                goal.status = calculateGoalStatus(currentValue, goal.targetValue, goal.dueDate);
            }
            goalsWithProgress.push(goal);
        }

        const lines = goalsWithProgress.map(g => {
            const bar = getProgressBar(g.currentValue, g.targetValue);
            const statusIcon = g.status === 'completed' ? ' ✓' : g.status === 'at_risk' ? ' ⚠️' : '';
            return `• ${g.title} ${bar}${statusIcon}`;
        });

        return {
            success: true,
            message: `${goals.length} goal${goals.length !== 1 ? 's' : ''}:\n${lines.join('\n')}`
        };
    } catch (error) {
        console.error('handleGetGoals error:', error);
        return { success: false, error: 'Failed to retrieve goals' };
    }
};

/**
 * Handle getting detailed goal progress
 */
const handleGetGoalProgress = async (employeeId, { goal_title, goal_id }) => {
    try {
        let goal;
        if (goal_id) {
            goal = await prisma.goal.findUnique({ where: { id: goal_id } });
        } else if (goal_title) {
            goal = await prisma.goal.findFirst({
                where: { title: { contains: goal_title, mode: 'insensitive' } }
            });
        }

        if (!goal) {
            return { success: false, error: `Goal "${goal_title || goal_id}" not found` };
        }

        // Auto-track progress
        const currentValue = await autoTrackGoalProgress(goal);
        if (currentValue !== goal.currentValue) {
            await prisma.goal.update({
                where: { id: goal.id },
                data: { currentValue, status: calculateGoalStatus(currentValue, goal.targetValue, goal.dueDate) }
            });
            goal.currentValue = currentValue;
        }

        const percent = Math.round((goal.currentValue / goal.targetValue) * 100);
        const daysLeft = Math.ceil((new Date(goal.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        const trackStatus = percent >= 80 ? 'on track' : percent >= 50 ? 'needs attention' : 'behind';

        return {
            success: true,
            message: `${goal.title}: ${goal.currentValue}/${goal.targetValue} ${goal.unit} (${percent}%) - ${trackStatus}, ${daysLeft} days left`
        };
    } catch (error) {
        console.error('handleGetGoalProgress error:', error);
        return { success: false, error: 'Failed to get goal progress' };
    }
};

/**
 * Handle updating goal progress manually
 */
const handleUpdateGoalProgress = async (employeeId, { goal_title, goal_id, new_value }) => {
    try {
        let goal;
        if (goal_id) {
            goal = await prisma.goal.findUnique({ where: { id: goal_id } });
        } else if (goal_title) {
            goal = await prisma.goal.findFirst({
                where: { title: { contains: goal_title, mode: 'insensitive' } }
            });
        }

        if (!goal) {
            return { success: false, error: `Goal "${goal_title || goal_id}" not found` };
        }

        const newStatus = calculateGoalStatus(new_value, goal.targetValue, goal.dueDate);

        await prisma.goal.update({
            where: { id: goal.id },
            data: { currentValue: new_value, status: newStatus }
        });

        return {
            success: true,
            message: `✓ Updated: ${goal.title} now at ${new_value}/${goal.targetValue} ${goal.unit}`
        };
    } catch (error) {
        console.error('handleUpdateGoalProgress error:', error);
        return { success: false, error: 'Failed to update goal progress' };
    }
};

/**
 * Handle getting goals at risk
 */
const handleGetGoalsAtRisk = async () => {
    try {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Get active goals due within next week that are behind
        const goals = await prisma.goal.findMany({
            where: {
                status: { in: ['active', 'at_risk'] },
                dueDate: { lte: nextWeek }
            },
            include: {
                creator: { select: { name: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Filter to those that are actually at risk (< 70% complete)
        const atRisk = [];
        for (const goal of goals) {
            const currentValue = await autoTrackGoalProgress(goal);
            const percent = Math.round((currentValue / goal.targetValue) * 100);
            const daysLeft = Math.ceil((new Date(goal.dueDate) - today) / (1000 * 60 * 60 * 24));

            if (percent < 70 || daysLeft < 0) {
                atRisk.push({ ...goal, currentValue, percent, daysLeft });

                // Update status if needed
                if (goal.status !== 'at_risk' && goal.status !== 'failed') {
                    await prisma.goal.update({
                        where: { id: goal.id },
                        data: { currentValue, status: daysLeft < 0 ? 'failed' : 'at_risk' }
                    });
                }
            }
        }

        if (atRisk.length === 0) {
            return { success: true, message: 'No goals at risk. All on track!' };
        }

        const lines = atRisk.slice(0, 5).map(g => {
            const status = g.daysLeft < 0 ? `${Math.abs(g.daysLeft)}d overdue` : `due in ${g.daysLeft}d`;
            return `• ${g.title} (${g.percent}%, ${status})`;
        });

        const extra = atRisk.length > 5 ? `\n+${atRisk.length - 5} more` : '';

        return {
            success: true,
            message: `⚠️ ${atRisk.length} at risk:\n${lines.join('\n')}${extra}`
        };
    } catch (error) {
        console.error('handleGetGoalsAtRisk error:', error);
        return { success: false, error: 'Failed to get goals at risk' };
    }
};

/**
 * Handle completing a goal
 */
const handleCompleteGoal = async (employeeId, { goal_title, goal_id }) => {
    try {
        let goal;
        if (goal_id) {
            goal = await prisma.goal.findUnique({ where: { id: goal_id } });
        } else if (goal_title) {
            goal = await prisma.goal.findFirst({
                where: { title: { contains: goal_title, mode: 'insensitive' } }
            });
        }

        if (!goal) {
            return { success: false, error: `Goal "${goal_title || goal_id}" not found` };
        }

        await prisma.goal.update({
            where: { id: goal.id },
            data: { status: 'completed', currentValue: goal.targetValue }
        });

        return {
            success: true,
            message: `🎉 Goal completed: ${goal.title}!`
        };
    } catch (error) {
        console.error('handleCompleteGoal error:', error);
        return { success: false, error: 'Failed to complete goal' };
    }
};

// ============================================
// GAMIFICATION HANDLERS
// ============================================

/**
 * Calculate level from total points
 */
const calculateLevel = (totalPoints) => {
    if (totalPoints >= 1000) return 10;
    if (totalPoints >= 750) return 9;
    if (totalPoints >= 550) return 8;
    if (totalPoints >= 400) return 7;
    if (totalPoints >= 280) return 6;
    if (totalPoints >= 180) return 5;
    if (totalPoints >= 100) return 4;
    if (totalPoints >= 50) return 3;
    if (totalPoints >= 20) return 2;
    return 1;
};

/**
 * Get or create employee points record
 */
const getOrCreatePoints = async (employeeId) => {
    let points = await prisma.employeePoints.findUnique({
        where: { employeeId }
    });

    if (!points) {
        points = await prisma.employeePoints.create({
            data: { employeeId, totalPoints: 0, weeklyPoints: 0, monthlyPoints: 0, currentStreak: 0, longestStreak: 0, level: 1 }
        });
    }

    return points;
};

/**
 * Handle getting leaderboard
 */
const handleGetLeaderboard = async ({ period }) => {
    try {
        const periodField = period === 'month' ? 'monthlyPoints' : period === 'all' ? 'totalPoints' : 'weeklyPoints';

        const leaderboard = await prisma.employeePoints.findMany({
            where: { [periodField]: { gt: 0 } },
            include: { employee: { select: { name: true } } },
            orderBy: { [periodField]: 'desc' },
            take: 10
        });

        if (leaderboard.length === 0) {
            return { success: true, message: 'No points earned yet. Start completing tasks to earn points!' };
        }

        const medals = ['🥇', '🥈', '🥉'];
        const lines = leaderboard.slice(0, 5).map((p, i) => {
            const medal = medals[i] || `${i + 1}.`;
            const pts = p[periodField];
            return `${medal} ${p.employee.name} (${pts} pts)`;
        });

        const periodLabel = period === 'month' ? 'This Month' : period === 'all' ? 'All Time' : 'This Week';
        const extra = leaderboard.length > 5 ? `\n+${leaderboard.length - 5} more` : '';

        return {
            success: true,
            message: `🏆 ${periodLabel}:\n${lines.join('\n')}${extra}`
        };
    } catch (error) {
        console.error('handleGetLeaderboard error:', error);
        return { success: false, error: 'Failed to get leaderboard' };
    }
};

/**
 * Handle getting personal stats
 */
const handleGetMyStats = async (employeeId) => {
    try {
        const points = await getOrCreatePoints(employeeId);
        const achievementCount = await prisma.achievement.count({
            where: { employeeId }
        });

        const streakIcon = points.currentStreak >= 7 ? '🔥' : points.currentStreak >= 3 ? '⚡' : '📅';

        return {
            success: true,
            message: `📊 Level ${points.level} | ${points.totalPoints} pts | ${streakIcon} ${points.currentStreak}-day streak | ${achievementCount} achievements`
        };
    } catch (error) {
        console.error('handleGetMyStats error:', error);
        return { success: false, error: 'Failed to get stats' };
    }
};

/**
 * Handle getting achievements
 */
const handleGetAchievements = async (employeeId, { employee_name }) => {
    try {
        let targetEmployeeId = employeeId;

        if (employee_name) {
            const emp = await prisma.employee.findFirst({
                where: { name: { contains: employee_name, mode: 'insensitive' } }
            });
            if (emp) targetEmployeeId = emp.id;
        }

        const achievements = await prisma.achievement.findMany({
            where: { employeeId: targetEmployeeId },
            orderBy: { earnedAt: 'desc' },
            take: 10
        });

        if (achievements.length === 0) {
            return { success: true, message: 'No achievements yet. Keep working to earn badges!' };
        }

        const badges = achievements.slice(0, 5).map(a => `${a.icon} ${a.title}`);
        const extra = achievements.length > 5 ? ` +${achievements.length - 5} more` : '';

        return {
            success: true,
            message: `🏆 ${achievements.length} badges: ${badges.join(', ')}${extra}`
        };
    } catch (error) {
        console.error('handleGetAchievements error:', error);
        return { success: false, error: 'Failed to get achievements' };
    }
};

/**
 * Handle getting streaks
 */
const handleGetStreaks = async (employeeId) => {
    try {
        // Get top streaks
        const topStreaks = await prisma.employeePoints.findMany({
            where: { currentStreak: { gt: 0 } },
            include: { employee: { select: { name: true } } },
            orderBy: { currentStreak: 'desc' },
            take: 5
        });

        // Get own streak
        const myPoints = await getOrCreatePoints(employeeId);
        const myEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { name: true }
        });

        if (topStreaks.length === 0) {
            return {
                success: true,
                message: `🔥 Your streak: ${myPoints.currentStreak} days (best: ${myPoints.longestStreak})`
            };
        }

        const lines = topStreaks.map((p, i) => {
            const icon = i === 0 ? '🔥' : '⚡';
            return `${icon} ${p.employee.name}: ${p.currentStreak}d`;
        });

        return {
            success: true,
            message: `Streaks:\n${lines.join('\n')}\n\nYours: ${myPoints.currentStreak}d (best: ${myPoints.longestStreak})`
        };
    } catch (error) {
        console.error('handleGetStreaks error:', error);
        return { success: false, error: 'Failed to get streaks' };
    }
};

/**
 * Master action handler - routes to appropriate handler
 */
const createActionHandler = (employeeId, context) => {
    return async (toolName, toolInput) => {
        switch (toolName) {
            // Tasks
            case 'createTask':
                return await handleCreateTask(employeeId, toolInput);
            case 'updateTask':
                return await handleUpdateTask(employeeId, toolInput);
            case 'deleteTask':
                return await handleDeleteTask(employeeId, toolInput);
            case 'delegateTask':
                return await handleDelegateTask(employeeId, toolInput, context);
            case 'getMyTasks':
                return await handleGetMyTasks(employeeId, context);

            // Attendance
            case 'checkIn':
                return await handleCheckIn(employeeId);
            case 'checkOut':
                return await handleCheckOut(employeeId);
            case 'getMyAttendance':
                return await handleGetMyAttendance(employeeId, context);

            // Leave
            case 'requestLeave':
                return await handleLeaveRequest(employeeId, toolInput);
            case 'getLeaveBalance':
                return await handleGetLeaveBalance(employeeId);

            // Messaging
            case 'messageManager':
                return await handleMessageManager(employeeId, toolInput.content);
            case 'messageHR':
                return await handleMessageHR(employeeId, toolInput.content);
            case 'messageEmployee':
                return await handleMessageEmployee(employeeId, toolInput, context);
            case 'escalateIssue':
                return await handleEscalateIssue(employeeId, toolInput, context);
            case 'announceToTeam':
                return await handleAnnounceToTeam(employeeId, toolInput, context);
            case 'checkMessages':
                return await handleCheckMessages(employeeId);

            // Meetings
            case 'scheduleMeeting':
                return await handleScheduleMeeting(employeeId, toolInput, context);
            case 'getMyMeetings':
                return await handleGetMyMeetings(employeeId);

            // Approvals
            case 'requestApproval':
                return await handleRequestApproval(employeeId, toolInput, context);
            case 'getPendingApprovals':
                return await handleGetPendingApprovals(employeeId, context);
            case 'approveRequest':
                return await handleApproveRequest(employeeId, toolInput);
            case 'rejectRequest':
                return await handleRejectRequest(employeeId, toolInput);

            // Team Management
            case 'checkTeamStatus':
                return await handleCheckTeamStatus(employeeId, context);

            // Reminders & Summary
            case 'setReminder':
                return await handleSetReminder(employeeId, toolInput);
            case 'getReminders':
                return await handleGetReminders(employeeId);
            case 'getWeeklySummary':
                return await handleGetWeeklySummary(employeeId, context);

            // Executive: People & Presence
            case 'getWhosInOffice':
                return await handleGetWhosInOffice();
            case 'getWhosAbsent':
                return await handleGetWhosAbsent();
            case 'checkEmployeeAvailability':
                return await handleCheckEmployeeAvailability(toolInput);
            case 'getDepartmentStatus':
                return await handleGetDepartmentStatus(toolInput);

            // Executive: Performance & Analytics
            case 'getEmployeeHoursWorked':
                return await handleGetEmployeeHoursWorked(toolInput);
            case 'getEmployeeProductivity':
                return await handleGetEmployeeProductivity(toolInput);
            case 'getTaskLeaderboard':
                return await handleGetTaskLeaderboard(toolInput);
            case 'getTeamAttendanceRate':
                return await handleGetTeamAttendanceRate(toolInput);

            // Executive: Task Management
            case 'assignTask':
                return await handleAssignTask(employeeId, toolInput);
            case 'getEmployeeProgress':
                return await handleGetEmployeeProgress(toolInput);
            case 'getOverdueTasks':
                return await handleGetOverdueTasks(toolInput);
            case 'reassignTask':
                return await handleReassignTask(toolInput);

            // Executive: Quick Reports
            case 'getDailyStandupReport':
                return await handleGetDailyStandupReport(employeeId, context);
            case 'getRedFlags':
                return await handleGetRedFlags();
            case 'getProjectStatus':
                return await handleGetProjectStatus(toolInput);
            case 'getWhoNeedsHelp':
                return await handleGetWhoNeedsHelp();
            case 'getPulseCheck':
                return await handleGetPulseCheck();
            case 'getEndOfDayWrapup':
                return await handleGetEndOfDayWrapup(employeeId);
            case 'getDailyBriefing':
                return await handleGetDailyBriefing(employeeId, context);

            // Goals & OKR
            case 'createGoal':
                return await handleCreateGoal(employeeId, toolInput);
            case 'getGoals':
                return await handleGetGoals(employeeId, toolInput);
            case 'getGoalProgress':
                return await handleGetGoalProgress(employeeId, toolInput);
            case 'updateGoalProgress':
                return await handleUpdateGoalProgress(employeeId, toolInput);
            case 'getGoalsAtRisk':
                return await handleGetGoalsAtRisk();
            case 'completeGoal':
                return await handleCompleteGoal(employeeId, toolInput);

            // Gamification
            case 'getLeaderboard':
                return await handleGetLeaderboard(toolInput);
            case 'getMyStats':
                return await handleGetMyStats(employeeId);
            case 'getAchievements':
                return await handleGetAchievements(employeeId, toolInput);
            case 'getStreaks':
                return await handleGetStreaks(employeeId);

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

    // Get subordinates (direct reports) for manager features
    const subordinates = await prisma.employee.findMany({
        where: { manager_id: employeeId },
        select: {
            id: true,
            name: true,
            email: true,
            user_id: true,
            department: { select: { name: true } }
        }
    });

    // Get ALL tasks for this user (so bot can count done/pending accurately)
    const allTasks = employee.user_id ? await prisma.task.findMany({
        where: {
            user_id: employee.user_id
        },
        orderBy: [
            { status: 'asc' },
            { due_date: 'asc' }
        ],
        take: 50,
        select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            due_date: true
        }
    }) : [];

    // Also keep pending tasks for backwards compatibility
    const tasks = allTasks.filter(t => t.status !== 'done');

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

    // Get upcoming meetings (next 7 days)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingMeetings = await prisma.meeting.count({
        where: {
            OR: [
                { organizer_id: employeeId },
                { attendees: { contains: employeeId } }
            ],
            start_time: { gte: today, lte: nextWeek },
            status: { not: 'cancelled' }
        }
    });

    // Get pending approvals count (for managers)
    const pendingApprovals = subordinates.length > 0 ? await prisma.approvalRequest.count({
        where: {
            approver_id: employeeId,
            status: 'pending'
        }
    }) : 0;

    return {
        employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
            hire_date: employee.hire_date,
            user_id: employee.user_id
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
        subordinates: subordinates.length > 0 ? subordinates : null,
        tasks,
        allTasks,
        attendance,
        unreadMessages,
        upcomingMeetings,
        pendingApprovals
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

const clearHistory = async (req, res) => {
    try {
        const employeeId = req.employee?.id;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee profile required' });
        }

        await prisma.message.deleteMany({
            where: { employee_id: employeeId }
        });

        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
};

/**
 * Generate or improve task description using AI
 */
const writeTaskDescription = async (req, res) => {
    try {
        const { taskTitle, currentDescription, action } = req.body;

        if (!taskTitle) {
            return res.status(400).json({ error: 'Task title is required' });
        }

        // Check if API key is configured
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({
                error: 'AI service unavailable',
                message: 'ANTHROPIC_API_KEY not configured'
            });
        }

        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        // Build the prompt based on action
        let systemPrompt = `You are a helpful assistant that writes clear, concise task descriptions for a project management system.
Your descriptions should be:
- Clear and actionable
- 2-4 sentences typically
- Professional but not overly formal
- Focused on what needs to be done and why

Respond ONLY with the description text, no quotes, no prefixes like "Description:", just the content.`;

        let userPrompt = '';

        switch (action) {
            case 'generate':
                userPrompt = `Write a clear description for a task titled: "${taskTitle}"

The description should explain what needs to be done and provide any relevant context.`;
                break;

            case 'improve':
                userPrompt = `Improve this task description to be clearer and more actionable.

Task title: "${taskTitle}"
Current description: "${currentDescription}"

Rewrite the description to be more professional and clear while keeping the original intent.`;
                break;

            case 'shorten':
                userPrompt = `Shorten this task description while keeping the essential information.

Task title: "${taskTitle}"
Current description: "${currentDescription}"

Make it more concise (1-2 sentences max) while retaining the key points.`;
                break;

            case 'expand':
                userPrompt = `Expand this task description with more detail and context.

Task title: "${taskTitle}"
Current description: "${currentDescription}"

Add more detail about what needs to be done, acceptance criteria, or relevant context.`;
                break;

            case 'criteria':
                userPrompt = `Add acceptance criteria to this task description.

Task title: "${taskTitle}"
Current description: "${currentDescription || 'No description yet'}"

Write a description that includes clear acceptance criteria as bullet points. Format as:
[Brief description paragraph]

**Acceptance Criteria:**
- Criterion 1
- Criterion 2
- Criterion 3`;
                break;

            case 'bullets':
                userPrompt = `Convert this task description into clear bullet points.

Task title: "${taskTitle}"
Current description: "${currentDescription}"

Transform the content into a well-organized bullet-point list that highlights key actions, requirements, or details.`;
                break;

            case 'professional':
                userPrompt = `Rewrite this task description in a more professional, business-appropriate tone.

Task title: "${taskTitle}"
Current description: "${currentDescription}"

Make it sound more formal and polished while keeping the same meaning. Use clear, professional language.`;
                break;

            default:
                userPrompt = `Write a clear description for a task titled: "${taskTitle}"`;
        }

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        });

        const textContent = response.content.find(block => block.type === 'text');

        if (!textContent) {
            return res.status(500).json({ error: 'Failed to generate description' });
        }

        res.json({
            success: true,
            description: textContent.text.trim(),
            action: action,
            usage: {
                inputTokens: response.usage?.input_tokens,
                outputTokens: response.usage?.output_tokens
            }
        });
    } catch (error) {
        console.error('Write description error:', error);
        res.status(500).json({ error: 'Failed to generate description' });
    }
};

module.exports = {
    handleBotMessage,
    getConversationHistory,
    getContext,
    routeMessage,
    markAsRead,
    clearHistory,
    writeTaskDescription
};
