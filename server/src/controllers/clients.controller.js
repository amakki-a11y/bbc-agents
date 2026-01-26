const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all clients with filters
exports.getClients = async (req, res) => {
    try {
        const userId = req.user.employeeId || req.user.id;
        const userRole = req.user.role?.name || req.user.role;
        const {
            status,
            stage,
            ownerId,
            search,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build where clause
        const where = {};

        // Filter by status
        if (status && status !== 'all') {
            where.status = status;
        }

        // Filter by stage
        if (stage && stage !== 'all') {
            where.stage = stage;
        }

        // Filter by owner
        if (ownerId) {
            where.ownerId = ownerId;
        }

        // Search
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { companyName: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Role-based filtering (non-admins see only their clients)
        if (userRole !== 'Admin' && userRole !== 'Manager' && userRole !== 'Administrator') {
            where.ownerId = userId;
        }

        // Get total count
        const total = await prisma.client.count({ where });

        // Get clients
        const clients = await prisma.client.findMany({
            where,
            include: {
                owner: {
                    select: { id: true, name: true, email: true, photo: true }
                },
                tags: {
                    include: { tag: true }
                },
                _count: {
                    select: { interactions: true, notes: true, tasks: true }
                }
            },
            orderBy: { [sortBy]: sortOrder },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            clients,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

// Get single client with full details
exports.getClient = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: {
                owner: {
                    select: { id: true, name: true, email: true, photo: true }
                },
                department: true,
                interactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        conductor: { select: { id: true, name: true } }
                    }
                },
                notes: {
                    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
                    include: {
                        author: { select: { id: true, name: true } }
                    }
                },
                documents: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        uploader: { select: { id: true, name: true } }
                    }
                },
                tags: {
                    include: { tag: true }
                },
                tasks: {
                    orderBy: { dueDate: 'asc' },
                    where: { status: 'pending' },
                    include: {
                        assignee: { select: { id: true, name: true } }
                    }
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        user: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};

// Create client
exports.createClient = async (req, res) => {
    try {
        const userId = req.user.employeeId || req.user.id;
        const {
            firstName,
            lastName,
            email,
            phone,
            alternatePhone,
            companyName,
            jobTitle,
            website,
            address,
            city,
            state,
            country,
            postalCode,
            status,
            stage,
            source,
            rating,
            ownerId,
            departmentId,
            accountNumber,
            accountType,
            tags
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const client = await prisma.client.create({
            data: {
                firstName,
                lastName,
                email: email || null,
                phone,
                alternatePhone,
                companyName,
                jobTitle,
                website,
                address,
                city,
                state,
                country,
                postalCode,
                status: status || 'LEAD',
                stage: stage || 'NEW',
                source,
                rating,
                ownerId: ownerId || userId,
                departmentId: departmentId || null,
                accountNumber,
                accountType
            },
            include: {
                owner: { select: { id: true, name: true } }
            }
        });

        // Add tags if provided
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                let tag = await prisma.cRMTag.findUnique({ where: { name: tagName } });
                if (!tag) {
                    tag = await prisma.cRMTag.create({ data: { name: tagName } });
                }
                await prisma.clientTag.create({
                    data: { clientId: client.id, tagId: tag.id }
                });
            }
        }

        // Log activity
        await prisma.clientActivity.create({
            data: {
                clientId: client.id,
                action: 'created',
                userId
            }
        });

        res.status(201).json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A client with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to create client' });
    }
};

// Update client
exports.updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.employeeId || req.user.id;
        const updates = req.body;

        // Get current client for activity logging
        const currentClient = await prisma.client.findUnique({
            where: { id: parseInt(id) }
        });

        if (!currentClient) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const client = await prisma.client.update({
            where: { id: parseInt(id) },
            data: updates,
            include: {
                owner: { select: { id: true, name: true } },
                tags: { include: { tag: true } }
            }
        });

        // Log activity for important field changes
        const trackedFields = ['status', 'stage', 'ownerId', 'rating'];
        for (const field of trackedFields) {
            if (updates[field] !== undefined && updates[field] !== currentClient[field]) {
                await prisma.clientActivity.create({
                    data: {
                        clientId: client.id,
                        action: `${field}_changed`,
                        field,
                        oldValue: String(currentClient[field] || ''),
                        newValue: String(updates[field] || ''),
                        userId
                    }
                });
            }
        }

        res.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
};

// Delete client
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.client.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};

