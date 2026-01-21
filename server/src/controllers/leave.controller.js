const prisma = require('../lib/prisma');
const { logCreate, logUpdate, logDelete } = require('../services/activityLogger');

// Get all leave types
const getLeaveTypes = async (req, res) => {
    try {
        const types = await prisma.leaveType.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(types);
    } catch (error) {
        console.error('Error fetching leave types:', error);
        res.status(500).json({ error: 'Failed to fetch leave types' });
    }
};

// Create leave type
const createLeaveType = async (req, res) => {
    try {
        const { name, days_allowed, color } = req.body;

        const type = await prisma.leaveType.create({
            data: {
                name,
                days_allowed: days_allowed || 0,
                color: color || '#3b82f6'
            }
        });

        // Log activity
        await logCreate(
            req.user?.userId,
            'leave_type',
            type.id,
            `Created leave type: ${name}`,
            req,
            { name, days_allowed }
        );

        res.status(201).json(type);
    } catch (error) {
        console.error('Error creating leave type:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Leave type already exists' });
        }
        res.status(500).json({ error: 'Failed to create leave type' });
    }
};

// Update leave type
const updateLeaveType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, days_allowed, color } = req.body;

        const type = await prisma.leaveType.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(days_allowed !== undefined && { days_allowed }),
                ...(color && { color })
            }
        });

        // Log activity
        await logUpdate(
            req.user?.userId,
            'leave_type',
            type.id,
            `Updated leave type: ${type.name}`,
            req,
            { name, days_allowed }
        );

        res.json(type);
    } catch (error) {
        console.error('Error updating leave type:', error);
        res.status(500).json({ error: 'Failed to update leave type' });
    }
};

// Delete leave type
const deleteLeaveType = async (req, res) => {
    try {
        const { id } = req.params;

        // Get leave type name before deleting
        const type = await prisma.leaveType.findUnique({ where: { id } });

        await prisma.leaveType.delete({
            where: { id }
        });

        // Log activity
        await logDelete(
            req.user?.userId,
            'leave_type',
            id,
            `Deleted leave type: ${type?.name || id}`,
            req
        );

        res.json({ message: 'Leave type deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave type:', error);
        res.status(500).json({ error: 'Failed to delete leave type' });
    }
};

// Calculate business days between two dates (excluding weekends)
const calculateBusinessDays = (startDate, endDate, excludeWeekends = true) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;

    const current = new Date(start);
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (!excludeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
            days++;
        }
        current.setDate(current.getDate() + 1);
    }

    return days;
};

