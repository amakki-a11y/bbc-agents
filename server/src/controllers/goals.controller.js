const prisma = require('../lib/prisma');
const { logCreate, logUpdate, logDelete } = require('../services/activityLogger');

// Get goal statistics
const getGoalStats = async (req, res) => {
    try {
        const goals = await prisma.goal.findMany();

        const now = new Date();
        const stats = {
            total: goals.length,
            completed: goals.filter(g => g.status === 'completed').length,
            atRisk: goals.filter(g => {
                if (g.status === 'completed') return false;
                const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
                const daysLeft = Math.ceil((new Date(g.dueDate) - now) / (1000 * 60 * 60 * 24));
                return progress < 50 && daysLeft < 7;
            }).length,
            onTrack: goals.filter(g => {
                if (g.status === 'completed') return false;
                const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
                const daysLeft = Math.ceil((new Date(g.dueDate) - now) / (1000 * 60 * 60 * 24));
                return progress >= 50 || daysLeft >= 7;
            }).length
        };

        res.json(stats);
    } catch (error) {
        console.error('getGoalStats error:', error);
        res.status(500).json({ error: 'Failed to fetch goal stats' });
    }
};

// Get all goals
const getGoals = async (req, res) => {
    try {
        const { status, ownerType, ownerId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (ownerType) where.ownerType = ownerType;
        if (ownerId) where.ownerId = ownerId;

        const goals = await prisma.goal.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, name: true }
                },
                milestones: {
                    orderBy: { dueDate: 'asc' }
                },
                childGoals: {
                    select: { id: true, title: true, status: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Enrich with owner names
        const enrichedGoals = await Promise.all(goals.map(async (goal) => {
            let ownerName = 'Company';

            if (goal.ownerType === 'employee' && goal.ownerId) {
                const employee = await prisma.employee.findUnique({
                    where: { id: goal.ownerId },
                    select: { name: true }
                });
                ownerName = employee?.name || 'Unknown Employee';
            } else if (goal.ownerType === 'department' && goal.ownerId) {
                const dept = await prisma.department.findUnique({
                    where: { id: parseInt(goal.ownerId) },
                    select: { name: true }
                });
                ownerName = dept?.name || 'Unknown Department';
            }

            // Calculate progress percentage
            const progress = goal.targetValue > 0
                ? Math.round((goal.currentValue / goal.targetValue) * 100)
                : 0;

            // Determine status
            const now = new Date();
            const daysLeft = Math.ceil((new Date(goal.dueDate) - now) / (1000 * 60 * 60 * 24));
            let computedStatus = goal.status;

            if (goal.status !== 'completed') {
                if (daysLeft < 0) {
                    computedStatus = 'overdue';
                } else if (progress < 50 && daysLeft < 7) {
                    computedStatus = 'at_risk';
                }
            }

            return {
                ...goal,
                ownerName,
                progress,
                daysLeft,
                computedStatus
            };
        }));

        res.json(enrichedGoals);
    } catch (error) {
        console.error('getGoals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
};

// Get single goal
const getGoalById = async (req, res) => {
    try {
        const { id } = req.params;

        const goal = await prisma.goal.findUnique({
            where: { id: parseInt(id) },
            include: {
                creator: {
                    select: { id: true, name: true, email: true }
                },
                milestones: {
                    orderBy: { dueDate: 'asc' }
                },
                parentGoal: {
                    select: { id: true, title: true }
                },
                childGoals: true
            }
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('getGoalById error:', error);
        res.status(500).json({ error: 'Failed to fetch goal' });
    }
};

// Create goal
const createGoal = async (req, res) => {
    try {
        const {
            title,
            description,
            goalType = 'individual',
            targetValue,
            unit,
            ownerType,
            ownerId,
            startDate,
            dueDate,
            parentGoalId,
            autoTrackField
        } = req.body;

        // Get employee ID from authenticated user (optional)
        const employeeId = req.employee?.id;

        // If ownerType is employee and no ownerId, use current employee
        let finalOwnerId = ownerId;
        if (ownerType === 'employee' && !finalOwnerId && employeeId) {
            finalOwnerId = employeeId;
        }

        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                goalType,
                targetValue: targetValue ? parseFloat(targetValue) : null,
                unit,
                ownerType: ownerType || 'employee',
                ownerId: finalOwnerId || null,
                startDate: startDate ? new Date(startDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                parentGoalId: parentGoalId ? parseInt(parentGoalId) : null,
                autoTrackField,
                createdBy: employeeId || null
            },
            include: {
                creator: {
                    select: { id: true, name: true }
                }
            }
        });

        // Log activity
        await logCreate(
            req.user?.userId,
            'goal',
            goal.id,
            `Created goal: ${title}`,
            req,
            { goalType, ownerType, targetValue }
        );

        res.status(201).json(goal);
    } catch (error) {
        console.error('createGoal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
};

// Update goal
const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            targetValue,
            currentValue,
            status,
            dueDate,
            autoTrackField
        } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (targetValue !== undefined) updateData.targetValue = parseFloat(targetValue);
        if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue);
        if (status !== undefined) updateData.status = status;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (autoTrackField !== undefined) updateData.autoTrackField = autoTrackField;

        const goal = await prisma.goal.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                creator: {
                    select: { id: true, name: true }
                },
                milestones: true
            }
        });

        // Log activity
        await logUpdate(
            req.user?.userId,
            'goal',
            goal.id,
            `Updated goal: ${goal.title}`,
            req,
            { status, currentValue, targetValue }
        );

        res.json(goal);
    } catch (error) {
        console.error('updateGoal error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Goal not found' });
        }
        res.status(500).json({ error: 'Failed to update goal' });
    }
};

// Delete goal
const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;

        // Get goal title before deleting
        const goal = await prisma.goal.findUnique({ where: { id: parseInt(id) } });

        await prisma.goal.delete({
            where: { id: parseInt(id) }
        });

        // Log activity
        await logDelete(
            req.user?.userId,
            'goal',
            id,
            `Deleted goal: ${goal?.title || id}`,
            req
        );

        res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        console.error('deleteGoal error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Goal not found' });
        }
        res.status(500).json({ error: 'Failed to delete goal' });
    }
};

module.exports = {
    getGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalStats
};
