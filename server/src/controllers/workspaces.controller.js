const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all workspaces for current user
const getWorkspaces = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;

        const workspaces = await prisma.workspace.findMany({
            where: {
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId } } }
                ]
            },
            include: {
                owner: { select: { id: true, name: true, photo: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                _count: { select: { spaces: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(workspaces);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
};

// Get workspace by ID with spaces
const getWorkspaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId } } }
                ]
            },
            include: {
                owner: { select: { id: true, name: true, photo: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                spaces: {
                    include: {
                        folders: {
                            include: {
                                lists: { select: { id: true, name: true, icon: true, color: true } }
                            },
                            orderBy: { sortOrder: 'asc' }
                        },
                        lists: {
                            where: { folderId: null },
                            select: { id: true, name: true, icon: true, color: true },
                            orderBy: { sortOrder: 'asc' }
                        },
                        _count: { select: { folders: true, lists: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        res.json(workspace);
    } catch (error) {
        console.error('Error fetching workspace:', error);
        res.status(500).json({ error: 'Failed to fetch workspace' });
    }
};

// Create workspace
const createWorkspace = async (req, res) => {
    try {
        const { name, description, icon, color } = req.body;
        const employeeId = req.user.employeeId;

        const workspace = await prisma.workspace.create({
            data: {
                name,
                description,
                icon,
                color,
                ownerId: employeeId,
                members: {
                    create: {
                        employeeId,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                owner: { select: { id: true, name: true, photo: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                }
            }
        });

        res.status(201).json(workspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
};

// Update workspace
const updateWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color } = req.body;
        const employeeId = req.user.employeeId;

        // Check ownership/admin
        const existing = await prisma.workspace.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId, role: 'ADMIN' } } }
                ]
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to update this workspace' });
        }

        const workspace = await prisma.workspace.update({
            where: { id: parseInt(id) },
            data: { name, description, icon, color },
            include: {
                owner: { select: { id: true, name: true, photo: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                }
            }
        });

        res.json(workspace);
    } catch (error) {
        console.error('Error updating workspace:', error);
        res.status(500).json({ error: 'Failed to update workspace' });
    }
};

// Delete workspace
const deleteWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        // Only owner can delete
        const existing = await prisma.workspace.findFirst({
            where: { id: parseInt(id), ownerId: employeeId }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Only the owner can delete this workspace' });
        }

        await prisma.workspace.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        res.status(500).json({ error: 'Failed to delete workspace' });
    }
};

// Add member to workspace
const addWorkspaceMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId: newMemberId, role = 'MEMBER' } = req.body;
        const employeeId = req.user.employeeId;

        // Check admin/owner permission
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } }
                ]
            }
        });

        if (!workspace) {
            return res.status(403).json({ error: 'Not authorized to add members' });
        }

        const member = await prisma.workspaceMember.create({
            data: {
                workspaceId: parseInt(id),
                employeeId: newMemberId,
                role
            },
            include: {
                employee: { select: { id: true, name: true, photo: true } }
            }
        });

        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Member already exists in workspace' });
        }
        console.error('Error adding workspace member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
};

// Update member role
const updateWorkspaceMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        const employeeId = req.user.employeeId;

        // Check admin/owner permission
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } }
                ]
            }
        });

        if (!workspace) {
            return res.status(403).json({ error: 'Not authorized to update members' });
        }

        const member = await prisma.workspaceMember.update({
            where: { id: parseInt(memberId) },
            data: { role },
            include: {
                employee: { select: { id: true, name: true, photo: true } }
            }
        });

        res.json(member);
    } catch (error) {
        console.error('Error updating workspace member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
};

// Remove member from workspace
const removeWorkspaceMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const employeeId = req.user.employeeId;

        // Check admin/owner permission
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } }
                ]
            }
        });

        if (!workspace) {
            return res.status(403).json({ error: 'Not authorized to remove members' });
        }

        await prisma.workspaceMember.delete({
            where: { id: parseInt(memberId) }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing workspace member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

module.exports = {
    getWorkspaces,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addWorkspaceMember,
    updateWorkspaceMember,
    removeWorkspaceMember
};
