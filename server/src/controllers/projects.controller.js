const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cache = require('../utils/cache');

const createProject = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                description,
                color,
                user_id: req.user.userId
            }
        });
        cache.delByPrefix(`projects:${req.user.userId}`);
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: "Failed to create project" });
    }
};

const getProjects = async (req, res) => {
    try {
        const cacheKey = `projects:${req.user.userId}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        const projects = await prisma.project.findMany({
            where: { user_id: req.user.userId },
            include: { tasks: { select: { status: true } } } // Get counts later if needed
        });

        cache.set(cacheKey, projects, 60);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch projects" });
    }
};

const getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: parseInt(id) },
            include: {
                tasks: {
                    include: {
                        user: { select: { email: true } },
                        assignees: true // if we add this relation later, for now user is owner
                    }
                }
            }
        });

        if (!project) return res.status(404).json({ error: "Project not found" });

        // Verify ownership
        if (project.user_id !== req.user.userId) return res.status(403).json({ error: "Unauthorized" });

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch project details" });
    }
};

const updateProject = async (req, res) => {
    // ... basic update logic
};

const deleteProject = async (req, res) => {
    // ... basic delete logic
};

module.exports = {
    createProject,
    getProjects,
    getProjectDetails
};
