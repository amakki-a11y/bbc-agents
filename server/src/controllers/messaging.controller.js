const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Hierarchy-based messaging permission checker
 * Determines if fromEmployee can send a message to toEmployee
 */
async function canEmployeeMessage(fromEmployeeId, toEmployeeId) {
  try {
    const fromEmployee = await prisma.employee.findUnique({
      where: { id: fromEmployeeId },
      include: {
        department: true,
        role: true,
        manager: true,
        subordinates: true
      }
    });

    const toEmployee = await prisma.employee.findUnique({
      where: { id: toEmployeeId },
      include: {
        department: true,
        role: true,
        manager: true
      }
    });

    if (!fromEmployee || !toEmployee) {
      return { allowed: false, reason: 'Employee not found' };
    }

    const fromRole = fromEmployee.role?.name?.toLowerCase() || '';
    const toRole = toEmployee.role?.name?.toLowerCase() || '';
    const fromDept = fromEmployee.department?.name?.toLowerCase() || '';
    const toDept = toEmployee.department?.name?.toLowerCase() || '';

    // 1. Admin can message anyone
    if (fromRole === 'admin' || fromRole === 'administrator') {
      return { allowed: true, rule: 'admin_access' };
    }

    // 2. HR can message anyone
    if (fromDept === 'hr' || fromDept === 'human resources') {
      return { allowed: true, rule: 'hr_access' };
    }

    // 3. Anyone can message HR
    if (toDept === 'hr' || toDept === 'human resources') {
      return { allowed: true, rule: 'contact_hr' };
    }

    // 4. Can message direct manager
    if (fromEmployee.manager_id === toEmployeeId) {
      return { allowed: true, rule: 'direct_manager' };
    }

    // 5. Can message same department colleagues
    if (fromEmployee.department_id === toEmployee.department_id) {
      return { allowed: true, rule: 'same_department' };
    }

    // 6. Manager can message their direct reports
    const isDirectReport = fromEmployee.subordinates?.some(s => s.id === toEmployeeId);
    if (isDirectReport) {
      return { allowed: true, rule: 'direct_report' };
    }

    // 7. Check if both are managers (can message other managers)
    const fromIsManager = fromEmployee.subordinates?.length > 0;
    const toIsManager = await prisma.employee.count({
      where: { manager_id: toEmployeeId }
    }) > 0;

    if (fromIsManager && toIsManager) {
      return { allowed: true, rule: 'manager_to_manager' };
    }

    // 8. Check if fromEmployee is HOD (Head of Department)
    // HOD is the employee in a department who has no manager in the same department
    const fromIsHOD = fromEmployee.subordinates?.length > 0 &&
      (!fromEmployee.manager || fromEmployee.manager.department_id !== fromEmployee.department_id);

    const toIsHOD = await checkIfHOD(toEmployeeId);

    // HOD can message other HODs
    if (fromIsHOD && toIsHOD) {
      return { allowed: true, rule: 'hod_to_hod' };
    }

    // HOD can message management/admin
    if (fromIsHOD && (toRole.includes('admin') || toRole.includes('director') || toRole.includes('executive'))) {
      return { allowed: true, rule: 'hod_to_management' };
    }

    // Not allowed
    return {
      allowed: false,
      reason: `You can only message your manager, HR, or colleagues in your department (${fromEmployee.department?.name}).`,
      suggestion: 'To contact someone outside your department, please ask your manager or HR to facilitate.'
    };
  } catch (error) {
    console.error('Error checking message permission:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
}

/**
 * Check if an employee is a Head of Department
 */
async function checkIfHOD(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      manager: true,
      subordinates: true,
      department: true
    }
  });

  if (!employee) return false;

  // Has subordinates and either no manager or manager is in different department
  const hasSubordinates = employee.subordinates?.length > 0;
  const managerInDifferentDept = !employee.manager ||
    employee.manager.department_id !== employee.department_id;

  return hasSubordinates && managerInDifferentDept;
}