// Request leave
const requestLeave = async (req, res) => {
    try {
        const { leave_type_id, start_date, end_date, reason, exclude_weekends } = req.body;
        const employee_id = req.employee?.id;

        if (!employee_id) {
            return res.status(400).json({ error: 'Employee record not found' });
        }

        // Calculate days
        const days = calculateBusinessDays(start_date, end_date, exclude_weekends !== false);

        if (days <= 0) {
            return res.status(400).json({ error: 'Invalid date range' });
        }

        // Check for overlapping leaves
        const overlapping = await prisma.leave.findFirst({
            where: {
                employee_id,
                status: { in: ['pending', 'approved'] },
                OR: [
                    {
                        start_date: { lte: new Date(end_date) },
                        end_date: { gte: new Date(start_date) }
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({ error: 'You already have a leave request for these dates' });
        }

        // Check balance
        const year = new Date().getFullYear();
        let balance = await prisma.leaveBalance.findFirst({
            where: {
                employee_id,
                leave_type_id,
                year
            }
        });

        // Get leave type to check allowance
        const leaveType = await prisma.leaveType.findUnique({
            where: { id: leave_type_id }
        });

        if (!leaveType) {
            return res.status(400).json({ error: 'Invalid leave type' });
        }

        // If no balance record exists and leave type has allowance, create one
        if (!balance && leaveType.days_allowed > 0) {
            balance = await prisma.leaveBalance.create({
                data: {
                    employee_id,
                    leave_type_id,
                    year,
                    total_days: leaveType.days_allowed,
                    used_days: 0,
                    pending_days: 0
                }
            });
        }

        // Check available balance
        if (balance && leaveType.days_allowed > 0) {
            const available = balance.total_days - balance.used_days - balance.pending_days;
            if (days > available) {
                return res.status(400).json({
                    error: `Insufficient leave balance. Available: ${available} days, Requested: ${days} days`
                });
            }
        }

        // Create leave request
        const leave = await prisma.leave.create({
            data: {
                employee_id,
                leave_type_id,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                days,
                reason,
                status: 'pending'
            },
            include: {
                leave_type: true,
                employee: {
                    select: { id: true, name: true, email: true, department: true }
                }
            }
        });

        // Update pending days in balance
        if (balance) {
            await prisma.leaveBalance.update({
                where: { id: balance.id },
                data: { pending_days: { increment: days } }
            });
        }

        // Log activity
        await logCreate(
            req.user?.userId,
            'leave',
            leave.id,
            `Requested ${leaveType.name} leave: ${days} days`,
            req,
            { leave_type: leaveType.name, days, start_date, end_date }
        );

        res.status(201).json(leave);
    } catch (error) {
        console.error('Error requesting leave:', error);
        res.status(500).json({ error: 'Failed to request leave' });
    }
};

// Update leave request (only for pending leaves by owner)
const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { leave_type_id, start_date, end_date, reason, exclude_weekends } = req.body;
        const employee_id = req.employee?.id;

        // Get existing leave
        const existing = await prisma.leave.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        if (existing.employee_id !== employee_id) {
            return res.status(403).json({ error: 'Not authorized to update this leave request' });
        }

        if (existing.status !== 'pending') {
            return res.status(400).json({ error: 'Can only update pending leave requests' });
        }

        // Calculate new days
        const newDays = calculateBusinessDays(
            start_date || existing.start_date,
            end_date || existing.end_date,
            exclude_weekends !== false
        );

        // Update balance if days changed
        const daysDiff = newDays - existing.days;
        if (daysDiff !== 0) {
            const year = new Date().getFullYear();
            const balance = await prisma.leaveBalance.findFirst({
                where: {
                    employee_id,
                    leave_type_id: leave_type_id || existing.leave_type_id,
                    year
                }
            });

            if (balance) {
                const available = balance.total_days - balance.used_days - balance.pending_days;
                if (daysDiff > available) {
                    return res.status(400).json({ error: 'Insufficient leave balance for updated dates' });
                }

                await prisma.leaveBalance.update({
                    where: { id: balance.id },
                    data: { pending_days: { increment: daysDiff } }
                });
            }
        }

        const leave = await prisma.leave.update({
            where: { id },
            data: {
                ...(leave_type_id && { leave_type_id }),
                ...(start_date && { start_date: new Date(start_date) }),
                ...(end_date && { end_date: new Date(end_date) }),
                ...(reason !== undefined && { reason }),
                days: newDays
            },
            include: {
                leave_type: true,
                employee: { select: { id: true, name: true, email: true } }
            }
        });

        res.json(leave);
    } catch (error) {
        console.error('Error updating leave:', error);
        res.status(500).json({ error: 'Failed to update leave' });
    }
};

// Approve leave
const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const approver_id = req.employee?.id;

        if (!approver_id) {
            return res.status(400).json({ error: 'Approver employee record not found' });
        }

        // Get the leave request
        const existing = await prisma.leave.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        if (existing.status !== 'pending') {
            return res.status(400).json({ error: 'Can only approve pending leave requests' });
        }

        // Verify approver is the manager
        if (existing.employee.manager_id !== approver_id) {
            // Check if approver has HR permission
            const hasHRPermission = req.permissions?.includes('manage_leave') ||
                                   req.permissions?.includes('manage_employees');
            if (!hasHRPermission) {
                return res.status(403).json({ error: 'Not authorized to approve this leave request' });
            }
        }

        const leave = await prisma.leave.update({
            where: { id },
            data: {
                status: 'approved',
                approved_by: approver_id,
                approved_at: new Date()
            },
            include: {
                leave_type: true,
                employee: { select: { id: true, name: true, email: true, department: true } },
                approver: { select: { id: true, name: true } }
            }
        });

        // Move from pending to used in balance
        const year = new Date().getFullYear();
        await prisma.leaveBalance.updateMany({
            where: {
                employee_id: leave.employee_id,
                leave_type_id: leave.leave_type_id,
                year
            },
            data: {
                pending_days: { decrement: leave.days },
                used_days: { increment: leave.days }
            }
        });

        // Log activity
        await logUpdate(
            req.user?.userId,
            'leave',
            leave.id,
            `Approved leave request for ${leave.employee.name}`,
            req,
            { employee: leave.employee.name, days: leave.days }
        );

        res.json(leave);
    } catch (error) {
        console.error('Error approving leave:', error);
        res.status(500).json({ error: 'Failed to approve leave' });
    }
};

