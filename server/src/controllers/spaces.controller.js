const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all spaces in a workspace
const getSpaces = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const employeeId = req.user.employeeId;

        // Verify workspace access
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parseInt(workspaceId),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId } } }
                ]
            }
        });

        if (!workspace) {
            return res.status(403).json({ error: 'Not authorized to access this workspace' });
        }

        const spaces = await prisma.space.findMany({
            where: {
                workspaceId: parseInt(workspaceId),
                OR: [
                    { isPrivate: false },
                    { members: { some: { employeeId } } }
                ]
            },
            include: {
                department: { select: { id: true, name: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                _count: { select: { folders: true, lists: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(spaces);
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ error: 'Failed to fetch spaces' });
    }
};

// Get space by ID with folders and lists
const getSpaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        const space = await prisma.space.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { isPrivate: false },
                    { members: { some: { employeeId } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } } }
                ]
            },
            include: {
                workspace: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                folders: {
                    include: {
                        lists: {
                            include: {
                                _count: { select: { tasks: true } }
                            },
                            orderBy: { sortOrder: 'asc' }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                },
                lists: {
                    where: { folderId: null },
                    include: {
                        _count: { select: { tasks: true } }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        if (!space) {
            return res.status(404).json({ error: 'Space not found' });
        }

        res.json(space);
    } catch (error) {
        console.error('Error fetching space:', error);
        res.status(500).json({ error: 'Failed to fetch space' });
    }
};

// Create space
const createSpace = async (req, res) => {
    try {
        const { workspaceId, name, description, icon, color, departmentId, isPrivate } = req.body;
        const employeeId = req.user.employeeId;

        // Verify workspace access
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parseInt(workspaceId),
                OR: [
                    { ownerId: employeeId },
                    { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } }
                ]
            }
        });

        if (!workspace) {
            return res.status(403).json({ error: 'Not authorized to create spaces in this workspace' });
        }

        const space = await prisma.space.create({
            data: {
                workspaceId: parseInt(workspaceId),
                name,
                description,
                icon,
                color,
                departmentId,
                isPrivate: isPrivate || false,
                members: {
                    create: {
                        employeeId,
                        role: 'ADMIN'
                    }
                }
            },
            include: {
                department: { select: { id: true, name: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                _count: { select: { folders: true, lists: true } }
            }
        });

        res.status(201).json(space);
    } catch (error) {
        console.error('Error creating space:', error);
        res.status(500).json({ error: 'Failed to create space' });
    }
};

// Update space
const updateSpace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, departmentId, isPrivate } = req.body;
        const employeeId = req.user.employeeId;

        // Check admin permission
        const existing = await prisma.space.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { members: { some: { employeeId, role: 'ADMIN' } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } } }
                ]
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to update this space' });
        }

        const space = await prisma.space.update({
            where: { id: parseInt(id) },
            data: { name, description, icon, color, departmentId, isPrivate },
            include: {
                department: { select: { id: true, name: true } },
                members: {
                    include: {
                        employee: { select: { id: true, name: true, photo: true } }
                    }
                },
                _count: { select: { folders: true, lists: true } }
            }
        });

        res.json(space);
    } catch (error) {
        console.error('Error updating space:', error);
        res.status(500).json({ error: 'Failed to update space' });
    }
};

// Delete space
const deleteSpace = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        // Check admin permission
        const existing = await prisma.space.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { members: { some: { employeeId, role: 'ADMIN' } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } } }
                ]
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to delete this space' });
        }

        await prisma.space.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Space deleted successfully' });
    } catch (error) {
        console.error('Error deleting space:', error);
        res.status(500).json({ error: 'Failed to delete space' });
    }
};

// Add member to space
const addSpaceMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId: newMemberId, role = 'MEMBER' } = req.body;
        const employeeId = req.user.employeeId;

        // Check admin permission
        const space = await prisma.space.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { members: { some: { employeeId, role: 'ADMIN' } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } } }
                ]
            }
        });

        if (!space) {
            return res.status(403).json({ error: 'Not authorized to add members' });
        }

        const member = await prisma.spaceMember.create({
            data: {
                spaceId: parseInt(id),
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
            return res.status(400).json({ error: 'Member already exists in space' });
        }
        console.error('Error adding space member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
};

// Remove member from space
const removeSpaceMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const employeeId = req.user.employeeId;

        // Check admin permission
        const space = await prisma.space.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { members: { some: { employeeId, role: 'ADMIN' } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } } }
                ]
            }
        });

        if (!space) {
            return res.status(403).json({ error: 'Not authorized to remove members' });
        }

        await prisma.spaceMember.delete({
            where: { id: parseInt(memberId) }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing space member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

module.exports = {
    getSpaces,
    getSpaceById,
    createSpace,
    updateSpace,
    deleteSpace,
    addSpaceMember,
    removeSpaceMember
};
