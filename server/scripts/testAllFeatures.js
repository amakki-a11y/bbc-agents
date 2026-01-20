/**
 * BBC Assistant - Full System Test
 * Tests all phases: Voice Commands, Daily Briefing, Goals, Gamification
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// PHASE 1: VOICE COMMANDS
// ============================================

const handleGetWhosInOffice = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findMany({
        where: { check_in: { gte: today, lt: tomorrow }, check_out: null },
        include: { employee: { select: { name: true } } },
        take: 10
    });

    if (attendance.length === 0) {
        return { success: true, message: "No one has checked in yet today." };
    }

    const totalInOffice = await prisma.attendance.count({
        where: { check_in: { gte: today, lt: tomorrow }, check_out: null }
    });

    const names = attendance.map(a => a.employee.name).slice(0, 5);
    const extra = totalInOffice > 5 ? ` +${totalInOffice - 5} more` : '';

    return { success: true, message: `In office: ${names.join(', ')}${extra} (${totalInOffice} total)` };
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

    const totalAbsent = await prisma.employee.count({
        where: { id: { notIn: Array.from(checkedInIdSet) }, status: 'active' }
    });

    if (totalAbsent === 0) {
        return { success: true, message: "Everyone is in the office today!" };
    }

    const absentEmployees = await prisma.employee.findMany({
        where: { id: { notIn: Array.from(checkedInIdSet) }, status: 'active' },
        select: { name: true },
        take: 5
    });

    const names = absentEmployees.map(e => e.name);
    const extra = totalAbsent > 5 ? ` +${totalAbsent - 5} more` : '';

    return { success: true, message: `Absent today: ${names.join(', ')}${extra} (${totalAbsent} total)` };
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
        where: { due_date: { gte: today, lt: tomorrow }, status: { not: 'done' } }
    });

    const overdueCount = await prisma.task.count({
        where: { due_date: { lt: today }, status: { not: 'done' } }
    });

    return {
        success: true,
        message: `📊 ${attendanceRate}% attendance (${inOffice}/${totalEmployees}) | ${tasksDueToday} tasks due | ${overdueCount} overdue`
    };
};

const handleGetTaskLeaderboard = async ({ period }) => {
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

    const completedTasks = await prisma.task.groupBy({
        by: ['user_id'],
        where: { status: 'done', updated_at: { gte: startDate } },
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
        return `${medal} ${nameMap[t.user_id] || 'Unknown'}: ${t._count.id}`;
    });

    return { success: true, message: `Top Performers:\n${lines.join('\n')}` };
};

const handleGetOverdueTasks = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOverdue = await prisma.task.count({
        where: { due_date: { lt: today }, status: { not: 'done' } }
    });

    if (totalOverdue === 0) {
        return { success: true, message: "No overdue tasks. Great job team!" };
    }

    const overdueTasks = await prisma.task.findMany({
        where: { due_date: { lt: today }, status: { not: 'done' } },
        include: { user: { include: { employee: { select: { name: true } } } } },
        orderBy: { due_date: 'asc' },
        take: 5
    });

    const lines = overdueTasks.map(t => {
        const daysOverdue = Math.floor((today - new Date(t.due_date)) / (1000 * 60 * 60 * 24));
        const assignee = t.user?.employee?.name || 'Unassigned';
        return `- ${t.title} (${assignee}) ${daysOverdue}d overdue`;
    });

    const extra = totalOverdue > 5 ? `\n+${totalOverdue - 5} more` : '';

    return { success: true, message: `${totalOverdue} overdue:\n${lines.join('\n')}${extra}` };
};

const handleGetWhoNeedsHelp = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employeesWithOverdue = await prisma.employee.findMany({
        where: { status: 'active' },
        include: {
            user: {
                include: {
                    tasks: { where: { due_date: { lt: today }, status: { not: 'done' } } }
                }
            }
        }
    });

    const struggling = employeesWithOverdue
        .map(e => ({ name: e.name, overdue: e.user?.tasks?.length || 0 }))
        .filter(e => e.overdue >= 3)
        .sort((a, b) => b.overdue - a.overdue)
        .slice(0, 5);

    if (struggling.length === 0) {
        return { success: true, message: "Everyone seems to be on track!" };
    }

    const lines = struggling.map(e => `- ${e.name}: ${e.overdue} overdue`);
    return { success: true, message: `May Need Help:\n${lines.join('\n')}` };
};

// ============================================
// PHASE 2: DAILY BRIEFING
// ============================================

const handleGetDailyBriefing = async (employeeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const totalEmployees = await prisma.employee.count({ where: { status: 'active' } });
    const inOffice = await prisma.attendance.count({
        where: { check_in: { gte: today, lt: tomorrow } }
    });

    const yesterdayCompletions = await prisma.task.count({
        where: { status: 'done', updated_at: { gte: yesterday, lt: today } }
    });

    const overdueCount = await prisma.task.count({
        where: { due_date: { lt: today }, status: { not: 'done' } }
    });

    const tasksDueToday = await prisma.task.count({
        where: { due_date: { gte: today, lt: tomorrow }, status: { not: 'done' } }
    });

    let briefing = `☀️ Good morning! Here's your briefing:\n\n`;
    briefing += `📊 Company Pulse: ${inOffice}/${totalEmployees} in office, ${yesterdayCompletions} tasks done yesterday\n`;
    briefing += `⚠️ Attention: ${overdueCount} overdue, ${tasksDueToday} due today`;

    if (employeeId) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { user_id: true }
        });

        if (employee?.user_id) {
            const myTasks = await prisma.task.count({
                where: { user_id: employee.user_id, status: { not: 'done' } }
            });
            briefing += `\n📋 Your Tasks: ${myTasks} pending`;
        }
    }

    return { success: true, message: briefing };
};

// ============================================
// PHASE 3: GOALS
// ============================================

const getProgressBar = (current, target) => {
    const percent = Math.min(100, Math.round((current / target) * 100));
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + percent + '%';
};

const handleCreateGoal = async (employeeId, { title, targetValue, unit }) => {
    try {
        const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

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
                dueDate,
                status: 'active',
                createdBy: employeeId
            }
        });

        const dueStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
            success: true,
            message: `✓ Goal created: ${title} ${getProgressBar(0, targetValue)} 0/${targetValue} ${unit}, due ${dueStr}`,
            goal: { id: goal.id }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetGoals = async (employeeId) => {
    try {
        const goals = await prisma.goal.findMany({
            where: { ownerType: 'employee', ownerId: employeeId, status: 'active' },
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

        return { success: true, message: `${goals.length} goals:\n${lines.join('\n')}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetGoalProgress = async (employeeId) => {
    try {
        const goal = await prisma.goal.findFirst({
            where: { ownerType: 'employee', ownerId: employeeId },
            orderBy: { createdAt: 'desc' }
        });

        if (!goal) {
            return { success: true, message: 'No goals found.' };
        }

        const percent = Math.round((goal.currentValue / goal.targetValue) * 100);
        const daysLeft = Math.ceil((new Date(goal.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

        return {
            success: true,
            message: `${goal.title}: ${goal.currentValue}/${goal.targetValue} (${percent}%) - ${daysLeft} days left`
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
            where: { status: { in: ['active', 'at_risk'] }, dueDate: { lte: nextWeek } },
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

        return { success: true, message: `⚠️ ${atRisk.length} at risk:\n${lines.join('\n')}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================
// PHASE 4: GAMIFICATION
// ============================================

const getOrCreatePoints = async (employeeId) => {
    let points = await prisma.employeePoints.findUnique({ where: { employeeId } });

    if (!points) {
        points = await prisma.employeePoints.create({
            data: { employeeId, totalPoints: 0, weeklyPoints: 0, monthlyPoints: 0, currentStreak: 0, longestStreak: 0, level: 1 }
        });
    }

    return points;
};

const handleGetLeaderboard = async () => {
    try {
        const leaderboard = await prisma.employeePoints.findMany({
            where: { weeklyPoints: { gt: 0 } },
            include: { employee: { select: { name: true } } },
            orderBy: { weeklyPoints: 'desc' },
            take: 5
        });

        if (leaderboard.length === 0) {
            return { success: true, message: '🏆 No points earned yet. Start completing tasks!' };
        }

        const medals = ['🥇', '🥈', '🥉'];
        const lines = leaderboard.map((p, i) => {
            const medal = medals[i] || `${i + 1}.`;
            return `${medal} ${p.employee.name} (${p.weeklyPoints} pts)`;
        });

        return { success: true, message: `🏆 This Week:\n${lines.join('\n')}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetMyStats = async (employeeId) => {
    try {
        const points = await getOrCreatePoints(employeeId);
        const achievementCount = await prisma.achievement.count({ where: { employeeId } });

        const streakIcon = points.currentStreak >= 7 ? '🔥' : points.currentStreak >= 3 ? '⚡' : '📅';

        return {
            success: true,
            message: `📊 Level ${points.level} | ${points.totalPoints} pts | ${streakIcon} ${points.currentStreak}-day streak | ${achievementCount} achievements`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetAchievements = async (employeeId) => {
    try {
        const achievements = await prisma.achievement.findMany({
            where: { employeeId },
            orderBy: { earnedAt: 'desc' },
            take: 10
        });

        if (achievements.length === 0) {
            return { success: true, message: '🏆 No achievements yet. Keep working to earn badges!' };
        }

        const badges = achievements.slice(0, 5).map(a => `${a.icon} ${a.title}`);
        const extra = achievements.length > 5 ? ` +${achievements.length - 5} more` : '';

        return { success: true, message: `🏆 ${achievements.length} badges: ${badges.join(', ')}${extra}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const handleGetStreaks = async (employeeId) => {
    try {
        const myPoints = await getOrCreatePoints(employeeId);

        const topStreaks = await prisma.employeePoints.findMany({
            where: { currentStreak: { gt: 0 } },
            include: { employee: { select: { name: true } } },
            orderBy: { currentStreak: 'desc' },
            take: 5
        });

        if (topStreaks.length === 0) {
            return { success: true, message: `🔥 Your streak: ${myPoints.currentStreak} days (best: ${myPoints.longestStreak})` };
        }

        const lines = topStreaks.map((p, i) => {
            const icon = i === 0 ? '🔥' : '⚡';
            return `${icon} ${p.employee.name}: ${p.currentStreak}d`;
        });

        return { success: true, message: `Streaks:\n${lines.join('\n')}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ============================================
// TEST RUNNER
// ============================================

const runTests = async () => {
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                  BBC ASSISTANT - FULL SYSTEM TEST                          ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    // Get test employee
    const emp = await prisma.employee.findFirst({ select: { id: true } });
    const empId = emp?.id;

    if (!empId) {
        console.log('❌ ERROR: No employees found in database. Please seed the database first.');
        await prisma.$disconnect();
        return;
    }

    const tests = [
        // Phase 1: Voice Commands
        { phase: 'Phase 1', name: "Who's in?", fn: () => handleGetWhosInOffice() },
        { phase: 'Phase 1', name: "Who's absent?", fn: () => handleGetWhosAbsent() },
        { phase: 'Phase 1', name: "Pulse check", fn: () => handleGetPulseCheck() },
        { phase: 'Phase 1', name: "Top performers", fn: () => handleGetTaskLeaderboard({ period: 'week' }) },
        { phase: 'Phase 1', name: "Overdue tasks", fn: () => handleGetOverdueTasks() },
        { phase: 'Phase 1', name: "Who needs help?", fn: () => handleGetWhoNeedsHelp() },

        // Phase 2: Daily Briefing
        { phase: 'Phase 2', name: "Daily briefing", fn: () => handleGetDailyBriefing(empId) },

        // Phase 3: Goals
        { phase: 'Phase 3', name: "Create goal", fn: () => handleCreateGoal(empId, { title: 'Test Goal - Complete 5 tasks', targetValue: 5, unit: 'tasks' }) },
        { phase: 'Phase 3', name: "Show goals", fn: () => handleGetGoals(empId) },
        { phase: 'Phase 3', name: "Goal progress", fn: () => handleGetGoalProgress(empId) },
        { phase: 'Phase 3', name: "Goals at risk", fn: () => handleGetGoalsAtRisk() },

        // Phase 4: Gamification
        { phase: 'Phase 4', name: "Leaderboard", fn: () => handleGetLeaderboard() },
        { phase: 'Phase 4', name: "My stats", fn: () => handleGetMyStats(empId) },
        { phase: 'Phase 4', name: "Achievements", fn: () => handleGetAchievements(empId) },
        { phase: 'Phase 4', name: "Streaks", fn: () => handleGetStreaks(empId) },
    ];

    const results = [];
    const phaseResults = { 'Phase 1': [], 'Phase 2': [], 'Phase 3': [], 'Phase 4': [] };

    for (const test of tests) {
        try {
            process.stdout.write(`Testing: ${test.phase} - ${test.name}...`);
            const start = Date.now();
            const result = await test.fn();
            const duration = Date.now() - start;

            const status = result.success ? '✅' : '❌';
            const preview = result.message.split('\n')[0].substring(0, 40);

            results.push({
                phase: test.phase,
                name: test.name,
                status,
                duration: `${duration}ms`,
                preview: preview + (result.message.length > 40 ? '...' : '')
            });

            phaseResults[test.phase].push(result.success);
            console.log(` ${status} (${duration}ms)`);
        } catch (error) {
            results.push({
                phase: test.phase,
                name: test.name,
                status: '❌',
                duration: '-',
                preview: error.message.substring(0, 40)
            });
            phaseResults[test.phase].push(false);
            console.log(` ❌ ERROR`);
        }
    }

    // Print results table
    console.log('\n┌─────────┬─────────────────────┬────────┬─────────────────────────────────────────┐');
    console.log('│ Phase   │ Command             │ Status │ Response Preview                        │');
    console.log('├─────────┼─────────────────────┼────────┼─────────────────────────────────────────┤');

    for (const r of results) {
        const phase = r.phase.padEnd(7);
        const name = r.name.padEnd(19);
        const status = r.status.padEnd(6);
        const preview = r.preview.padEnd(39);
        console.log(`│ ${phase} │ ${name} │ ${status} │ ${preview} │`);
    }

    console.log('└─────────┴─────────────────────┴────────┴─────────────────────────────────────────┘');

    // Phase summary
    console.log('\n┌────────────────────┬─────────┐');
    console.log('│ Phase              │ Status  │');
    console.log('├────────────────────┼─────────┤');

    for (const [phase, results] of Object.entries(phaseResults)) {
        const allPassed = results.every(r => r);
        const status = allPassed ? '✅ PASS' : '❌ FAIL';
        console.log(`│ ${phase.padEnd(18)} │ ${status.padEnd(7)} │`);
    }

    console.log('└────────────────────┴─────────┘');

    // Overall summary
    const passed = results.filter(r => r.status === '✅').length;
    const failed = results.filter(r => r.status === '❌').length;

    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log(`SUMMARY: ${passed}/${results.length} tests passed, ${failed} failed`);
    console.log('════════════════════════════════════════════════════════════════════════════════\n');

    await prisma.$disconnect();
};

// Run tests
runTests().catch(console.error);