/**
 * Send a direct message to another employee
 */
async function sendMessage(req, res) {
  try {
    const { toEmployeeId, subject, content, messageType = 'direct', priority = 'normal', parentMessageId } = req.body;

    // Get sender from authenticated user
    const senderEmployee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!senderEmployee) {
      return res.status(403).json({ error: 'You must be linked to an employee record to send messages' });
    }

    // Check if sender can message recipient
    const permission = await canEmployeeMessage(senderEmployee.id, toEmployeeId);
    if (!permission.allowed) {
      return res.status(403).json({
        error: 'Message not allowed',
        reason: permission.reason,
        suggestion: permission.suggestion
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        employee_id: toEmployeeId,
        sender_employee_id: senderEmployee.id,
        subject,
        content,
        message_type: messageType,
        priority,
        sender: 'employee',
        status: 'delivered',
        parent_message_id: parentMessageId || null
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        senderEmployee: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Send a message to the current user's manager
 */
async function sendToManager(req, res) {
  try {
    const { subject, content, priority = 'normal', isEscalation = false } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id },
      include: { manager: true }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    if (!employee.manager) {
      return res.status(400).json({ error: 'You do not have a manager assigned' });
    }

    const message = await prisma.message.create({
      data: {
        employee_id: employee.manager.id,
        sender_employee_id: employee.id,
        subject: subject || (isEscalation ? 'Escalation' : null),
        content,
        message_type: isEscalation ? 'escalation' : 'direct',
        priority: isEscalation ? 'urgent' : priority,
        sender: 'employee',
        status: 'delivered'
      },
      include: {
        employee: { select: { id: true, name: true } },
        senderEmployee: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: `Message sent to your manager ${employee.manager.name}`,
      data: message
    });
  } catch (error) {
    console.error('Error sending to manager:', error);
    res.status(500).json({ error: 'Failed to send message to manager' });
  }
}

/**
 * Send a message to HR department
 */
async function sendToHR(req, res) {
  try {
    const { subject, content, priority = 'normal' } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    // Find HR department and its head
    const hrDepartment = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { contains: 'HR', mode: 'insensitive' } },
          { name: { contains: 'Human Resources', mode: 'insensitive' } }
        ]
      }
    });

    if (!hrDepartment) {
      return res.status(400).json({ error: 'HR department not found' });
    }

    // Find HR head or any HR employee
    const hrEmployee = await prisma.employee.findFirst({
      where: { department_id: hrDepartment.id },
      orderBy: { hire_date: 'asc' } // Get most senior HR person
    });

    if (!hrEmployee) {
      return res.status(400).json({ error: 'No HR employees found' });
    }

    const message = await prisma.message.create({
      data: {
        employee_id: hrEmployee.id,
        sender_employee_id: employee.id,
        subject: subject || 'HR Inquiry',
        content,
        message_type: 'request',
        priority,
        sender: 'employee',
        status: 'delivered'
      },
      include: {
        employee: { select: { id: true, name: true } },
        senderEmployee: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent to HR',
      data: message
    });
  } catch (error) {
    console.error('Error sending to HR:', error);
    res.status(500).json({ error: 'Failed to send message to HR' });
  }
}

/**
 * Send announcement to department (Managers/HODs only)
 */
