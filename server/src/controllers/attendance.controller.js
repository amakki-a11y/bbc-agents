const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

// Get attendance records with filters
const getAttendance = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor || undefined;
        const { employee_id, date, status, start_date, end_date } = req.query;

        const where = {
            ...(employee_id && { employee_id }),
            ...(status && { status }),
            ...(date && {
                date: {
                    gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                    lt: new Date(new Date(date).setHours(23, 59, 59, 999))
                }
            }),
            ...(start_date && end_date && {
                date: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                }
            })
        };

        const records = await prisma.attendance.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { date: 'desc' },
            include: {
                employee: { select: { id: true, name: true, department: { select: { name: true } } } },
                approver: { select: { id: true, name: true } }
            }
        });

        let nextCursor = undefined;
        if (records.length > limit) {
            const nextItem = records.pop();
            nextCursor = nextItem.id;
        }

        if (nextCursor) {
            res.set('X-Next-Cursor', nextCursor);
        }

        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
};

// Get single attendance record
const getAttendanceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await prisma.attendance.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: { select: { name: true } },
                        role: { select: { name: true } }
                    }
                },
                approver: { select: { id: true, name: true } }
            }
        });

        if (!record) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch attendance record' });
    }
};

// Check in
const checkIn = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get employee from user
        const employee = await prisma.employee.findUnique({
            where: { user_id: userId }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        const existing = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (existing && existing.check_in) {
            return res.status(400).json({ error: 'Already checked in today' });
        }

        const now = new Date();
        const checkInTime = new Date();

        // Determine if late (after 9 AM)
        const nineAM = new Date(today);
        nineAM.setHours(9, 0, 0, 0);
        const isLate = now > nineAM;

        const attendance = existing
            ? await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    check_in: checkInTime,
                    status: isLate ? 'late' : 'present'
                }
            })
            : await prisma.attendance.create({
                data: {
                    employee_id: employee.id,
                    date: today,
                    check_in: checkInTime,
                    status: isLate ? 'late' : 'present'
                }
            });

        cache.delByPrefix('attendance');
        res.status(201).json({
            message: 'Checked in successfully',
            attendance,
            isLate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to check in' });
    }
};

// Check out
const checkOut = async (req, res) => {
    try {
        const userId = req.user.userId;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (!attendance) {
            return res.status(400).json({ error: 'No check-in record found for today' });
        }

        if (attendance.check_out) {
            return res.status(400).json({ error: 'Already checked out today' });
        }

        const checkOutTime = new Date();

        // Check if half day (less than 4 hours)
        const hoursWorked = (checkOutTime - attendance.check_in) / (1000 * 60 * 60);
        const status = hoursWorked < 4 ? 'half_day' : attendance.status;

        const updated = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                check_out: checkOutTime,
                status
            }
        });

        cache.delByPrefix('attendance');
        res.json({
            message: 'Checked out successfully',
            attendance: updated,
            hoursWorked: hoursWorked.toFixed(2)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to check out' });
    }
};

// Create attendance record (admin)
const createAttendance = async (req, res) => {
    try {
        const { employee_id, date, check_in, check_out, status, notes } = req.body;

        if (!employee_id || !date) {
            return res.status(400).json({ error: 'employee_id and date are required' });
        }

        const attendance = await prisma.attendance.create({
            data: {
                employee_id,
                date: new Date(date),
                check_in: check_in ? new Date(check_in) : null,
                check_out: check_out ? new Date(check_out) : null,
                status: status || 'present',
                notes
            },
            include: {
                employee: { select: { name: true } }
            }
        });

        cache.delByPrefix('attendance');
        res.status(201).json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create attendance record' });
    }
};

// Update attendance record
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { check_in, check_out, status, notes, approved_by } = req.body;

        const attendance = await prisma.attendance.update({
            where: { id },
            data: {
                ...(check_in && { check_in: new Date(check_in) }),
                ...(check_out && { check_out: new Date(check_out) }),
                ...(status && { status }),
                ...(notes !== undefined && { notes }),
                ...(approved_by !== undefined && { approved_by })
            },
            include: {
                employee: { select: { name: true } },
                approver: { select: { name: true } }
            }
        });

        cache.delByPrefix('attendance');
        res.json(attendance);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update attendance record' });
    }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.attendance.delete({ where: { id } });

        cache.delByPrefix('attendance');
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to delete attendance record' });
    }
};

