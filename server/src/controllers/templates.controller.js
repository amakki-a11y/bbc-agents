const prisma = require('../lib/prisma');

const getTemplates = async (req, res) => {
    try {
        const templates = await prisma.taskTemplate.findMany({
            where: { user_id: req.user.userId },
            orderBy: { created_at: 'desc' }
        });
        res.json(templates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

const createTemplate = async (req, res) => {
    try {
        const { name, description, priority, tags, time_estimate } = req.body;
        const template = await prisma.taskTemplate.create({
            data: {
                name,
                description,
                priority,
                tags,
                time_estimate,
                user_id: req.user.userId
            }
        });
        res.status(201).json(template);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};

const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, priority, tags, time_estimate } = req.body;
        const template = await prisma.taskTemplate.update({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: {
                name,
                description,
                priority,
                tags,
                time_estimate
            }
        });
        res.json(template);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.taskTemplate.delete({
            where: { id: parseInt(id), user_id: req.user.userId }
        });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

const instantiateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { due_date, project_id } = req.body; // Overrides or additional fields

        // 1. Get the template
        const template = await prisma.taskTemplate.findUnique({
            where: { id: parseInt(id), user_id: req.user.userId }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // 2. Create the task
        const newTask = await prisma.task.create({
            data: {
                title: template.name,
                description: template.description,
                priority: template.priority,
                tags: template.tags,
                time_estimate: template.time_estimate,
                due_date: due_date ? new Date(due_date) : null,
                project_id: project_id ? parseInt(project_id) : null,
                user_id: req.user.userId
            }
        });

        res.status(201).json(newTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task from template' });
    }
};

module.exports = {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate
};
