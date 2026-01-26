const { parseCommand, generateProjectPlan } = require('../services/ai.service');
const prisma = require('../lib/prisma');
const agentLogger = require('../services/agentLogger');
const riskMonitor = require('../services/riskMonitor');
const Anthropic = require('@anthropic-ai/sdk');

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
        const employeeId = req.employee?.id;

        if (!plan || !plan.name || !plan.tasks) {
            return res.status(400).json({ error: 'Valid plan with name and tasks required' });
        }

        // Create the project with AI-generated flag (needs approval)
        const project = await prisma.project.create({
            data: {
                name: plan.name,
                description: plan.description || '',
                color: '#7c3aed', // Default purple for AI projects
                user_id: userId,
                createdById: employeeId || undefined,
                priority: plan.priority || 'MEDIUM',
                status: 'PENDING_APPROVAL',
                approvalStatus: 'PENDING',
                isAIGenerated: true,
                aiGeneratedBy: 'Claude'
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
                        isAIGenerated: true,
                        aiGeneratedBy: 'Claude'
                    }
                })
            )
        );

        console.log(`Created AI project "${project.name}" with ${createdTasks.length} tasks (pending approval)`);

        res.json({
            success: true,
            project,
            tasks: createdTasks,
            message: `Created project "${plan.name}" with ${createdTasks.length} tasks. Pending approval.`
        });
    } catch (error) {
        console.error('Create project from plan error:', error);
        res.status(500).json({
            error: error.message || 'Failed to create project from plan'
        });
    }
};

/**
 * Generate a complete project with tasks from a natural language prompt
 * POST /api/v1/ai/generate-project
 */
