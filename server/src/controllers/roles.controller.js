const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

// Get all roles
const getRoles = async (req, res) => {
    try {
        const cacheKey = 'roles:all';
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            res.set('X-Cache', 'HIT');
            return res.json(cachedData);
        }

        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        // Parse permissions JSON for each role
        const rolesWithParsedPermissions = roles.map(role => ({
            ...role,
            permissions: JSON.parse(role.permissions || '{}')
        }));

        cache.set(cacheKey, rolesWithParsedPermissions, 60);
        res.json(rolesWithParsedPermissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

// Get single role by ID
const getRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                employees: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: { select: { name: true } }
                    }
                }
            }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json({
            ...role,
            permissions: JSON.parse(role.permissions || '{}')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

// Create role
const createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        const role = await prisma.role.create({
            data: {
                name,
                permissions: typeof permissions === 'object'
                    ? JSON.stringify(permissions)
                    : permissions || '{}'
            }
        });

        cache.delByPrefix('roles');
        res.status(201).json({
            ...role,
            permissions: JSON.parse(role.permissions)
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

// Update role
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (permissions !== undefined) {
            updateData.permissions = typeof permissions === 'object'
                ? JSON.stringify(permissions)
                : permissions;
        }

        const role = await prisma.role.update({
            where: { id },
            data: updateData
        });

        cache.delByPrefix('roles');
        res.json({
            ...role,
            permissions: JSON.parse(role.permissions)
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Role not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};

// Delete role
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if role has employees
        const employeeCount = await prisma.employee.count({
            where: { role_id: id }
        });

        if (employeeCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete role with assigned employees. Reassign employees first.'
            });
        }

        await prisma.role.delete({ where: { id } });

        cache.delByPrefix('roles');
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Role not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};

// Update role permissions
const updatePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!permissions) {
            return res.status(400).json({ error: 'Permissions object is required' });
        }

        const role = await prisma.role.update({
            where: { id },
            data: {
                permissions: typeof permissions === 'object'
                    ? JSON.stringify(permissions)
                    : permissions
            }
        });

        cache.delByPrefix('roles');
        res.json({
            ...role,
            permissions: JSON.parse(role.permissions)
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Role not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update permissions' });
    }
};

// Get permissions for current user
const getMyPermissions = async (req, res) => {
    try {
        const userId = req.user.userId;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId },
            include: {
                role: true
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        res.json({
            role: employee.role.name,
            permissions: JSON.parse(employee.role.permissions || '{}')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};

module.exports = {
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    updatePermissions,
    getMyPermissions
};
