const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all lists in a space (including those in folders)
const getLists = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { folderId } = req.query;
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

        const where = {
            spaceId: parseInt(spaceId),
            isArchived: false
        };

        if (folderId !== undefined) {
            where.folderId = folderId ? parseInt(folderId) : null;
        }

        const lists = await prisma.list.findMany({
            where,
            include: {
                folder: { select: { id: true, name: true } },
                statuses: { orderBy: { sortOrder: 'asc' } },
                _count: { select: { tasks: true } }
            },
            orderBy: { sortOrder: 'asc' }
        });

        res.json(lists);
    } catch (error) {
        console.error('Error fetching lists:', error);
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
};

// Get list by ID with tasks
const getListById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        const list = await prisma.list.findFirst({
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
                folder: { select: { id: true, name: true } },
                statuses: { orderBy: { sortOrder: 'asc' } },
                tasks: {
                    where: { isArchived: false, parentTaskId: null },
                    include: {
                        status: true,
                        assignees: {
                            include: {
                                employee: { select: { id: true, name: true, photo: true } }
                            }
                        },
                        tags: {
                            include: {
                                tag: true
                            }
                        },
                        _count: { select: { subtasks: true, comments: true } }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.json(list);
    } catch (error) {
        console.error('Error fetching list:', error);
        res.status(500).json({ error: 'Failed to fetch list' });
    }
};

// Create list
const createList = async (req, res) => {
    try {
        const { spaceId, folderId, name, description, icon, color, defaultView } = req.body;
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
            return res.status(403).json({ error: 'Not authorized to create lists in this space' });
        }

        // Get max sort order
        const maxOrder = await prisma.list.aggregate({
            where: { spaceId: parseInt(spaceId), folderId: folderId ? parseInt(folderId) : null },
            _max: { sortOrder: true }
        });

        const list = await prisma.list.create({
            data: {
                spaceId: parseInt(spaceId),
                folderId: folderId ? parseInt(folderId) : null,
                name,
                description,
                icon,
                color,
                defaultView,
                sortOrder: (maxOrder._max.sortOrder || 0) + 1,
                // Create default statuses
                statuses: {
                    create: [
                        { name: 'To Do', color: '#6B7280', sortOrder: 0, isDefault: true },
                        { name: 'In Progress', color: '#3B82F6', sortOrder: 1 },
                        { name: 'Done', color: '#10B981', sortOrder: 2, isClosed: true }
                    ]
                }
            },
            include: {
                folder: { select: { id: true, name: true } },
                statuses: { orderBy: { sortOrder: 'asc' } },
                _count: { select: { tasks: true } }
            }
        });

        res.status(201).json(list);
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ error: 'Failed to create list' });
    }
};

// Update list
const updateList = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, defaultView, folderId, sortOrder, isArchived } = req.body;
        const employeeId = req.user.employeeId;

        // Verify access
        const existing = await prisma.list.findFirst({
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
            return res.status(403).json({ error: 'Not authorized to update this list' });
        }

        const list = await prisma.list.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                icon,
                color,
                defaultView,
                folderId: folderId !== undefined ? (folderId ? parseInt(folderId) : null) : undefined,
                sortOrder,
                isArchived
            },
            include: {
                folder: { select: { id: true, name: true } },
                statuses: { orderBy: { sortOrder: 'asc' } },
                _count: { select: { tasks: true } }
            }
        });

        res.json(list);
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ error: 'Failed to update list' });
    }
};

// Delete list
const deleteList = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employeeId;

        // Verify access
        const existing = await prisma.list.findFirst({
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
            return res.status(403).json({ error: 'Not authorized to delete this list' });
        }

        await prisma.list.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({ error: 'Failed to delete list' });
    }
};

// Add/update status in list
const updateListStatus = async (req, res) => {
    try {
        const { id, statusId } = req.params;
        const { name, color, sortOrder, isDefault, isClosed } = req.body;
        const employeeId = req.user.employeeId;

        // Verify access
        const list = await prisma.list.findFirst({
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

        if (!list) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        let status;
        if (statusId) {
            status = await prisma.listStatus.update({
                where: { id: parseInt(statusId) },
                data: { name, color, sortOrder, isDefault, isClosed }
            });
        } else {
            const maxOrder = await prisma.listStatus.aggregate({
                where: { listId: parseInt(id) },
                _max: { sortOrder: true }
            });

            status = await prisma.listStatus.create({
                data: {
                    listId: parseInt(id),
                    name,
                    color,
                    sortOrder: sortOrder || (maxOrder._max.sortOrder || 0) + 1,
                    isDefault: isDefault || false,
                    isClosed: isClosed || false
                }
            });
        }

        res.json(status);
    } catch (error) {
        console.error('Error updating list status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// Delete status from list
const deleteListStatus = async (req, res) => {
    try {
        const { id, statusId } = req.params;
        const { moveTasksTo } = req.query;
        const employeeId = req.user.employeeId;

        // Verify access
        const list = await prisma.list.findFirst({
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

        if (!list) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Move tasks if specified
        if (moveTasksTo) {
            await prisma.listTask.updateMany({
                where: { statusId: parseInt(statusId) },
                data: { statusId: parseInt(moveTasksTo) }
            });
        }

        await prisma.listStatus.delete({
            where: { id: parseInt(statusId) }
        });

        res.json({ message: 'Status deleted successfully' });
    } catch (error) {
        console.error('Error deleting list status:', error);
        res.status(500).json({ error: 'Failed to delete status' });
    }
};

// Reorder lists
const reorderLists = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const { listIds } = req.body;
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
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Promise.all(
            listIds.map((listId, index) =>
                prisma.list.update({
                    where: { id: listId },
                    data: { sortOrder: index }
                })
            )
        );

        res.json({ message: 'Lists reordered successfully' });
    } catch (error) {
        console.error('Error reordering lists:', error);
        res.status(500).json({ error: 'Failed to reorder lists' });
    }
};

module.exports = {
    getLists,
    getListById,
    createList,
    updateList,
    deleteList,
    updateListStatus,
    deleteListStatus,
    reorderLists
};