// Get my attendance
const getMyAttendance = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { start_date, end_date, year, month } = req.query;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        let dateFilter = {};

        // Support month/year query for calendar view
        if (year && month) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            dateFilter = {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            };
        } else if (start_date && end_date) {
            dateFilter = {
                date: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                }
            };
        }

        const records = await prisma.attendance.findMany({
            where: {
                employee_id: employee.id,
                ...dateFilter
            },
            orderBy: { date: 'desc' }
        });

        // Calculate summary stats
        const summary = {
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length,
            absent: records.filter(r => r.status === 'absent').length,
            onLeave: records.filter(r => r.status === 'on_leave').length,
            halfDay: records.filter(r => r.status === 'half_day').length,
            total: records.length
        };

        // Calculate attendance rate (present + late / total working days)
        const workingDays = summary.present + summary.late + summary.absent + summary.halfDay;
        summary.attendanceRate = workingDays > 0
            ? Math.round(((summary.present + summary.late) / workingDays) * 100)
            : 100;

        res.json({
            records,
            summary,
            employee: { id: employee.id, name: employee.name }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

// Get today's attendance for current user
const getMyTodayStatus = async (req, res) => {
    try {
        const userId = req.user.userId;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        res.json({
            hasCheckedIn: !!attendance?.check_in,
            hasCheckedOut: !!attendance?.check_out,
            checkInTime: attendance?.check_in,
            checkOutTime: attendance?.check_out,
            status: attendance?.status,
            attendance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch today status' });
    }
};

// Get team attendance (for managers)
const getTeamAttendance = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { department_id, start_date, end_date, year, month } = req.query;

        // Get current user's employee profile to check if manager
        const currentEmployee = await prisma.employee.findUnique({
            where: { user_id: userId },
            include: { role: true }
        });

        // Get employees to fetch attendance for
        let employeeFilter = {};
        if (department_id) {
            employeeFilter = { department_id };
        } else if (currentEmployee?.department_id) {
            // Default to own department
            employeeFilter = { department_id: currentEmployee.department_id };
        }

        const employees = await prisma.employee.findMany({
            where: {
                ...employeeFilter,
                status: 'active'
            },
            include: {
                department: { select: { id: true, name: true } },
                role: { select: { name: true } }
            }
        });

        // Build date filter
        let dateFilter = {};
        if (year && month) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            dateFilter = {
                date: { gte: startOfMonth, lte: endOfMonth }
            };
        } else if (start_date && end_date) {
            dateFilter = {
                date: { gte: new Date(start_date), lte: new Date(end_date) }
            };
        } else {
            // Default to current month
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
            dateFilter = {
                date: { gte: startOfMonth, lte: endOfMonth }
            };
        }

        // Get attendance records for employees
        const employeeIds = employees.map(e => e.id);
        const records = await prisma.attendance.findMany({
            where: {
                employee_id: { in: employeeIds },
                ...dateFilter
            },
            orderBy: { date: 'desc' }
        });

        // Build team summary with attendance by employee
        const teamData = employees.map(emp => {
            const empRecords = records.filter(r => r.employee_id === emp.id);
            return {
                employee: {
                    id: emp.id,
                    name: emp.name,
                    department: emp.department?.name,
                    role: emp.role?.name
                },
                summary: {
                    present: empRecords.filter(r => r.status === 'present').length,
                    late: empRecords.filter(r => r.status === 'late').length,
                    absent: empRecords.filter(r => r.status === 'absent').length,
                    onLeave: empRecords.filter(r => r.status === 'on_leave').length,
                    halfDay: empRecords.filter(r => r.status === 'half_day').length
                },
                records: empRecords
            };
        });

        // Today's status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRecords = records.filter(r => {
            const recordDate = new Date(r.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
        });

        res.json({
            team: teamData,
            todaySummary: {
                present: todayRecords.filter(r => r.status === 'present').length,
                late: todayRecords.filter(r => r.status === 'late').length,
                absent: employees.length - todayRecords.filter(r => r.check_in).length,
                onLeave: todayRecords.filter(r => r.status === 'on_leave').length,
                totalEmployees: employees.length
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch team attendance' });
    }
};

// Get attendance summary for a period
const getAttendanceSummary = async (req, res) => {
    try {
        const { employee_id, department_id, start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }

        let employeeIds = [];

        if (employee_id) {
            employeeIds = [employee_id];
        } else if (department_id) {
            const employees = await prisma.employee.findMany({
                where: { department_id },
                select: { id: true }
            });
            employeeIds = employees.map(e => e.id);
        } else {
            const employees = await prisma.employee.findMany({
                select: { id: true }
            });
            employeeIds = employees.map(e => e.id);
        }

        const records = await prisma.attendance.findMany({
            where: {
                employee_id: { in: employeeIds },
                date: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                }
            },
            include: {
                employee: { select: { id: true, name: true, department: { select: { name: true } } } }
            }
        });

        // Calculate summary
        const summary = {
            totalRecords: records.length,
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length,
            absent: records.filter(r => r.status === 'absent').length,
            onLeave: records.filter(r => r.status === 'on_leave').length,
            halfDay: records.filter(r => r.status === 'half_day').length,
            byEmployee: {}
        };

        // Group by employee
        records.forEach(record => {
            if (!summary.byEmployee[record.employee_id]) {
                summary.byEmployee[record.employee_id] = {
                    name: record.employee.name,
                    department: record.employee.department.name,
                    present: 0,
                    late: 0,
                    absent: 0,
                    onLeave: 0,
                    halfDay: 0
                };
            }
            const emp = summary.byEmployee[record.employee_id];
            if (record.status === 'present') emp.present++;
            if (record.status === 'late') emp.late++;
            if (record.status === 'absent') emp.absent++;
            if (record.status === 'on_leave') emp.onLeave++;
            if (record.status === 'half_day') emp.halfDay++;
        });

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate attendance summary' });
    }
};

// Today's attendance status
const getTodayStatus = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const records = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        department: { select: { name: true } }
                    }
                }
            }
        });

        const totalEmployees = await prisma.employee.count({
            where: { status: 'active' }
        });

        res.json({
            date: today.toISOString().split('T')[0],
            totalActive: totalEmployees,
            checkedIn: records.filter(r => r.check_in).length,
            checkedOut: records.filter(r => r.check_out).length,
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length,
            onLeave: records.filter(r => r.status === 'on_leave').length,
            records
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch today status' });
    }
};

module.exports = {
    getAttendance,
    getAttendanceRecord,
    checkIn,
    checkOut,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getMyAttendance,
    getMyTodayStatus,
    getTeamAttendance,
    getAttendanceSummary,
    getTodayStatus
};
