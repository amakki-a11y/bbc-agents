const prisma = require('../lib/prisma');
const cache = require('../utils/cache');
const { logCreate, logUpdate, logDelete } = require('../services/activityLogger');

// Helper: Check if user has permission on project
async function checkProjectPermission(userId, employeeId, projectId, requiredPermission = 'VIEWER') {
    const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        include: {
            shares: true,
            creator: true
        }
    });

    if (!project) return { hasAccess: false, project: null };

    // Owner (user_id) always has full access
    if (project.user_id === userId) {
        return { hasAccess: true, project, permission: 'ADMIN' };
    }

    // Creator (employee) always has full access
    if (project.createdById && project.createdById === employeeId) {
        return { hasAccess: true, project, permission: 'ADMIN' };
    }

    // Check ProjectMember (legacy sharing with Users)
    const member = await prisma.projectMember.findUnique({
        where: { project_id_user_id: { project_id: parseInt(projectId), user_id: userId } }
    });
    if (member) {
        const memberPermissionMap = { viewer: 'VIEWER', editor: 'EDITOR', admin: 'ADMIN' };
        const memberPerm = memberPermissionMap[member.role] || 'VIEWER';
        const permissionLevels = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
        const hasAccess = permissionLevels[memberPerm] >= permissionLevels[requiredPermission];
        return { hasAccess, project, permission: memberPerm };
    }

    // Check ProjectShare with user
    if (employeeId) {
        const userShare = project.shares.find(s => s.sharedWithUserId === employeeId);
        if (userShare) {
            const permissionLevels = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
            const hasAccess = permissionLevels[userShare.permission] >= permissionLevels[requiredPermission];
            return { hasAccess, project, permission: userShare.permission };
        }
    }

    // Check department/role shares
    if (employeeId) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { department_id: true, role_id: true }
        });

        if (employee) {
            // Check department share
            const deptShare = project.shares.find(s => s.sharedWithDeptId === employee.department_id);
            if (deptShare) {
                const permissionLevels = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
                const hasAccess = permissionLevels[deptShare.permission] >= permissionLevels[requiredPermission];
                return { hasAccess, project, permission: deptShare.permission };
            }

            // Check role share
            const roleShare = project.shares.find(s => s.sharedWithRoleId === employee.role_id);
            if (roleShare) {
                const permissionLevels = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
                const hasAccess = permissionLevels[roleShare.permission] >= permissionLevels[requiredPermission];
                return { hasAccess, project, permission: roleShare.permission };
            }
        }
    }

    return { hasAccess: false, project: null };
}

// Log project activity
async function logProjectActivity(projectId, userId, action, details = {}) {
    try {
        await prisma.projectActivity.create({
            data: {
                projectId: parseInt(projectId),
                userId: userId,
                action,
                details
            }
        });
    } catch (error) {
        console.error('Failed to log project activity:', error);
    }
}