// Move client status/stage
exports.moveClientStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, stage } = req.body;
        const userId = req.user.employeeId || req.user.id;

        const currentClient = await prisma.client.findUnique({
            where: { id: parseInt(id) }
        });

        if (!currentClient) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (stage) updateData.stage = stage;

        // If moving to WON stage, set convertedAt
        if (stage === 'WON' && currentClient.stage !== 'WON') {
            updateData.convertedAt = new Date();
            updateData.status = 'ACTIVE';
        }

        const client = await prisma.client.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                owner: { select: { id: true, name: true } }
            }
        });

        // Log activity
        if (status) {
            await prisma.clientActivity.create({
                data: {
                    clientId: client.id,
                    action: 'status_changed',
                    field: 'status',
                    oldValue: currentClient.status,
                    newValue: status,
                    userId
                }
            });
        }
        if (stage) {
            await prisma.clientActivity.create({
                data: {
                    clientId: client.id,
                    action: 'stage_changed',
                    field: 'stage',
                    oldValue: currentClient.stage,
                    newValue: stage,
                    userId
                }
            });
        }

        res.json(client);
    } catch (error) {
        console.error('Error moving client:', error);
        res.status(500).json({ error: 'Failed to move client' });
    }
};

// Get client statistics
exports.getClientStats = async (req, res) => {
    try {
        const userId = req.user.employeeId || req.user.id;
        const userRole = req.user.role?.name || req.user.role;

        // Build where clause based on role
        const where = {};
        if (userRole !== 'Admin' && userRole !== 'Manager' && userRole !== 'Administrator') {
            where.ownerId = userId;
        }

        // Count by status
        const statusCounts = await prisma.client.groupBy({
            by: ['status'],
            where,
            _count: { status: true }
        });

        // Count by stage
        const stageCounts = await prisma.client.groupBy({
            by: ['stage'],
            where,
            _count: { stage: true }
        });

        // Total clients
        const total = await prisma.client.count({ where });

        // New this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newThisMonth = await prisma.client.count({
            where: {
                ...where,
                createdAt: { gte: startOfMonth }
            }
        });

        // Converted this month
        const convertedThisMonth = await prisma.client.count({
            where: {
                ...where,
                convertedAt: { gte: startOfMonth }
            }
        });

        res.json({
            total,
            newThisMonth,
            convertedThisMonth,
            byStatus: statusCounts.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            byStage: stageCounts.reduce((acc, item) => {
                acc[item.stage] = item._count.stage;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error fetching client stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

// Add interaction
exports.addInteraction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.employeeId || req.user.id;
        const { type, subject, description, outcome, scheduledAt, duration } = req.body;

        const interaction = await prisma.clientInteraction.create({
            data: {
                clientId: parseInt(id),
                type,
                subject,
                description,
                outcome,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                completedAt: new Date(),
                duration,
                conductedBy: userId
            },
            include: {
                conductor: { select: { id: true, name: true } }
            }
        });

        // Update last contacted
        await prisma.client.update({
            where: { id: parseInt(id) },
            data: { lastContactedAt: new Date() }
        });

        // Log activity
        await prisma.clientActivity.create({
            data: {
                clientId: parseInt(id),
                action: 'interaction_added',
                newValue: type,
                userId
            }
        });

        res.status(201).json(interaction);
    } catch (error) {
        console.error('Error adding interaction:', error);
        res.status(500).json({ error: 'Failed to add interaction' });
    }
};

// Add note
exports.addNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.employeeId || req.user.id;
        const { content, isPinned } = req.body;

        const note = await prisma.clientNote.create({
            data: {
                clientId: parseInt(id),
                content,
                isPinned: isPinned || false,
                authorId: userId
            },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        // Log activity
        await prisma.clientActivity.create({
            data: {
                clientId: parseInt(id),
                action: 'note_added',
                userId
            }
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
};

// Delete note
exports.deleteNote = async (req, res) => {
    try {
        const { id, noteId } = req.params;

        await prisma.clientNote.delete({
            where: { id: parseInt(noteId) }
        });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
};

// Get all interactions for a client
exports.getInteractions = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const total = await prisma.clientInteraction.count({
            where: { clientId: parseInt(id) }
        });

        const interactions = await prisma.clientInteraction.findMany({
            where: { clientId: parseInt(id) },
            include: {
                conductor: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            interactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
    }
};

// Add task to client
exports.addTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.employeeId || req.user.id;
        const { title, description, dueDate, priority, assigneeId } = req.body;

        const task = await prisma.clientTask.create({
            data: {
                clientId: parseInt(id),
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority || 'MEDIUM',
                assigneeId: assigneeId || userId,
                createdBy: userId
            },
            include: {
                assignee: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } }
            }
        });

        // Log activity
        await prisma.clientActivity.create({
            data: {
                clientId: parseInt(id),
                action: 'task_added',
                newValue: title,
                userId
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ error: 'Failed to add task' });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const { id, taskId } = req.params;
        const updates = req.body;

        if (updates.status === 'completed') {
            updates.completedAt = new Date();
        }

        const task = await prisma.clientTask.update({
            where: { id: parseInt(taskId) },
            data: updates,
            include: {
                assignee: { select: { id: true, name: true } }
            }
        });

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Get client tasks
exports.getTasks = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        const where = { clientId: parseInt(id) };
        if (status && status !== 'all') {
            where.status = status;
        }

        const tasks = await prisma.clientTask.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } }
            },
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }]
        });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Bulk import clients