const generateProject = async (req, res) => {
    const startTime = Date.now();
    try {
        const { prompt, existingProjectId } = req.body;

        if (!prompt || prompt.trim().length < 5) {
            return res.status(400).json({
                error: 'Prompt is required and must be at least 5 characters'
            });
        }

        const systemPrompt = `You are a project management assistant. Generate a well-structured project based on the user's description.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "name": "Project name",
  "description": "Brief description of the project",
  "priority": "MEDIUM",
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "medium"
    }
  ]
}

Rules:
- Generate 5-10 relevant tasks
- Be specific and actionable
- Priority must be one of: LOW, MEDIUM, HIGH, URGENT
- Task priority must be lowercase: low, medium, high, urgent
- Return ONLY valid JSON, no markdown code blocks`;

        const client = new Anthropic();
        const response = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            system: systemPrompt,
            messages: [
                { role: "user", content: `Create a project for: ${prompt}` }
            ]
        });

        const aiText = response.content[0].text.trim();

        // Extract JSON from response
        let generatedProject;
        try {
            // Remove markdown code blocks if present
            const cleanedText = aiText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();
            generatedProject = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw text:', aiText);
            return res.status(500).json({ error: 'Could not parse AI response' });
        }

        // Log the generation
        await agentLogger.logSuccess(
            'ProjectGenerator',
            'generate_project',
            'project',
            null,
            `Generated project "${generatedProject.name}" with ${generatedProject.tasks?.length || 0} tasks`,
            0.9,
            {
                inputContext: { prompt },
                outputData: { projectName: generatedProject.name, taskCount: generatedProject.tasks?.length },
                executionTime: Date.now() - startTime
            }
        );

        res.json({
            message: `I've created a project called "${generatedProject.name}" with ${generatedProject.tasks?.length || 0} tasks. Review it below and click "Create Project" when ready.`,
            project: generatedProject
        });

    } catch (error) {
        await agentLogger.logFailure(
            'ProjectGenerator',
            'generate_project',
            'project',
            'Failed to generate project',
            error.message
        );
        console.error('AI project generation error:', error);
        res.status(500).json({ error: 'Failed to generate project' });
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

/**
 * AI Project Assistant - Context-aware help for a project
 * POST /api/v1/ai/project/:id/assist
 */
const assistProject = async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    const { question } = req.body;
    const userId = req.user?.userId;

    try {
        // Fetch project with tasks
        const project = await prisma.project.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { user_id: userId },
                    { members: { some: { user_id: userId } } }
                ]
            },
            include: {
                tasks: {
                    orderBy: { created_at: 'desc' },
                    take: 50
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }

        // Build context for AI
        const tasksSummary = project.tasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.due_date,
            timeEstimate: t.time_estimate
        }));

        const todoCount = project.tasks.filter(t => t.status === 'todo').length;
        const inProgressCount = project.tasks.filter(t => t.status === 'in_progress').length;
        const doneCount = project.tasks.filter(t => t.status === 'done').length;
        const overdueCount = project.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

        const systemPrompt = `You are an AI Project Assistant for "${project.name}".

Project Description: ${project.description || 'No description provided'}

Current Status:
- Total Tasks: ${project.tasks.length}
- To Do: ${todoCount}
- In Progress: ${inProgressCount}
- Done: ${doneCount}
- Overdue: ${overdueCount}

Tasks:
${JSON.stringify(tasksSummary, null, 2)}

You help project managers by:
1. Analyzing project health and progress
2. Suggesting next actions and priorities
3. Identifying risks and bottlenecks
4. Recommending task assignments
5. Providing timeline insights

Be concise, actionable, and specific. Reference actual task names when relevant.`;

        const client = new Anthropic();
        const response = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                { role: "user", content: question || "What should we focus on next? Give me a brief status and top 3 priorities." }
            ]
        });

        const advice = response.content[0].text;

        // Log the assist action
        await agentLogger.logSuccess(
            'ProjectAssistant',
            'assist_project',
            'project',
            project.id,
            `Provided assistance for "${project.name}": ${question?.substring(0, 50) || 'Status request'}...`,
            0.85,
            {
                inputContext: { projectId: project.id, question },
                outputData: { advice: advice.substring(0, 200) },
                executionTime: Date.now() - startTime
            }
        );

        res.json({
            success: true,
            projectId: project.id,
            projectName: project.name,
            question: question || "What should we focus on next?",
            advice,
            context: {
                totalTasks: project.tasks.length,
                todo: todoCount,
                inProgress: inProgressCount,
                done: doneCount,
                overdue: overdueCount
            }
        });

    } catch (error) {
        await agentLogger.logFailure(
            'ProjectAssistant',
            'assist_project',
            'project',
            `Failed to assist project ${id}`,
            error.message
        );
        console.error('Project assist error:', error);
        res.status(500).json({ error: error.message || 'Failed to get AI assistance' });
    }
};

/**
 * AI Task Breakdown - Generate subtasks for a task
 * POST /api/v1/ai/task/:id/subtasks
 */
const generateSubtasks = async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    const { count = 5 } = req.body;
    const userId = req.user?.userId;

    try {
        // Fetch the task
        const task = await prisma.task.findFirst({
            where: {
                id: parseInt(id),
                user_id: userId
            },
            include: {
                project: { select: { name: true, description: true } },
                subtasks: true
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        const systemPrompt = `You are a task breakdown specialist. Break down the given task into ${count} specific, actionable subtasks.

Project Context: ${task.project?.name || 'Personal Task'} - ${task.project?.description || ''}

Return ONLY a JSON array of subtasks:
[
  { "title": "Subtask title", "description": "Brief description" },
  ...
]

Rules:
- Create exactly ${count} subtasks
- Each subtask should be specific and actionable
- Subtasks should be logical steps to complete the main task
- Return ONLY valid JSON, no markdown`;

        const client = new Anthropic();
        const response = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                { role: "user", content: `Break down this task: "${task.title}"\n\nDescription: ${task.description || 'No description'}` }
            ]
        });

        let subtasks;
        try {
            const content = response.content[0].text.trim();
            const jsonStr = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').replace(/^```\s*/, '');
            subtasks = JSON.parse(jsonStr);
        } catch (parseError) {
            throw new Error('Failed to parse AI response as JSON');
        }

        // Log the action
        await agentLogger.logSuccess(
            'TaskBreakdown',
            'generate_subtasks',
            'task',
            task.id,
            `Generated ${subtasks.length} subtasks for "${task.title}"`,
            0.85,
            {
                inputContext: { taskId: task.id, taskTitle: task.title },
                outputData: { subtasks },
                executionTime: Date.now() - startTime
            }
        );

        res.json({
            success: true,
            taskId: task.id,
            taskTitle: task.title,
            subtasks,
            message: `Generated ${subtasks.length} subtasks`
        });

    } catch (error) {
        await agentLogger.logFailure(
            'TaskBreakdown',
            'generate_subtasks',
            'task',
            `Failed to generate subtasks for task ${id}`,
            error.message
        );
        console.error('Generate subtasks error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate subtasks' });
    }
};

