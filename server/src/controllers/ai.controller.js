const { parseCommand, generateProjectPlan } = require('../services/ai.service');
const prisma = require('../lib/prisma');

/**
 * Generate a project plan from a goal description
 * POST /api/v1/ai/plan
 */
const createProjectPlan = async (req, res) => {
    try {
        const { goal, context = {} } = req.body;

        if (!goal || goal.trim().length < 5) {
            return res.status(400).json({
                error: 'Goal is required and must be at least 5 characters'
            });
        }

        console.log('Generating project plan for goal:', goal);

        const plan = await generateProjectPlan(goal.trim(), context);

        console.log('Generated plan:', plan.name, 'with', plan.tasks?.length, 'tasks');

        res.json({
            success: true,
            plan
        });
    } catch (error) {
        console.error('Create project plan error:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate project plan'
        });
    }
};

/**
 * Create a project from an AI-generated plan
 * POST /api/v1/ai/plan/create
 */
const createProjectFromPlan = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user?.userId;

        if (!plan || !plan.name || !plan.tasks) {
            return res.status(400).json({ error: 'Valid plan with name and tasks required' });
        }

        // Create the project
        const project = await prisma.project.create({
            data: {
                name: plan.name,
                description: plan.description || '',
                color: '#7c3aed', // Default purple for AI projects
                user_id: userId
            }
        });

        // Create all tasks from the plan
        const createdTasks = await Promise.all(
            plan.tasks.map((task, index) =>
                prisma.task.create({
                    data: {
                        title: task.title,
                        description: task.description || '',
                        status: 'todo',
                        priority: task.priority || 'medium',
                        project_id: project.id,
                        user_id: userId,
                        time_estimate: task.time_estimate || null,
                        order: index
                    }
                })
            )
        );

        console.log(`Created project "${project.name}" with ${createdTasks.length} tasks`);

        res.json({
            success: true,
            project,
            tasks: createdTasks,
            message: `Created project "${plan.name}" with ${createdTasks.length} tasks`
        });
    } catch (error) {
        console.error('Create project from plan error:', error);
        res.status(500).json({
            error: error.message || 'Failed to create project from plan'
        });
    }
};

const handleCommand = async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) return res.status(400).json({ error: 'Command prompt required' });

        console.log("Processing command:", command);
        const intent = await parseCommand(command);
        console.log("Parsed intent:", intent);

        if (intent.action === 'create') {
            if (intent.entity === 'task') {
                const newTask = await prisma.task.create({
                    data: {
                        title: intent.data.title,
                        due_date: intent.data.due_date ? new Date(intent.data.due_date) : null,
                        user_id: req.user.userId,
                    },
                });
                return res.json({ message: 'Task created', result: newTask });
            }

            if (intent.entity === 'event') {
                const newEvent = await prisma.event.create({
                    data: {
                        title: intent.data.title,
                        start_time: new Date(intent.data.start_time),
                        end_time: new Date(intent.data.end_time),
                        description: intent.data.description,
                        user_id: req.user.userId,
                    },
                });
                return res.json({ message: 'Event scheduled', result: newEvent });
            }
        }

        res.json({ message: 'Command understood but action not fully supported yet', intent });

    } catch (error) {
        console.error("Command Handler Error:", error);
        res.status(500).json({ error: error.message || 'Failed to process command' });
    }
};

module.exports = { handleCommand, createProjectPlan, createProjectFromPlan };