exports.importClients = async (req, res) => {
    try {
        const userId = req.user.employeeId || req.user.id;
        const { clients } = req.body;

        if (!Array.isArray(clients) || clients.length === 0) {
            return res.status(400).json({ error: 'No clients provided for import' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const clientData of clients) {
            try {
                await prisma.client.create({
                    data: {
                        firstName: clientData.firstName || clientData.first_name || 'Unknown',
                        lastName: clientData.lastName || clientData.last_name || 'Unknown',
                        email: clientData.email || null,
                        phone: clientData.phone,
                        companyName: clientData.companyName || clientData.company,
                        status: 'LEAD',
                        stage: 'NEW',
                        source: clientData.source || 'OTHER',
                        ownerId: userId
                    }
                });
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push({
                    data: clientData,
                    error: err.message
                });
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error importing clients:', error);
        res.status(500).json({ error: 'Failed to import clients' });
    }
};

// Export clients
exports.exportClients = async (req, res) => {
    try {
        const { status, format = 'json' } = req.query;

        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }

        const clients = await prisma.client.findMany({
            where,
            include: {
                owner: { select: { name: true, email: true } },
                tags: { include: { tag: true } }
            }
        });

        if (format === 'csv') {
            const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Status', 'Stage', 'Owner'];
            const rows = clients.map(c => [
                c.firstName,
                c.lastName,
                c.email || '',
                c.phone || '',
                c.companyName || '',
                c.status,
                c.stage,
                c.owner?.name || ''
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
            return res.send(csv);
        }

        res.json(clients);
    } catch (error) {
        console.error('Error exporting clients:', error);
        res.status(500).json({ error: 'Failed to export clients' });
    }
};

// Get CRM Tags
exports.getTags = async (req, res) => {
    try {
        const tags = await prisma.cRMTag.findMany({
            include: {
                _count: { select: { clients: true } }
            },
            orderBy: { name: 'asc' }
        });

        res.json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
};

// Add tag to client
exports.addTagToClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { tagName, tagId } = req.body;

        let tag;
        if (tagId) {
            tag = await prisma.cRMTag.findUnique({ where: { id: tagId } });
        } else if (tagName) {
            tag = await prisma.cRMTag.findUnique({ where: { name: tagName } });
            if (!tag) {
                tag = await prisma.cRMTag.create({ data: { name: tagName } });
            }
        }

        if (!tag) {
            return res.status(400).json({ error: 'Tag name or ID required' });
        }

        const clientTag = await prisma.clientTag.create({
            data: {
                clientId: parseInt(id),
                tagId: tag.id
            },
            include: { tag: true }
        });

        res.status(201).json(clientTag);
    } catch (error) {
        console.error('Error adding tag:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Tag already added to this client' });
        }
        res.status(500).json({ error: 'Failed to add tag' });
    }
};

// Remove tag from client
exports.removeTagFromClient = async (req, res) => {
    try {
        const { id, tagId } = req.params;

        await prisma.clientTag.deleteMany({
            where: {
                clientId: parseInt(id),
                tagId: parseInt(tagId)
            }
        });

        res.json({ message: 'Tag removed successfully' });
    } catch (error) {
        console.error('Error removing tag:', error);
        res.status(500).json({ error: 'Failed to remove tag' });
    }
};
