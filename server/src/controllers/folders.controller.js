const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all folders in a space
const getFolders = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const employeeId = req.user.employeeId;

        // Verify space access
        const space = await prisma.space.findFirst({
            where: {
                id: parseInt(spaceId),
                OR: [
                    { isPrivate: false },
                    { members: { some: { employeeId } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId } } } }
                ]
            }
        });

        if (!space) {
            return res.status(403).json({ error: 'Not authorized to access this space' });
        }

        const folders = await prisma.folder.findMany({
            where: { spaceId: parseInt(spaceId) },
            include: {
                lists: {
                    include: {
                        _count: { select: { tasks: true } }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });

        res.json(folders);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
};

// Get folder by ID
const getFolderById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        const folder = await prisma.folder.findFirst({
            where: {
                id: parseInt(id),
                space: {
                    OR: [
                        { isPrivate: false },
                        { members: { some: { employeeId } } },
                        { workspace: { ownerId: employeeId } },
                        { workspace: { members: { some: { employeeId } } } }
                    ]
                }
            },
            include: {
                space: { select: { id: true, name: true, workspaceId: true } },
                lists: {
                    include: {
                        _count: { select: { tasks: true } }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json(folder);
    } catch (error) {
        console.error('Error fetching folder:', error);
        res.status(500).json({ error: 'Failed to fetch folder' });
    }
};

// Create folder
const createFolder = async (req, res) => {
    try {
        const { spaceId, name, icon, color } = req.body;
        const employeeId = req.user.employeeId;

        // Verify space access
        const space = await prisma.space.findFirst({
            where: {
                id: parseInt(spaceId),
                OR: [
                    { members: { some: { employeeId } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId } } } }
                ]
            }
        });

        if (!space) {
            return res.status(403).json({ error: 'Not authorized to create folders in this space' });
        }

        // Get max sort order
        const maxOrder = await prisma.folder.aggregate({
            where: { spaceId: parseInt(spaceId) },
            _max: { sortOrder: true }
        });

        const folder = await prisma.folder.create({
            data: {
                spaceId: parseInt(spaceId),
                name,
                icon,
                color,
                sortOrder: (maxOrder._max.sortOrder || 0) + 1
            },
            include: {
                lists: {
                    include: {
                        _count: { select: { tasks: true } }
                    }
                }
            }
        });

        res.status(201).json(folder);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
};

// Update folder
const updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, color, isExpanded, sortOrder } = req.body;
        const employeeId = req.user.employeeId;

        // Verify access
        const existing = await prisma.folder.findFirst({
            where: {
                id: parseInt(id),
                space: {
                    OR: [
                        { members: { some: { employeeId } } },
                        { workspace: { ownerId: employeeId } },
                        { workspace: { members: { some: { employeeId } } } }
                    ]
                }
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to update this folder' });
        }

        const folder = await prisma.folder.update({
            where: { id: parseInt(id) },
            data: { name, icon, color, isExpanded, sortOrder },
            include: {
                lists: {
                    include: {
                        _count: { select: { tasks: true } }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        res.json(folder);
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
};

// Delete folder
const deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        // Verify access
        const existing = await prisma.folder.findFirst({
            where: {
                id: parseInt(id),
                space: {
                    OR: [
                        { members: { some: { employeeId, role: 'ADMIN' } } },
                        { workspace: { ownerId: employeeId } },
                        { workspace: { members: { some: { employeeId, role: { in: ['OWNER', 'ADMIN'] } } } } }
                    ]
                }
            }
        });

        if (!existing) {
            return res.status(403).json({ error: 'Not authorized to delete this folder' });
        }

        await prisma.folder.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
};

// Reorder folders
const reorderFolders = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { folderIds } = req.body; // Array of folder IDs in new order
        const employeeId = req.user.employeeId;

        // Verify space access
        const space = await prisma.space.findFirst({
            where: {
                id: parseInt(spaceId),
                OR: [
                    { members: { some: { employeeId } } },
                    { workspace: { ownerId: employeeId } },
                    { workspace: { members: { some: { employeeId } } } }
                ]
            }
        });

        if (!space) {
            return res.status(403).json({ error: 'Not authorized to reorder folders' });
        }

        // Update sort orders
        await Promise.all(
            folderIds.map((folderId, index) =>
                prisma.folder.update({
                    where: { id: folderId },
                    data: { sortOrder: index }
                })
            )
        );

        res.json({ message: 'Folders reordered successfully' });
    } catch (error) {
        console.error('Error reordering folders:', error);
        res.status(500).json({ error: 'Failed to reorder folders' });
    }
};

module.exports = {
    getFolders,
    getFolderById,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders
};