// Reject leave
const rejectLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const approver_id = req.employee?.id;

        if (!approver_id) {
            return res.status(400).json({ error: 'Approver employee record not found' });
        }

        // Get the leave request
        const existing = await prisma.leave.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        if (existing.status !== 'pending') {
            return res.status(400).json({ error: 'Can only reject pending leave requests' });
        }

        const leave = await prisma.leave.update({
            where: { id },
            data: {
                status: 'rejected',
                rejection_reason: reason,
                approved_by: approver_id,
                approved_at: new Date()
            },
            include: {
                leave_type: true,
                employee: { select: { id: true, name: true, email: true } },
                approver: { select: { id: true, name: true } }
            }
        });

        // Remove from pending balance
        const year = new Date().getFullYear();
        await prisma.leaveBalance.updateMany({
            where: {
                employee_id: leave.employee_id,
                leave_type_id: leave.leave_type_id,
                year
            },
            data: {
                pending_days: { decrement: leave.days }
            }
        });

        // Log activity
        await logUpdate(
            req.user?.userId,
            'leave',
            leave.id,
            `Rejected leave request for ${leave.employee.name}`,
            req,
            { employee: leave.employee.name, days: leave.days, reason }
        );

        res.json(leave);
    } catch (error) {
        console.error('Error rejecting leave:', error);
        res.status(500).json({ error: 'Failed to reject leave' });
    }
};

// Cancel leave (by employee)
const cancelLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const employee_id = req.employee?.id;

        const existing = await prisma.leave.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        if (existing.employee_id !== employee_id) {
            return res.status(403).json({ error: 'Not authorized to cancel this leave request' });
        }

        if (existing.status === 'cancelled') {
            return res.status(400).json({ error: 'Leave is already cancelled' });
        }

        // Can only cancel pending or approved leaves that haven't started
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (existing.start_date < today && existing.status === 'approved') {
            return res.status(400).json({ error: 'Cannot cancel leave that has already started' });
        }

        const previousStatus = existing.status;

        const leave = await prisma.leave.update({
            where: { id },
            data: {
                status: 'cancelled'
            },
            include: {
                leave_type: true,
                employee: { select: { id: true, name: true, email: true } }
            }
        });

        // Update balance based on previous status
        const year = new Date().getFullYear();
        if (previousStatus === 'pending') {
            await prisma.leaveBalance.updateMany({
                where: {
                    employee_id: leave.employee_id,
                    leave_type_id: leave.leave_type_id,
                    year
                },
                data: {
                    pending_days: { decrement: leave.days }
                }
            });
        } else if (previousStatus === 'approved') {
            await prisma.leaveBalance.updateMany({
                where: {
                    employee_id: leave.employee_id,
                    leave_type_id: leave.leave_type_id,
                    year
                },
                data: {
                    used_days: { decrement: leave.days }
                }
            });
        }

        // Log activity
        await logUpdate(
            req.user?.userId,
            'leave',
            leave.id,
            `Cancelled leave request: ${leave.days} days`,
            req,
            { days: leave.days, previousStatus }
        );

        res.json(leave);
    } catch (error) {
        console.error('Error cancelling leave:', error);
        res.status(500).json({ error: 'Failed to cancel leave' });
    }
};