const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            color,
            priority,
            status,
            startDate,
            dueDate,
            departmentId,
            isAIGenerated,
            aiGeneratedBy,
            tasks // Optional: AI can send tasks to create
        } = req.body;

        // Determine if approval is needed (AI-generated projects need approval)
        const needsApproval = isAIGenerated === true;

        const projectData = {
            name,
            description,
            color: color || '#6366f1',
            user_id: req.user.userId,
            priority: priority || 'MEDIUM',
            status: needsApproval ? 'PENDING_APPROVAL' : (status || 'ACTIVE'),
            approvalStatus: needsApproval ? 'PENDING' : 'NOT_REQUIRED',
            isAIGenerated: isAIGenerated || false,
            aiGeneratedBy: aiGeneratedBy || null,
            startDate: startDate ? new Date(startDate) : null,
            dueDate: dueDate ? new Date(dueDate) : null
        };

        // Link to employee if available
        if (req.employee?.id) {
            projectData.createdById = req.employee.id;
        }

        // Link to department if specified
        if (departmentId) {
            projectData.departmentId = departmentId;
        }

        const project = await prisma.project.create({
            data: projectData,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, name: true } }
            }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(project.id, req.employee.id, 'created', {
                isAIGenerated,
                aiGeneratedBy,
                name
            });
        }

        // If tasks were provided (AI generation), create them
        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                await prisma.task.create({
                    data: {
                        title: task.title,
                        description: task.description || '',
                        project_id: project.id,
                        user_id: req.user.userId,
                        priority: task.priority || 'medium',
                        status: 'todo',
                        isAIGenerated: true,
                        aiGeneratedBy: aiGeneratedBy
                    }
                });
            }

            // Log task generation activity
            if (req.employee?.id) {
                await logProjectActivity(project.id, req.employee.id, 'tasks_generated', {
                    count: tasks.length,
                    aiGeneratedBy
                });
            }
        }

        // Log activity
        await logCreate(
            req.user.userId,
            'project',
            project.id,
            `Created project: ${name}${isAIGenerated ? ' (AI-generated)' : ''}`,
            req,
            { name, color, isAIGenerated, aiGeneratedBy }
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
        const userId = req.user.userId;
        const employeeId = req.employee?.id;
        const userRole = req.employee?.role?.name;
        const userDeptId = req.employee?.department_id;

        const {
            includeArchived,
            status,
            priority,
            showAIGenerated,
            showPendingApproval
        } = req.query;

        const cacheKey = `projects:${userId}:${includeArchived}:${status}:${priority}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        let projects;

        // Admin sees all projects
        if (userRole === 'Admin' || userRole === 'Super Admin') {
            projects = await prisma.project.findMany({
                where: {
                    ...(includeArchived !== 'true' && { archived: false }),
                    ...(status && status !== 'all' && { status }),
                    ...(priority && priority !== 'all' && { priority })
                },
                include: {
                    creator: { select: { id: true, name: true, email: true } },
                    department: { select: { id: true, name: true } },
                    tasks: {
                        select: { id: true, status: true }
                    },
                    shares: {
                        include: {
                            sharedWithUser: { select: { id: true, name: true } }
                        }
                    },
                    _count: { select: { tasks: true } }
                },
                orderBy: { updated_at: 'desc' }
            });
        } else {
            // Others see: own projects + shared with them + department projects
            const whereClause = {
                OR: [
                    { user_id: userId },
                    { createdById: employeeId }
                ],
                ...(includeArchived !== 'true' && { archived: false }),
                ...(status && status !== 'all' && { status }),
                ...(priority && priority !== 'all' && { priority })
            };

            // Add sharing conditions
            if (employeeId) {
                whereClause.OR.push(
                    { shares: { some: { sharedWithUserId: employeeId } } }
                );
            }
            if (userDeptId) {
                whereClause.OR.push(
                    { shares: { some: { sharedWithDeptId: userDeptId } } },
                    { departmentId: userDeptId }
                );
            }

            // Also check ProjectMember
            whereClause.OR.push(
                { members: { some: { user_id: userId } } }
            );

            projects = await prisma.project.findMany({
                where: whereClause,
                include: {
                    creator: { select: { id: true, name: true, email: true } },
                    department: { select: { id: true, name: true } },
                    tasks: {
                        select: { id: true, status: true }
                    },
                    shares: {
                        include: {
                            sharedWithUser: { select: { id: true, name: true } }
                        }
                    },
                    _count: { select: { tasks: true } }
                },
                orderBy: { updated_at: 'desc' }
            });
        }

        // Add task counts and filter by additional criteria
        let projectsWithCounts = projects.map(p => ({
            ...p,
            taskCount: p.tasks.length,
            completedCount: p.tasks.filter(t => t.status === 'done').length,
            tasks: undefined // Remove tasks array, keep only counts
        }));

        // Filter by AI generated if specified
        if (showAIGenerated === 'false') {
            projectsWithCounts = projectsWithCounts.filter(p => !p.isAIGenerated);
        }

        // Filter by pending approval if specified
        if (showPendingApproval === 'false') {
            projectsWithCounts = projectsWithCounts.filter(p => p.approvalStatus !== 'PENDING');
        }

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
        const { hasAccess, project: accessProject, permission } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'VIEWER'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        const project = await prisma.project.findUnique({
            where: { id: parseInt(id) },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, name: true } },
                tasks: {
                    include: {
                        user: { select: { email: true } },
                        subtasks: true,
                        actionItems: true
                    },
                    orderBy: { created_at: 'desc' }
                },
                shares: {
                    include: {
                        sharedWithUser: { select: { id: true, name: true, email: true } },
                        sharedWithRole: { select: { id: true, name: true } },
                        sharedWithDept: { select: { id: true, name: true } },
                        sharedByUser: { select: { id: true, name: true } }
                    }
                },
                activities: {
                    include: {
                        user: { select: { id: true, name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                members: {
                    include: {
                        user: { select: { id: true, email: true, username: true } }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({ ...project, userPermission: permission });
    } catch (error) {
        console.error('Get project details error:', error);
        res.status(500).json({ error: "Failed to fetch project details" });
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasAccess, permission } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'EDITOR'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        const {
            name,
            description,
            color,
            status,
            priority,
            startDate,
            dueDate,
            departmentId
        } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (departmentId !== undefined) updateData.departmentId = departmentId || null;

        // Handle status completion
        if (status === 'COMPLETED' && !updateData.completedAt) {
            updateData.completedAt = new Date();
        }

        const project = await prisma.project.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                creator: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } }
            }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(project.id, req.employee.id, 'updated', updateData);
        }

        // Log activity
        await logUpdate(
            req.user.userId,
            'project',
            project.id,
            `Updated project: ${project.name}`,
            req,
            updateData
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

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        const project = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                archived,
                status: archived ? 'ARCHIVED' : 'ACTIVE'
            }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(project.id, req.employee.id, archived ? 'archived' : 'unarchived', {});
        }

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
    } catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ error: "Failed to archive project" });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { moveTasks } = req.body;

        const { hasAccess, project: existingProject } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        const projectWithTasks = await prisma.project.findUnique({
            where: { id: parseInt(id) },
            include: { tasks: { select: { id: true } } }
        });

        // If moveTasks is specified, move tasks to another project
        if (moveTasks && projectWithTasks.tasks.length > 0) {
            const targetProject = await prisma.project.findUnique({
                where: { id: parseInt(moveTasks) }
            });

            if (!targetProject) {
                return res.status(400).json({ error: "Invalid target project" });
            }

            await prisma.task.updateMany({
                where: { project_id: parseInt(id) },
                data: { project_id: parseInt(moveTasks) }
            });
        }

        // Delete the project (cascade will handle related records)
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
            { tasksCount: projectWithTasks.tasks.length, movedTo: moveTasks || null }
        );

        cache.delByPrefix(`projects:${req.user.userId}`);
        res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};

// ==========================================
// AI PROJECT APPROVAL
// ==========================================

const approveProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.employee?.role?.name;

        // Only managers/admins can approve
        if (!['Admin', 'Super Admin', 'Manager'].includes(userRole)) {
            return res.status(403).json({ error: 'Only managers and admins can approve projects' });
        }

        const project = await prisma.project.findUnique({
            where: { id: parseInt(id) }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.approvalStatus !== 'PENDING') {
            return res.status(400).json({ error: 'Project is not pending approval' });
        }

        const updatedProject = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                approvalStatus: 'APPROVED',
                approvedBy: req.user.userId,
                approvedAt: new Date(),
                status: 'ACTIVE'
            },
            include: {
                creator: { select: { id: true, name: true } }
            }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(updatedProject.id, req.employee.id, 'approved', {
                approvedBy: req.employee.name || req.user.email
            });
        }

        // Log activity
        await logUpdate(
            req.user.userId,
            'project',
            updatedProject.id,
            `Approved AI-generated project: ${updatedProject.name}`,
            req,
            { approvalStatus: 'APPROVED' }
        );

        cache.delByPrefix('projects:');
        res.json(updatedProject);
    } catch (error) {
        console.error('Approve project error:', error);
        res.status(500).json({ error: 'Failed to approve project' });
    }
};

const rejectProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userRole = req.employee?.role?.name;

        // Only managers/admins can reject
        if (!['Admin', 'Super Admin', 'Manager'].includes(userRole)) {
            return res.status(403).json({ error: 'Only managers and admins can reject projects' });
        }

        const project = await prisma.project.findUnique({
            where: { id: parseInt(id) }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.approvalStatus !== 'PENDING') {
            return res.status(400).json({ error: 'Project is not pending approval' });
        }

        const updatedProject = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                approvalStatus: 'REJECTED',
                status: 'CANCELLED'
            }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(updatedProject.id, req.employee.id, 'rejected', {
                reason,
                rejectedBy: req.employee.name || req.user.email
            });
        }

        // Log activity
        await logUpdate(
            req.user.userId,
            'project',
            updatedProject.id,
            `Rejected AI-generated project: ${updatedProject.name}`,
            req,
            { approvalStatus: 'REJECTED', reason }
        );

        cache.delByPrefix('projects:');
        res.json(updatedProject);
    } catch (error) {
        console.error('Reject project error:', error);
        res.status(500).json({ error: 'Failed to reject project' });
    }
};

// ==========================================
// PROJECT SHARING (ProjectShare model)
// ==========================================

const shareProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, roleId, departmentId, permission = 'VIEWER' } = req.body;

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Validate that at least one share target is provided
        if (!userId && !roleId && !departmentId) {
            return res.status(400).json({ error: 'Must specify userId, roleId, or departmentId' });
        }

        if (!req.employee?.id) {
            return res.status(400).json({ error: 'Employee profile required to share projects' });
        }

        // Build the share data
        const shareData = {
            projectId: parseInt(id),
            permission: permission,
            sharedBy: req.employee.id
        };

        if (userId) shareData.sharedWithUserId = userId;
        if (roleId) shareData.sharedWithRoleId = roleId;
        if (departmentId) shareData.sharedWithDeptId = departmentId;

        const share = await prisma.projectShare.create({
            data: shareData,
            include: {
                sharedWithUser: { select: { id: true, name: true, email: true } },
                sharedWithRole: { select: { id: true, name: true } },
                sharedWithDept: { select: { id: true, name: true } },
                sharedByUser: { select: { id: true, name: true } }
            }
        });

        // Log project activity
        await logProjectActivity(parseInt(id), req.employee.id, 'shared', {
            userId,
            roleId,
            departmentId,
            permission
        });

        // Log activity
        await logCreate(
            req.user.userId,
            'project_share',
            share.id,
            `Shared project with ${userId ? 'user' : roleId ? 'role' : 'department'}`,
            req,
            { projectId: id, userId, roleId, departmentId, permission }
        );

        cache.delByPrefix('projects:');
        res.status(201).json(share);
    } catch (error) {
        console.error('Share project error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Project already shared with this target' });
        }
        res.status(500).json({ error: 'Failed to share project' });
    }
};

const removeProjectShare = async (req, res) => {
    try {
        const { id, shareId } = req.params;

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const share = await prisma.projectShare.findUnique({
            where: { id: parseInt(shareId) },
            include: {
                sharedWithUser: { select: { name: true } },
                sharedWithRole: { select: { name: true } },
                sharedWithDept: { select: { name: true } }
            }
        });

        if (!share || share.projectId !== parseInt(id)) {
            return res.status(404).json({ error: 'Share not found' });
        }

        await prisma.projectShare.delete({
            where: { id: parseInt(shareId) }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(parseInt(id), req.employee.id, 'share_removed', {
                shareId,
                target: share.sharedWithUser?.name || share.sharedWithRole?.name || share.sharedWithDept?.name
            });
        }

        cache.delByPrefix('projects:');
        res.json({ message: 'Share removed successfully' });
    } catch (error) {
        console.error('Remove project share error:', error);
        res.status(500).json({ error: 'Failed to remove share' });
    }
};

const getProjectShares = async (req, res) => {
    try {
        const { id } = req.params;

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'VIEWER'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const shares = await prisma.projectShare.findMany({
            where: { projectId: parseInt(id) },
            include: {
                sharedWithUser: { select: { id: true, name: true, email: true } },
                sharedWithRole: { select: { id: true, name: true } },
                sharedWithDept: { select: { id: true, name: true } },
                sharedByUser: { select: { id: true, name: true } }
            },
            orderBy: { sharedAt: 'desc' }
        });

        res.json(shares);
    } catch (error) {
        console.error('Get project shares error:', error);
        res.status(500).json({ error: 'Failed to fetch shares' });
    }
};

// ==========================================
// PROJECT MEMBER MANAGEMENT (Legacy - User-based)
// ==========================================

const getProjectMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'VIEWER'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
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

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
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

        // Get project name for notification
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true }
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

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(projectId, req.employee.id, 'member_added', {
                userId,
                role,
                email: user.email
            });
        }

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

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
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

        const { hasAccess, project } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'ADMIN'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const member = await prisma.projectMember.findUnique({
            where: { id: parseInt(memberId) },
            include: { user: { select: { email: true } } }
        });

        if (!member || member.project_id !== projectId) {
            return res.status(404).json({ error: 'Member not found' });
        }

        await prisma.projectMember.delete({
            where: { id: parseInt(memberId) }
        });

        // Log project activity
        if (req.employee?.id) {
            await logProjectActivity(projectId, req.employee.id, 'member_removed', {
                memberId,
                email: member.user?.email
            });
        }

        // Log activity
        await logDelete(
            req.user.userId,
            'project_member',
            memberId,
            `Removed ${member?.user?.email || 'user'} from project`,
            req,
            { projectId, memberId }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Remove project member error:', error);
        res.status(500).json({ error: 'Failed to remove project member' });
    }
};

// ==========================================
// PROJECT ACTIVITIES
// ==========================================

const getProjectActivities = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const { hasAccess } = await checkProjectPermission(
            req.user.userId,
            req.employee?.id,
            id,
            'VIEWER'
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const activities = await prisma.projectActivity.findMany({
            where: { projectId: parseInt(id) },
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        res.json(activities);
    } catch (error) {
        console.error('Get project activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectDetails,
    updateProject,
    archiveProject,
    deleteProject,
    approveProject,
    rejectProject,
    shareProject,
    removeProjectShare,
    getProjectShares,
    getProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    getProjectActivities
};