async function sendToDepartment(req, res) {
  try {
    const { content, subject, priority = 'normal' } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id },
      include: {
        department: true,
        subordinates: true,
        role: true
      }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    // Check if user is a manager (has subordinates) or admin
    const isManager = employee.subordinates?.length > 0;
    const isAdmin = employee.role?.name?.toLowerCase() === 'admin';

    if (!isManager && !isAdmin) {
      return res.status(403).json({
        error: 'Only managers can send team announcements',
        suggestion: 'Ask your manager to send announcements on your behalf'
      });
    }

    // Get all department members
    const departmentMembers = await prisma.employee.findMany({
      where: {
        department_id: employee.department_id,
        id: { not: employee.id } // Exclude sender
      }
    });

    if (departmentMembers.length === 0) {
      return res.status(400).json({ error: 'No other members in your department' });
    }

    // Create messages for all department members
    const messages = await Promise.all(
      departmentMembers.map(member =>
        prisma.message.create({
          data: {
            employee_id: member.id,
            sender_employee_id: employee.id,
            to_department_id: employee.department_id,
            subject: subject || `Announcement from ${employee.name}`,
            content,
            message_type: 'announcement',
            priority,
            sender: 'employee',
            status: 'delivered'
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Announcement sent to ${departmentMembers.length} team members in ${employee.department.name}`,
      recipientCount: departmentMembers.length
    });
  } catch (error) {
    console.error('Error sending to department:', error);
    res.status(500).json({ error: 'Failed to send department announcement' });
  }
}

/**
 * Escalate an issue to manager (or manager's manager)
 */
async function escalateIssue(req, res) {
  try {
    const { content, subject, escalateHigher = false } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id },
      include: {
        manager: {
          include: { manager: true } // Get manager's manager for higher escalation
        }
      }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    if (!employee.manager) {
      return res.status(400).json({ error: 'You do not have a manager assigned' });
    }

    // Determine recipient based on escalation level
    let recipient = employee.manager;
    let escalationLevel = 1;

    if (escalateHigher && employee.manager.manager) {
      recipient = employee.manager.manager;
      escalationLevel = 2;
    }

    const message = await prisma.message.create({
      data: {
        employee_id: recipient.id,
        sender_employee_id: employee.id,
        subject: subject || `🚨 Escalation from ${employee.name}`,
        content,
        message_type: 'escalation',
        priority: 'urgent',
        sender: 'employee',
        status: 'delivered',
        metadata: JSON.stringify({ escalationLevel })
      },
      include: {
        employee: { select: { id: true, name: true } },
        senderEmployee: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: `Issue escalated to ${recipient.name}`,
      escalationLevel,
      data: message
    });
  } catch (error) {
    console.error('Error escalating issue:', error);
    res.status(500).json({ error: 'Failed to escalate issue' });
  }
}

/**
 * Get inbox (received messages)
 */
async function getInbox(req, res) {
  try {
    const { unreadOnly = false, limit = 50, offset = 0 } = req.query;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    const whereClause = {
      employee_id: employee.id,
      sender: 'employee' // Only employee-to-employee messages
    };

    if (unreadOnly === 'true') {
      whereClause.read_at = null;
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          senderEmployee: {
            select: { id: true, name: true, email: true, department: { select: { name: true } } }
          },
          parentMessage: {
            select: { id: true, content: true, created_at: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.message.count({ where: whereClause }),
      prisma.message.count({
        where: {
          employee_id: employee.id,
          sender: 'employee',
          read_at: null
        }
      })
    ]);

    res.json({
      messages,
      total,
      unreadCount,
      hasMore: offset + messages.length < total
    });
  } catch (error) {
    console.error('Error getting inbox:', error);
    res.status(500).json({ error: 'Failed to get inbox' });
  }
}

/**
 * Get sent messages
 */
async function getSentMessages(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { sender_employee_id: employee.id },
        include: {
          employee: {
            select: { id: true, name: true, email: true, department: { select: { name: true } } }
          }
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.message.count({ where: { sender_employee_id: employee.id } })
    ]);

    res.json({
      messages,
      total,
      hasMore: offset + messages.length < total
    });
  } catch (error) {
    console.error('Error getting sent messages:', error);
    res.status(500).json({ error: 'Failed to get sent messages' });
  }
}

/**
 * Read a specific message and mark as read
 */
async function readMessage(req, res) {
  try {
    const { messageId } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        employee_id: employee.id
      },
      include: {
        senderEmployee: {
          select: { id: true, name: true, email: true, department: { select: { name: true } } }
        },
        parentMessage: true,
        replies: {
          include: {
            senderEmployee: { select: { id: true, name: true } }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read if not already
    if (!message.read_at) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          read_at: new Date(),
          status: 'read'
        }
      });
      message.read_at = new Date();
      message.status = 'read';
    }

    res.json(message);
  } catch (error) {
    console.error('Error reading message:', error);
    res.status(500).json({ error: 'Failed to read message' });
  }
}

/**
 * Reply to a message
 */
async function replyToMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    // Get original message
    const originalMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: { senderEmployee: true }
    });

    if (!originalMessage) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    // Determine recipient (reply goes to original sender)
    const recipientId = originalMessage.sender_employee_id;

    if (!recipientId) {
      return res.status(400).json({ error: 'Cannot reply to this message' });
    }

    // Check permission to reply
    const permission = await canEmployeeMessage(employee.id, recipientId);
    if (!permission.allowed) {
      return res.status(403).json({
        error: 'Reply not allowed',
        reason: permission.reason
      });
    }

    const reply = await prisma.message.create({
      data: {
        employee_id: recipientId,
        sender_employee_id: employee.id,
        content,
        message_type: 'direct',
        priority: originalMessage.priority,
        sender: 'employee',
        status: 'delivered',
        parent_message_id: messageId,
        subject: `Re: ${originalMessage.subject || 'No subject'}`
      },
      include: {
        employee: { select: { id: true, name: true } },
        senderEmployee: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: `Reply sent to ${originalMessage.senderEmployee?.name || 'recipient'}`,
      data: reply
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
}

/**
 * Get messageable contacts based on hierarchy
 */
async function getMessageableContacts(req, res) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id },
      include: {
        department: true,
        role: true,
        manager: { select: { id: true, name: true, department: { select: { name: true } } } },
        subordinates: { select: { id: true, name: true } }
      }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    const contacts = {
      manager: employee.manager,
      directReports: employee.subordinates || [],
      sameDeartment: [],
      hr: [],
      otherManagers: []
    };

    // Get same department colleagues
    contacts.sameDepartment = await prisma.employee.findMany({
      where: {
        department_id: employee.department_id,
        id: { not: employee.id }
      },
      select: { id: true, name: true, email: true }
    });

    // Get HR department
    const hrDept = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { contains: 'HR', mode: 'insensitive' } },
          { name: { contains: 'Human Resources', mode: 'insensitive' } }
        ]
      }
    });

    if (hrDept) {
      contacts.hr = await prisma.employee.findMany({
        where: { department_id: hrDept.id },
        select: { id: true, name: true, email: true }
      });
    }

    // If user is a manager, get other managers
    if (employee.subordinates?.length > 0) {
      contacts.otherManagers = await prisma.employee.findMany({
        where: {
          subordinates: { some: {} },
          id: { not: employee.id }
        },
        select: {
          id: true,
          name: true,
          department: { select: { name: true } }
        }
      });
    }

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department?.name,
        role: employee.role?.name,
        isManager: (employee.subordinates?.length || 0) > 0
      },
      contacts
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
}

/**
 * Check if current user can message a specific employee
 */
async function checkCanMessage(req, res) {
  try {
    const { targetEmployeeId } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { user_id: req.user.id }
    });

    if (!employee) {
      return res.status(403).json({ error: 'You must be linked to an employee record' });
    }

    const result = await canEmployeeMessage(employee.id, targetEmployeeId);
    res.json(result);
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
}

module.exports = {
  canEmployeeMessage,
  checkIfHOD,
  sendMessage,
  sendToManager,
  sendToHR,
  sendToDepartment,
  escalateIssue,
  getInbox,
  getSentMessages,
  readMessage,
  replyToMessage,
  getMessageableContacts,
  checkCanMessage
};
