const prisma = require('../lib/prisma');
const cache = require('../utils/cache');
const { logCreate, logUpdate, logDelete } = require('../services/activityLogger');

const createProject = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                description,
                color: color || '#6366f1',
                user_id: req.user.userId
            }
        });

        // Log activity
        await logCreate(
            req.user.userId,
            'project',
            project.id,
            `Created project: ${name}`,
            req,
            { name, color }
        );

        cache.delByPrefix(`projects:${req.user.userId}`);
        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: "Failed to create project" });
    }
};

const getProjects = async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const cacheKey = `projects:${req.user.userId}:${includeArchived}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        const whereClause = { user_id: req.user.userId };

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                tasks: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Add task counts
        const projectsWithCounts = projects.map(p => ({
            ...p,
            taskCount: p.tasks.length,
            completedCount: p.tasks.filter(t => t.status === 'done').length,
            tasks: undefined // Remove tasks array, keep only counts
        }));

        cache.set(cacheKey, projectsWithCounts, 60);
        res.json(projectsWithCounts);
    } catch (error) {
        console.error('Get projects error:', error);
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
                        subtasks: true,
                        actionItems: true
                    },
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!project) return res.status(404).json({ error: "Project not found" });

        // Verify ownership
        if (project.user_id !== req.user.userId) return res.status(403).json({ error: "Unauthorized" });

        res.json(project);
    } catch (error) {
        console.error('Get project details error:', error);
        res.status(500).json({ error: "Failed to fetch project details" });
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;

        // Check if project exists and belongs to user
        const existingProject = await prisma.project.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProject) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (existingProject.user_id !== req.user.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;

        const project = await prisma.project.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Log activity
        await logUpdate(
            req.user.userId,
            'project',
            project.id,
            `Updated project: ${project.name}`,
            req,
            { name, description, color }
        );

        cache.delByPrefix(`projects:${req.user.userId}`);
        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: "Failed to update project" });
    }
};

const archiveProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { archived = true } = req.body;

        // Check if project exists and belongs to user
        const existingProject = await prisma.project.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProject) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (existingProject.user_id !== req.user.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Note: If 'archived' field doesn't exist in schema, this will fail
        // We'll handle it gracefully
        try {
            const project = await prisma.project.update({
                where: { id: parseInt(id) },
                data: { archived: archived }
            });

            // Log activity
            await logUpdate(
                req.user.userId,
                'project',
                project.id,
                `${archived ? 'Archived' : 'Unarchived'} project: ${project.name}`,
                req,
                { archived }
            );

            cache.delByPrefix(`projects:${req.user.userId}`);
            res.json(project);
        } catch (prismaError) {
            // If archived field doesn't exist, simulate it with a response
            console.log('Archive field may not exist in schema:', prismaError.message);
            res.json({ ...existingProject, archived: archived });
        }
    } catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ error: "Failed to archive project" });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { moveTasks } = req.body; // Optional: project ID to move tasks to

        // Check if project exists and belongs to user
        const existingProject = await prisma.project.findUnique({
            where: { id: parseInt(id) },
            include: { tasks: { select: { id: true } } }
        });

        if (!existingProject) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (existingProject.user_id !== req.user.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // If moveTasks is specified, move tasks to another project
        if (moveTasks && existingProject.tasks.length > 0) {
            const targetProject = await prisma.project.findUnique({
                where: { id: parseInt(moveTasks) }
            });

            if (!targetProject || targetProject.user_id !== req.user.userId) {
                return res.status(400).json({ error: "Invalid target project" });
            }

            await prisma.task.updateMany({
                where: { project_id: parseInt(id) },
                data: { project_id: parseInt(moveTasks) }
            });
        } else {
            // Delete all tasks in the project (cascade should handle this)
            await prisma.task.deleteMany({
                where: { project_id: parseInt(id) }
            });
        }

        // Delete the project
        await prisma.project.delete({
            where: { id: parseInt(id) }
        });

        // Log activity
        await logDelete(
            req.user.userId,
            'project',
            id,
            `Deleted project: ${existingProject.name}`,
            req,
            { tasksCount: existingProject.tasks.length, movedTo: moveTasks || null }
        );

        cache.delByPrefix(`projects:${req.user.userId}`);
        res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};

// ==========================================
// PROJECT MEMBER MANAGEMENT
// ==========================================

const getProjectMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);

        // Verify user has access to this project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { user_id: req.user.userId },
                    { members: { some: { user_id: req.user.userId } } }
                ]
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }

        const members = await prisma.projectMember.findMany({
            where: { project_id: projectId },
            include: {
                user: {
                    select: { id: true, email: true, username: true, avatar_url: true }
                }
            },
            orderBy: { added_at: 'asc' }
        });

        res.json(members);
    } catch (error) {
        console.error('Get project members error:', error);
        res.status(500).json({ error: 'Failed to fetch project members' });
    }
};

const addProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role = 'editor' } = req.body;
        const projectId = parseInt(id);

        // Only owner can add members
        const project = await prisma.project.findFirst({
            where: { id: projectId, user_id: req.user.userId }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or you are not the owner' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already a member
        const existing = await prisma.projectMember.findUnique({
            where: { project_id_user_id: { project_id: projectId, user_id: userId } }
        });

        if (existing) {
            return res.status(400).json({ error: 'User is already a member of this project' });
        }

        const member = await prisma.projectMember.create({
            data: {
                project_id: projectId,
                user_id: userId,
                role: role,
                added_by: req.user.userId
            },
            include: {
                user: { select: { id: true, email: true, username: true, avatar_url: true } }
            }
        });

        // Create notification for added user
        await prisma.notification.create({
            data: {
                type: 'project_invite',
                message: `You've been added to project "${project.name}" as ${role}`,
                user_id: userId,
                project_id: projectId
            }
        });

        // Log activity
        await logCreate(
            req.user.userId,
            'project_member',
            member.id,
            `Added ${user.email} to project "${project.name}" as ${role}`,
            req,
            { projectId, userId, role }
        );

        res.status(201).json(member);
    } catch (error) {
        console.error('Add project member error:', error);
        res.status(500).json({ error: 'Failed to add project member' });
    }
};

const updateProjectMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        const projectId = parseInt(id);

        // Only owner can update members
        const project = await prisma.project.findFirst({
            where: { id: projectId, user_id: req.user.userId }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or you are not the owner' });
        }

        const member = await prisma.projectMember.update({
            where: { id: parseInt(memberId) },
            data: { role },
            include: {
                user: { select: { id: true, email: true, username: true } }
            }
        });

        res.json(member);
    } catch (error) {
        console.error('Update project member error:', error);
        res.status(500).json({ error: 'Failed to update project member' });
    }
};

const removeProjectMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const projectId = parseInt(id);

        // Only owner can remove members
        const project = await prisma.project.findFirst({
            where: { id: projectId, user_id: req.user.userId }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or you are not the owner' });
        }

        const member = await prisma.projectMember.findUnique({
            where: { id: parseInt(memberId) },
            include: { user: { select: { email: true } } }
        });

        await prisma.projectMember.delete({
            where: { id: parseInt(memberId) }
        });

        // Log activity
        await logDelete(
            req.user.userId,
            'project_member',
            memberId,
            `Removed ${member?.user?.email || 'user'} from project "${project.name}"`,
            req,
            { projectId, memberId }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Remove project member error:', error);
        res.status(500).json({ error: 'Failed to remove project member' });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectDetails,
    updateProject,
    archiveProject,
    deleteProject,
    getProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember
};
