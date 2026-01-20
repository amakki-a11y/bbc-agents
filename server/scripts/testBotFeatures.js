/**
 * BBC Assistant Bot Features Test Script
 * Tests all bot handler functions locally
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// TEST HANDLERS (copied from controller)
// ============================================

const handleGetWhosInOffice = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findMany({
        where: {
            check_in: { gte: today, lt: tomorrow },
            check_out: null
        },
        include: { employee: { select: { name: true } } },
        take: 10
    });

    if (attendance.length === 0) {
        return { success: true, message: "No one has checked in yet today." };
    }

    const totalInOffice = await prisma.attendance.count({
        where: { check_in: { gte: today, lt: tomorrow }, check_out: null }
    });

    const names = attendance.map(a => a.employee.name);
    const displayNames = names.slice(0, 5);
    const extra = totalInOffice > 5 ? ` +${totalInOffice - 5} more` : '';

    return {
        success: true,
        message: `In office: ${displayNames.join(', ')}${extra} (${totalInOffice} total)`
    };
};

const handleGetWhosAbsent = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkedInIds = await prisma.attendance.findMany({
        where: { check_in: { gte: today, lt: tomorrow } },
        select: { employee_id: true }
    });
    const checkedInIdSet = new Set(checkedInIds.map(a => a.employee_id));

    const absentEmployees = await prisma.employee.findMany({
        where: {
            id: { notIn: Array.from(checkedInIdSet) },
            status: 'active'
        },
        select: { name: true },
        take: 10
    });

    const totalAbsent = await prisma.employee.count({
        where: {
            id: { notIn: Array.from(checkedInIdSet) },
            status: 'active'
        }
    });

    if (totalAbsent === 0) {
        return { success: true, message: "Everyone is in the office today!" };
    }

    const names = absentEmployees.map(e => e.name);
    const displayNames = names.slice(0, 5);
    const extra = totalAbsent > 5 ? ` +${totalAbsent - 5} more` : '';

    return {
        success: true,
        message: `Absent today: ${displayNames.join(', ')}${extra} (${totalAbsent} total)`
    };
};

const handleGetPulseCheck = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await prisma.employee.count({ where: { status: 'active' } });
    const inOffice = await prisma.attendance.count({
        where: { check_in: { gte: today, lt: tomorrow }, check_out: null }
    });
    const attendanceRate = totalEmployees > 0 ? Math.round((inOffice / totalEmployees) * 100) : 0;

    const tasksDueToday = await prisma.task.count({
        where: {
            due_date: { gte: today, lt: tomorrow },
            status: { not: 'done' }
        }
    });

    const overdueCount = await prisma.task.count({
        where: {
            due_date: { lt: today },
            status: { not: 'done' }
        }
    });

    return {
        success: true,
        message: `Pulse: ${attendanceRate}% in (${inOffice}/${totalEmployees}), ${tasksDueToday} tasks due, ${overdueCount} overdue`
    };
};

const handleGetTaskLeaderboard = async ({ period }) => {
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const completedTasks = await prisma.task.groupBy({
        by: ['user_id'],
        where: {
            status: 'done',
            updated_at: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
    });

    if (completedTasks.length === 0) {
        return { success: true, message: "No tasks completed in this period." };
    }

    const userIds = completedTasks.map(t => t.user_id).filter(Boolean);
    const employees = await prisma.employee.findMany({
        where: { user_id: { in: userIds } },
        select: { user_id: true, name: true }
    });

    const nameMap = {};
    employees.forEach(e => { nameMap[e.user_id] = e.name; });

    const medals = ['🥇', '🥈', '🥉'];
    const lines = completedTasks.slice(0, 5).map((t, i) => {
        const medal = medals[i] || `${i + 1}.`;
        const name = nameMap[t.user_id] || 'Unknown';
        return `${medal} ${name}: ${t._count.id}`;
    });

    const periodLabel = period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Today';

    return {
        success: true,
        message: `Top Performers (${periodLabel}):\n${lines.join('\n')}`
    };
};

const handleGetOverdueTasks = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = await prisma.task.findMany({
        where: {
            due_date: { lt: today },
            status: { not: 'done' }
        },
        include: {
            user: {
                include: { employee: { select: { name: true } } }
            }
        },
        orderBy: { due_date: 'asc' },
        take: 10
    });

    const totalOverdue = await prisma.task.count({
        where: {
            due_date: { lt: today },
            status: { not: 'done' }
        }
    });

    if (totalOverdue === 0) {
        return { success: true, message: "No overdue tasks. Great job team!" };
    }

    const displayTasks = overdueTasks.slice(0, 5);
    const lines = displayTasks.map(t => {
        const daysOverdue = Math.floor((today - new Date(t.due_date)) / (1000 * 60 * 60 * 24));
        const assignee = t.user?.employee?.name || 'Unassigned';
        return `- "${t.title}" (${assignee}) - ${daysOverdue}d overdue`;
    });

    const extra = totalOverdue > 5 ? `\n+${totalOverdue - 5} more overdue tasks` : '';

    return {
        success: true,
        message: `Overdue Tasks (${totalOverdue}):\n${lines.join('\n')}${extra}`
    };
};

const handleGetWhoNeedsHelp = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employeesWithOverdue = await prisma.employee.findMany({
        where: { status: 'active' },
        include: {
            user: {
                include: {
                    tasks: {
                        where: {
                            OR: [
                                { due_date: { lt: today }, status: { not: 'done' } },
                                { status: 'done', updated_at: { gte: oneWeekAgo } }
                            ]
                        }
                    }
                }
            }
        }
    });

    const struggling = employeesWithOverdue
        .map(e => {
            const overdue = e.user?.tasks?.filter(t =>
                t.due_date && new Date(t.due_date) < today && t.status !== 'done'
            ).length || 0;
            const completedThisWeek = e.user?.tasks?.filter(t => t.status === 'done').length || 0;
            return { name: e.name, overdue, completedThisWeek };
        })
        .filter(e => e.overdue >= 5 || e.completedThisWeek === 0)
        .sort((a, b) => b.overdue - a.overdue)
        .slice(0, 5);

    if (struggling.length === 0) {
        return { success: true, message: "Everyone seems to be on track!" };
    }

    const lines = struggling.map(e => {
        if (e.overdue >= 5) {
            return `- ${e.name}: ${e.overdue} overdue tasks`;
        }
        return `- ${e.name}: No completions this week`;
    });

    return {
        success: true,
        message: `May Need Help:\n${lines.join('\n')}`
    };
};

const handleGetDailyBriefing = async (employeeId, context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isAdmin = context?.role === 'Admin';
    const isManager = context?.role === 'Manager';

    // Company Pulse
    const totalEmployees = await prisma.employee.count({ where: { status: 'active' } });
    const inOffice = await prisma.attendance.count({
        where: { check_in: { gte: today, lt: tomorrow } }
    });

    // Yesterday's completions
    const yesterdayCompletions = await prisma.task.count({
        where: {
            status: 'done',
            updated_at: { gte: yesterday, lt: today }
        }
    });

    // Overdue tasks
    const overdueCount = await prisma.task.count({
        where: {
            due_date: { lt: today },
            status: { not: 'done' }
        }
    });

    // Tasks due today
    const tasksDueToday = await prisma.task.count({
        where: {
            due_date: { gte: today, lt: tomorrow },
            status: { not: 'done' }
        }
    });

    let briefing = `Good morning! Here's your briefing:\n\n`;
    briefing += `📊 Company Pulse: ${inOffice}/${totalEmployees} in office, ${yesterdayCompletions} tasks done yesterday\n`;
    briefing += `⚠️ Attention: ${overdueCount} overdue, ${tasksDueToday} due today\n`;

    // Personal tasks (if employee context)
    if (employeeId) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { user_id: true }
        });

        if (employee?.user_id) {
            const myTasks = await prisma.task.count({
                where: {
                    user_id: employee.user_id,
                    status: { not: 'done' }
                }
            });
            briefing += `📋 Your Tasks: ${myTasks} pending`;
        }
    }

    return { success: true, message: briefing };
};

// ============================================
// GOAL HANDLERS
// ============================================

const getProgressBar = (current, target) => {
    const percent = Math.min(100, Math.round((current / target) * 100));
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + percent + '%';
};

const handleCreateGoal = async (employeeId, { title, targetValue, unit, due_date }) => {
    try {
        const parsedDueDate = due_date ? new Date(due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const goal = await prisma.goal.create({
            data: {
                title,
                goalType: 'individual',
                targetValue,
                currentValue: 0,
                unit,
                ownerType: 'employee',
                ownerId: employeeId,
                startDate: new Date(),
                dueDate: parsedDueDate,
                status: 'active',
                createdBy: employeeId
            }
        });

        const dueStr = parsedDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
            success: true,
            message: `✓ Goal created: ${title} ${getProgressBar(0, targetValue)} 0/${targetValue} ${unit}, due ${dueStr}`,
            goal: { id: goal.id, title: goal.title }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetGoals = async (employeeId) => {
    try {
        const goals = await prisma.goal.findMany({
            where: {
                ownerType: 'employee',
                ownerId: employeeId,
                status: 'active'
            },
            orderBy: { dueDate: 'asc' },
            take: 10
        });

        if (goals.length === 0) {
            return { success: true, message: 'No active goals found.' };
        }

        const lines = goals.map(g => {
            const bar = getProgressBar(g.currentValue, g.targetValue);
            const statusIcon = g.status === 'completed' ? ' ✓' : g.status === 'at_risk' ? ' ⚠️' : '';
            return `• ${g.title} ${bar}${statusIcon}`;
        });

        return {
            success: true,
            message: `${goals.length} goal${goals.length !== 1 ? 's' : ''}:\n${lines.join('\n')}`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetGoalsAtRisk = async () => {
    try {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const goals = await prisma.goal.findMany({
            where: {
                status: { in: ['active', 'at_risk'] },
                dueDate: { lte: nextWeek }
            },
            orderBy: { dueDate: 'asc' }
        });

        const atRisk = goals.filter(g => {
            const percent = Math.round((g.currentValue / g.targetValue) * 100);
            return percent < 70;
        });

        if (atRisk.length === 0) {
            return { success: true, message: 'No goals at risk. All on track!' };
        }

        const lines = atRisk.slice(0, 5).map(g => {
            const percent = Math.round((g.currentValue / g.targetValue) * 100);
            const daysLeft = Math.ceil((new Date(g.dueDate) - today) / (1000 * 60 * 60 * 24));
            return `• ${g.title} (${percent}%, due in ${daysLeft}d)`;
        });

        return {
            success: true,
            message: `⚠️ ${atRisk.length} at risk:\n${lines.join('\n')}`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleCompleteGoal = async (goalId) => {
    try {
        const goal = await prisma.goal.update({
            where: { id: goalId },
            data: { status: 'completed', currentValue: prisma.goal.findUnique({ where: { id: goalId } }).then(g => g.targetValue) }
        });

        return {
            success: true,
            message: `🎉 Goal completed: ${goal.title}!`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================
// TEST RUNNER
// ============================================

const runTests = async () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       BBC ASSISTANT BOT - FEATURE TEST RESULTS              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Get test employee
    const emp = await prisma.employee.findFirst({ select: { id: true } });
    const empId = emp?.id;

    const tests = [
        { name: "Who's in?", fn: () => handleGetWhosInOffice() },
        { name: "Who's absent?", fn: () => handleGetWhosAbsent() },
        { name: "Pulse check", fn: () => handleGetPulseCheck() },
        { name: "Top performers (week)", fn: () => handleGetTaskLeaderboard({ period: 'week' }) },
        { name: "Overdue tasks", fn: () => handleGetOverdueTasks() },
        { name: "Who needs help?", fn: () => handleGetWhoNeedsHelp() },
        { name: "Daily briefing", fn: () => handleGetDailyBriefing(empId, { role: 'Admin' }) },
        // Goal tests
        { name: "Create goal", fn: () => handleCreateGoal(empId, { title: 'Complete 10 tasks', targetValue: 10, unit: 'tasks', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }) },
        { name: "Get my goals", fn: () => handleGetGoals(empId) },
        { name: "Goals at risk", fn: () => handleGetGoalsAtRisk() },
    ];

    const results = [];

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const start = Date.now();
            const result = await test.fn();
            const duration = Date.now() - start;
            results.push({
                test: test.name,
                status: result.success ? '✅ PASS' : '❌ FAIL',
                duration: `${duration}ms`,
                response: result.message
            });
        } catch (error) {
            results.push({
                test: test.name,
                status: '❌ ERROR',
                duration: '-',
                response: error.message
            });
        }
    }

    // Print results
    console.log('\n' + '═'.repeat(80));
    console.log('TEST RESULTS:');
    console.log('═'.repeat(80));

    for (const r of results) {
        console.log(`\n┌─ ${r.test} (${r.duration}) ${r.status}`);
        console.log('│');
        const lines = r.response.split('\n');
        for (const line of lines) {
            console.log(`│  ${line}`);
        }
        console.log('└' + '─'.repeat(70));
    }

    // Summary
    const passed = results.filter(r => r.status.includes('PASS')).length;
    const failed = results.filter(r => !r.status.includes('PASS')).length;

    console.log('\n' + '═'.repeat(80));
    console.log(`SUMMARY: ${passed}/${results.length} tests passed, ${failed} failed`);
    console.log('═'.repeat(80) + '\n');

    await prisma.$disconnect();
};

// Run tests
runTests().catch(console.error);