// Get my leaves
const getMyLeaves = async (req, res) => {
    try {
        const employee_id = req.employee?.id;
        const { year, status } = req.query;

        if (!employee_id) {
            return res.status(400).json({ error: 'Employee record not found' });
        }

        const where = { employee_id };

        if (year) {
            const startOfYear = new Date(parseInt(year), 0, 1);
            const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
            where.start_date = {
                gte: startOfYear,
                lte: endOfYear
            };
        }

        if (status) {
            where.status = status;
        }

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                leave_type: true,
                approver: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching my leaves:', error);
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
};

// Get all leaves (admin)
const getLeaves = async (req, res) => {
    try {
        const { year, status, employee_id, department_id } = req.query;

        const where = {};

        if (year) {
            const startOfYear = new Date(parseInt(year), 0, 1);
            const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
            where.start_date = {
                gte: startOfYear,
                lte: endOfYear
            };
        }

        if (status) {
            where.status = status;
        }

        if (employee_id) {
            where.employee_id = employee_id;
        }

        if (department_id) {
            where.employee = {
                department_id
            };
        }

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                leave_type: true,
                employee: {
                    select: { id: true, name: true, email: true, department: true }
                },
                approver: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
};

// Get team leaves (for managers)
const getTeamLeaves = async (req, res) => {
    try {
        const manager_id = req.employee?.id;
        const { year, status } = req.query;

        if (!manager_id) {
            return res.status(400).json({ error: 'Employee record not found' });
        }

        // Get employees managed by this user
        const teamMembers = await prisma.employee.findMany({
            where: { manager_id },
            select: { id: true }
        });

        const teamIds = teamMembers.map(m => m.id);

        if (teamIds.length === 0) {
            return res.json([]);
        }

        const where = { employee_id: { in: teamIds } };

        if (year) {
            const startOfYear = new Date(parseInt(year), 0, 1);
            const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
            where.start_date = {
                gte: startOfYear,
                lte: endOfYear
            };
        }

        if (status) {
            where.status = status;
        }

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                leave_type: true,
                employee: {
                    select: { id: true, name: true, email: true, department: true }
                },
                approver: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching team leaves:', error);
        res.status(500).json({ error: 'Failed to fetch team leaves' });
    }
};

// Get pending approvals
const getPendingApprovals = async (req, res) => {
    try {
        const manager_id = req.employee?.id;

        if (!manager_id) {
            return res.status(400).json({ error: 'Employee record not found' });
        }

        // Get employees managed by this user
        const teamMembers = await prisma.employee.findMany({
            where: { manager_id },
            select: { id: true }
        });

        const teamIds = teamMembers.map(m => m.id);

        // Also check HR permission to get all pending
        const hasHRPermission = req.permissions?.includes('manage_leave') ||
                               req.permissions?.includes('manage_employees');

        let where;
        if (hasHRPermission) {
            where = { status: 'pending' };
        } else {
            if (teamIds.length === 0) {
                return res.json([]);
            }
            where = {
                employee_id: { in: teamIds },
                status: 'pending'
            };
        }

        const pending = await prisma.leave.findMany({
            where,
            include: {
                leave_type: true,
                employee: {
                    select: { id: true, name: true, email: true, department: true }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        res.json(pending);
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
};

// Get my balance
const getMyBalance = async (req, res) => {
    try {
        const employee_id = req.employee?.id;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        if (!employee_id) {
            return res.status(400).json({ error: 'Employee record not found' });
        }

        // Get all leave types
        const leaveTypes = await prisma.leaveType.findMany();

        // Get existing balances
        const balances = await prisma.leaveBalance.findMany({
            where: {
                employee_id,
                year
            },
            include: { leave_type: true }
        });

        // Create balance records for any missing leave types
        const balanceMap = new Map(balances.map(b => [b.leave_type_id, b]));
        const result = [];

        for (const type of leaveTypes) {
            if (balanceMap.has(type.id)) {
                result.push(balanceMap.get(type.id));
            } else {
                // Create a virtual balance record
                result.push({
                    id: null,
                    employee_id,
                    leave_type_id: type.id,
                    year,
                    total_days: type.days_allowed,
                    used_days: 0,
                    pending_days: 0,
                    leave_type: type
                });
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching my balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
};

// Get employee balance (for managers/HR)
const getEmployeeBalance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        // Get all leave types
        const leaveTypes = await prisma.leaveType.findMany();

        // Get existing balances
        const balances = await prisma.leaveBalance.findMany({
            where: {
                employee_id: employeeId,
                year
            },
            include: { leave_type: true }
        });

        // Create balance records for any missing leave types
        const balanceMap = new Map(balances.map(b => [b.leave_type_id, b]));
        const result = [];

        for (const type of leaveTypes) {
            if (balanceMap.has(type.id)) {
                result.push(balanceMap.get(type.id));
            } else {
                result.push({
                    id: null,
                    employee_id: employeeId,
                    leave_type_id: type.id,
                    year,
                    total_days: type.days_allowed,
                    used_days: 0,
                    pending_days: 0,
                    leave_type: type
                });
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching employee balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
};

// Get leave calendar data
const getLeaveCalendar = async (req, res) => {
    try {
        const { month, year, department_id } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();
        const targetMonth = parseInt(month) || new Date().getMonth() + 1;

        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const where = {
            status: 'approved',
            OR: [
                {
                    start_date: { lte: endOfMonth },
                    end_date: { gte: startOfMonth }
                }
            ]
        };

        if (department_id) {
            where.employee = {
                department_id
            };
        }

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                leave_type: true,
                employee: {
                    select: { id: true, name: true, department: true }
                }
            },
            orderBy: { start_date: 'asc' }
        });

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching leave calendar:', error);
        res.status(500).json({ error: 'Failed to fetch leave calendar' });
    }
};

// Initialize leave balances for all employees for a year
const initializeBalances = async (req, res) => {
    try {
        const year = parseInt(req.body.year) || new Date().getFullYear();

        // Get all employees
        const employees = await prisma.employee.findMany({
            where: { status: 'active' }
        });

        // Get all leave types
        const leaveTypes = await prisma.leaveType.findMany();

        let created = 0;
        for (const employee of employees) {
            for (const type of leaveTypes) {
                // Check if balance already exists
                const existing = await prisma.leaveBalance.findFirst({
                    where: {
                        employee_id: employee.id,
                        leave_type_id: type.id,
                        year
                    }
                });

                if (!existing && type.days_allowed > 0) {
                    await prisma.leaveBalance.create({
                        data: {
                            employee_id: employee.id,
                            leave_type_id: type.id,
                            year,
                            total_days: type.days_allowed,
                            used_days: 0,
                            pending_days: 0
                        }
                    });
                    created++;
                }
            }
        }

        res.json({ message: `Initialized ${created} balance records for ${year}` });
    } catch (error) {
        console.error('Error initializing balances:', error);
        res.status(500).json({ error: 'Failed to initialize balances' });
    }
};

module.exports = {
    getLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    getLeaves,
    getMyLeaves,
    getTeamLeaves,
    getPendingApprovals,
    requestLeave,
    updateLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getMyBalance,
    getEmployeeBalance,
    getLeaveCalendar,
    initializeBalances
};