/**
 * Save AI-generated subtasks to database
 * POST /api/v1/ai/task/:id/subtasks/save
 */
const saveSubtasks = async (req, res) => {
    const { id } = req.params;
    const { subtasks } = req.body;
    const userId = req.user?.userId;

    try {
        // Verify task ownership
        const task = await prisma.task.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Create subtasks
        const created = await Promise.all(
            subtasks.map(st =>
                prisma.subtask.create({
                    data: {
                        title: st.title,
                        task_id: task.id,
                        is_complete: false
                    }
                })
            )
        );

        res.json({
            success: true,
            subtasks: created,
            message: `Saved ${created.length} subtasks`
        });

    } catch (error) {
        console.error('Save subtasks error:', error);
        res.status(500).json({ error: error.message || 'Failed to save subtasks' });
    }
};

/**
 * Scan project for risks on-demand
 * POST /api/v1/ai/project/:id/scan
 */
const scanProjectRisks = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    try {
        // Verify access
        const project = await prisma.project.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { user_id: userId },
                    { members: { some: { user_id: userId } } }
                ]
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const scan = await riskMonitor.scanProject(parseInt(id));

        res.json({
            success: true,
            projectId: scan.project.id,
            projectName: scan.project.name,
            riskLevel: scan.riskLevel,
            healthScore: scan.healthScore,
            overdueTasks: scan.overdueTasks.length,
            totalActiveTasks: scan.totalActiveTasks,
            avgDaysOverdue: scan.avgDaysOverdue,
            tasks: scan.overdueTasks.map(t => ({
                id: t.id,
                title: t.title,
                dueDate: t.due_date,
                status: t.status
            }))
        });

    } catch (error) {
        console.error('Scan project risks error:', error);
        res.status(500).json({ error: error.message || 'Failed to scan project' });
    }
};

/**
 * Get risk summary for user's projects
 * GET /api/v1/ai/risks/summary
 */
const getRiskSummary = async (req, res) => {
    const userId = req.user?.userId;

    try {
        const summary = await riskMonitor.getRiskSummary(userId);
        res.json({ success: true, ...summary });
    } catch (error) {
        console.error('Get risk summary error:', error);
        res.status(500).json({ error: error.message || 'Failed to get risk summary' });
    }
};

/**
 * Toggle AI monitoring for a project
 * POST /api/v1/ai/project/:id/monitoring
 */
const toggleMonitoring = async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;
    const userId = req.user?.userId;

    try {
        const project = await prisma.project.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const updated = await prisma.project.update({
            where: { id: parseInt(id) },
            data: { ai_monitoring_enabled: enabled }
        });

        res.json({
            success: true,
            projectId: updated.id,
            aiMonitoringEnabled: updated.ai_monitoring_enabled
        });

    } catch (error) {
        console.error('Toggle monitoring error:', error);
        res.status(500).json({ error: error.message || 'Failed to toggle monitoring' });
    }
};

module.exports = {
    handleCommand,
    createProjectPlan,
    createProjectFromPlan,
    generateProject,
    assistProject,
    generateSubtasks,
    saveSubtasks,
    scanProjectRisks,
    getRiskSummary,
    toggleMonitoring
};
