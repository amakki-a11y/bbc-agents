const prisma = require('../lib/prisma');
const cache = require('../utils/cache');
const { logCreate, logUpdate, logDelete } = require('../services/activityLogger');
const {
    PERMISSION_CATEGORIES,
    PERMISSION_DEPENDENCIES,
    ROLE_TEMPLATES,
    getAllPermissions,
    getPermissionsByCategory,
    getAllPermissionKeys,
    validatePermissionDependencies,
    resolvePermissions,
    expandWildcard,
    hasPermission
} = require('../config/permissions');

// ===== Permission Endpoints =====

/**
 * GET /api/permissions
 * Return all available permissions grouped by category
 */
const getPermissions = async (req, res) => {
    try {
        const cacheKey = 'permissions:all';
        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.json(cached);
        }

        const response = {
            categories: PERMISSION_CATEGORIES,
            allPermissions: getAllPermissions(),
            dependencies: PERMISSION_DEPENDENCIES,
            totalCount: getAllPermissionKeys().length
        };

        cache.set(cacheKey, response, 3600); // Cache for 1 hour
        res.json(response);
    } catch (error) {
        console.error('getPermissions error:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};

/**
 * GET /api/roles/templates
 * Get available role templates
 */
const getRoleTemplates = async (req, res) => {
    try {
        const templates = ROLE_TEMPLATES.map(t => ({
            ...t,
            permissionCount: t.permissions.includes('*')
                ? getAllPermissionKeys().length
                : t.permissions.length
        }));
        res.json(templates);
    } catch (error) {
        console.error('getRoleTemplates error:', error);
        res.status(500).json({ error: 'Failed to fetch role templates' });
    }
};

// ===== Role CRUD Endpoints =====

/**
 * GET /api/roles
 * List all roles with permission counts and employee counts
 */
const getRoles = async (req, res) => {
    try {
        const cacheKey = 'roles:all';
        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.json(cached);
        }

        const roles = await prisma.role.findMany({
            orderBy: [
                { isSystemRole: 'desc' },
                { isDefault: 'desc' },
                { name: 'asc' }
            ],
            include: {
                rolePermissions: {
                    where: { granted: true },
                    select: { permissionKey: true }
                },
                _count: {
                    select: { employees: true }
                }
            }
        });

        // Transform to include permission keys array and count
        const rolesWithData = roles.map(role => {
            const permissionKeys = role.rolePermissions.map(rp => rp.permissionKey);
            // Check for wildcard (all permissions)
            const hasAllPermissions = permissionKeys.includes('*');

            return {
                id: role.id,
                name: role.name,
                description: role.description,
                color: role.color,
                icon: role.icon,
                isSystemRole: role.isSystemRole,
                isDefault: role.isDefault,
                created_at: role.created_at,
                updated_at: role.updated_at,
                permissionKeys: hasAllPermissions ? getAllPermissionKeys() : permissionKeys,
                permissionCount: hasAllPermissions ? getAllPermissionKeys().length : permissionKeys.length,
                employeeCount: role._count.employees,
                // Legacy support - convert to object format
                permissions: permissionKeys.reduce((acc, key) => {
                    acc[key] = true;
                    return acc;
                }, {})
            };
        });

        cache.set(cacheKey, rolesWithData, 60);
        res.json(rolesWithData);
    } catch (error) {
        console.error('getRoles error:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

/**
 * GET /api/roles/:id
 * Get role details with full permissions and assigned employees
 */
const getRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: {
                    where: { granted: true },
                    select: { permissionKey: true }
                },
                employees: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        photo: true,
                        jobTitle: true,
                        created_at: true,
                        department: { select: { id: true, name: true } }
                    },
                    orderBy: { name: 'asc' }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { employees: true }
                }
            }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const permissionKeys = role.rolePermissions.map(rp => rp.permissionKey);
        const hasAllPermissions = permissionKeys.includes('*');

        const response = {
            id: role.id,
            name: role.name,
            description: role.description,
            color: role.color,
            icon: role.icon,
            isSystemRole: role.isSystemRole,
            isDefault: role.isDefault,
            created_at: role.created_at,
            updated_at: role.updated_at,
            createdBy: role.createdBy,
            permissionKeys: hasAllPermissions ? getAllPermissionKeys() : permissionKeys,
            permissionCount: hasAllPermissions ? getAllPermissionKeys().length : permissionKeys.length,
            employees: role.employees,
            employeeCount: role._count.employees,
            // Legacy support
            permissions: (hasAllPermissions ? getAllPermissionKeys() : permissionKeys).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {})
        };

        res.json(response);
    } catch (error) {
        console.error('getRole error:', error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

/**
 * POST /api/roles
 * Create new role with permissions
 */
const createRole = async (req, res) => {
    try {
        const { name, description, color, icon, isDefault, permissions, permissionKeys } = req.body;
        const userId = req.user?.userId;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        // Get employee ID for creator
        let createdById = null;
        if (userId) {
            const employee = await prisma.employee.findUnique({
                where: { user_id: userId },
                select: { id: true }
            });
            createdById = employee?.id;
        }

        // Handle both permissionKeys array and legacy permissions object
        let keys = [];
        if (permissionKeys && Array.isArray(permissionKeys)) {
            keys = permissionKeys;
        } else if (permissions && typeof permissions === 'object') {
            keys = Object.entries(permissions)
                .filter(([_, value]) => value === true)
                .map(([key]) => key);
        }

        // Validate dependencies
        if (keys.length > 0 && !keys.includes('*')) {
            const validation = validatePermissionDependencies(keys);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Permission dependencies not satisfied',
                    details: validation.missing
                });
            }
        }

        // Create role with permissions in transaction
        const role = await prisma.$transaction(async (tx) => {
            // Create role
            const newRole = await tx.role.create({
                data: {
                    name: name.trim(),
                    description: description || null,
                    color: color || '#6366f1',
                    icon: icon || null,
                    isDefault: isDefault || false,
                    created_by_id: createdById,
                    // Legacy field
                    permissions: JSON.stringify(keys.reduce((acc, k) => {
                        acc[k] = true;
                        return acc;
                    }, {}))
                }
            });

            // Create RolePermission entries
            if (keys.length > 0) {
                await tx.rolePermission.createMany({
                    data: keys.map(key => ({
                        role_id: newRole.id,
                        permissionKey: key,
                        granted: true
                    }))
                });
            }

            // Log activity
            await tx.roleActivityLog.create({
                data: {
                    role_id: newRole.id,
                    action: 'created',
                    details: { name: newRole.name, permissions: keys },
                    performed_by_id: createdById
                }
            });

            return newRole;
        });

        // Log to activity log service
        await logCreate(
            userId,
            'role',
            role.id,
            `Created role: ${name}`,
            req,
            { name, permissionCount: keys.length }
        );

        cache.delByPrefix('roles');

        // Fetch complete role data
        const createdRole = await prisma.role.findUnique({
            where: { id: role.id },
            include: {
                rolePermissions: { where: { granted: true } },
                _count: { select: { employees: true } }
            }
        });

        res.status(201).json({
            ...createdRole,
            permissionKeys: keys,
            permissionCount: keys.length,
            employeeCount: 0,
            permissions: keys.reduce((acc, k) => {
                acc[k] = true;
                return acc;
            }, {})
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        console.error('createRole error:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

/**
 * PUT /api/roles/:id
 * Update role and permissions
 */
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon, isDefault, permissions, permissionKeys } = req.body;
        const userId = req.user?.userId;

        // Get existing role
        const existingRole = await prisma.role.findUnique({
            where: { id },
            include: { rolePermissions: true }
        });

        if (!existingRole) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Get employee ID
        let performedById = null;
        if (userId) {
            const employee = await prisma.employee.findUnique({
                where: { user_id: userId },
                select: { id: true }
            });
            performedById = employee?.id;
        }

        // Build update data
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (icon !== undefined) updateData.icon = icon;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        // Handle permissions
        let keys = null;
        if (permissionKeys && Array.isArray(permissionKeys)) {
            keys = permissionKeys;
        } else if (permissions !== undefined && typeof permissions === 'object') {
            keys = Object.entries(permissions)
                .filter(([_, value]) => value === true)
                .map(([key]) => key);
        }

        // Validate dependencies
        if (keys !== null && keys.length > 0 && !keys.includes('*')) {
            const validation = validatePermissionDependencies(keys);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Permission dependencies not satisfied',
                    details: validation.missing
                });
            }
        }

        // Update legacy permissions field
        if (keys !== null) {
            updateData.permissions = JSON.stringify(keys.reduce((acc, k) => {
                acc[k] = true;
                return acc;
            }, {}));
        }

        // Update role in transaction
        const role = await prisma.$transaction(async (tx) => {
            // Update role
            const updatedRole = await tx.role.update({
                where: { id },
                data: updateData
            });

            // Update permissions if provided
            if (keys !== null) {
                // Delete existing permissions
                await tx.rolePermission.deleteMany({
                    where: { role_id: id }
                });

                // Create new permissions
                if (keys.length > 0) {
                    await tx.rolePermission.createMany({
                        data: keys.map(key => ({
                            role_id: id,
                            permissionKey: key,
                            granted: true
                        }))
                    });
                }

                // Log permissions change
                await tx.roleActivityLog.create({
                    data: {
                        role_id: id,
                        action: 'permissions_changed',
                        details: {
                            previousCount: existingRole.rolePermissions.length,
                            newCount: keys.length,
                            permissions: keys
                        },
                        performed_by_id: performedById
                    }
                });
            }

            // Log role update
            if (Object.keys(updateData).length > 0) {
                await tx.roleActivityLog.create({
                    data: {
                        role_id: id,
                        action: 'updated',
                        details: { changes: Object.keys(updateData) },
                        performed_by_id: performedById
                    }
                });
            }

            return updatedRole;
        });

        // Log to activity log service
        await logUpdate(
            userId,
            'role',
            role.id,
            `Updated role: ${role.name}`,
            req,
            { name, permissionsUpdated: keys !== null }
        );

        cache.delByPrefix('roles');

        // Fetch complete updated role
        const updatedRole = await prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: { where: { granted: true } },
                _count: { select: { employees: true } }
            }
        });

        const finalKeys = updatedRole.rolePermissions.map(rp => rp.permissionKey);

        res.json({
            ...updatedRole,
            permissionKeys: finalKeys,
            permissionCount: finalKeys.length,
            employeeCount: updatedRole._count.employees,
            permissions: finalKeys.reduce((acc, k) => {
                acc[k] = true;
                return acc;
            }, {})
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Role not found' });
        }
        console.error('updateRole error:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};

/**
 * DELETE /api/roles/:id
 * Delete role (prevent if isSystemRole)
 */
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const role = await prisma.role.findUnique({
            where: { id },
            include: { _count: { select: { employees: true } } }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        if (role.isSystemRole) {
            return res.status(400).json({ error: 'Cannot delete system role' });
        }

        if (role._count.employees > 0) {
            return res.status(400).json({
                error: 'Cannot delete role with assigned employees. Reassign employees first.',
                employeeCount: role._count.employees
            });
        }

        await prisma.role.delete({ where: { id } });

        // Log deletion
        await logDelete(
            userId,
            'role',
            id,
            `Deleted role: ${role.name}`,
            req
        );

        cache.delByPrefix('roles');
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Role not found' });
        }
        console.error('deleteRole error:', error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};

/**
 * POST /api/roles/:id/duplicate
 * Duplicate a role
 */
const duplicateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user?.userId;

        const sourceRole = await prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: { where: { granted: true } }
            }
        });

        if (!sourceRole) {
            return res.status(404).json({ error: 'Source role not found' });
        }

        // Get employee ID
        let createdById = null;
        if (userId) {
            const employee = await prisma.employee.findUnique({
                where: { user_id: userId },
                select: { id: true }
            });
            createdById = employee?.id;
        }

        const newName = name || `${sourceRole.name} (Copy)`;
        const permissionKeys = sourceRole.rolePermissions.map(rp => rp.permissionKey);

        // Create duplicate
        const newRole = await prisma.$transaction(async (tx) => {
            const role = await tx.role.create({
                data: {
                    name: newName,
                    description: sourceRole.description,
                    color: sourceRole.color,
                    icon: sourceRole.icon,
                    isDefault: false, // Don't copy default status
                    isSystemRole: false, // Don't copy system role status
                    created_by_id: createdById,
                    permissions: sourceRole.permissions
                }
            });

            // Copy permissions
            if (permissionKeys.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissionKeys.map(key => ({
                        role_id: role.id,
                        permissionKey: key,
                        granted: true
                    }))
                });
            }

            // Log activity
            await tx.roleActivityLog.create({
                data: {
                    role_id: role.id,
                    action: 'created',
                    details: { duplicatedFrom: sourceRole.id, sourceName: sourceRole.name },
                    performed_by_id: createdById
                }
            });

            return role;
        });

        cache.delByPrefix('roles');

        // Fetch complete role
        const createdRole = await prisma.role.findUnique({
            where: { id: newRole.id },
            include: {
                rolePermissions: { where: { granted: true } },
                _count: { select: { employees: true } }
            }
        });

        res.status(201).json({
            ...createdRole,
            permissionKeys,
            permissionCount: permissionKeys.length,
            employeeCount: 0,
            permissions: permissionKeys.reduce((acc, k) => {
                acc[k] = true;
                return acc;
            }, {})
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        console.error('duplicateRole error:', error);
        res.status(500).json({ error: 'Failed to duplicate role' });
    }
};

/**
 * GET /api/roles/:id/activity
 * Get role activity log
 */
const getRoleActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [activities, total] = await Promise.all([
            prisma.roleActivityLog.findMany({
                where: { role_id: id },
                include: {
                    performedBy: {
                        select: { id: true, name: true, email: true, photo: true }
                    }
                },
                orderBy: { performed_at: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.roleActivityLog.count({ where: { role_id: id } })
        ]);

        res.json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('getRoleActivity error:', error);
        res.status(500).json({ error: 'Failed to fetch role activity' });
    }
};

/**
 * POST /api/roles/:id/assign-employees
 * Assign employees to a role
 */
const assignEmployeesToRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeIds } = req.body;
        const userId = req.user?.userId;

        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ error: 'Employee IDs array is required' });
        }

        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Get performer ID
        let performedById = null;
        if (userId) {
            const employee = await prisma.employee.findUnique({
                where: { user_id: userId },
                select: { id: true }
            });
            performedById = employee?.id;
        }

        // Update employees
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.employee.updateMany({
                where: { id: { in: employeeIds } },
                data: { role_id: id }
            });

            // Log activity
            await tx.roleActivityLog.create({
                data: {
                    role_id: id,
                    action: 'employees_assigned',
                    details: { employeeIds, count: updated.count },
                    performed_by_id: performedById
                }
            });

            return updated;
        });

        cache.delByPrefix('roles');
        cache.delByPrefix('employees');

        res.json({
            message: `${result.count} employee(s) assigned to role`,
            count: result.count
        });
    } catch (error) {
        console.error('assignEmployeesToRole error:', error);
        res.status(500).json({ error: 'Failed to assign employees' });
    }
};

/**
 * POST /api/roles/:id/remove-employee
 * Remove an employee from this role (assign to default role)
 */
const removeEmployeeFromRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;
        const userId = req.user?.userId;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }

        // Find default role
        const defaultRole = await prisma.role.findFirst({
            where: { isDefault: true }
        });

        if (!defaultRole) {
            return res.status(400).json({ error: 'No default role configured. Cannot remove employee.' });
        }

        // Get performer ID
        let performedById = null;
        if (userId) {
            const employee = await prisma.employee.findUnique({
                where: { user_id: userId },
                select: { id: true }
            });
            performedById = employee?.id;
        }

        // Update employee
        await prisma.$transaction(async (tx) => {
            await tx.employee.update({
                where: { id: employeeId },
                data: { role_id: defaultRole.id }
            });

            // Log activity
            await tx.roleActivityLog.create({
                data: {
                    role_id: id,
                    action: 'employee_removed',
                    details: { employeeId, reassignedTo: defaultRole.id },
                    performed_by_id: performedById
                }
            });
        });

        cache.delByPrefix('roles');
        cache.delByPrefix('employees');

        res.json({ message: 'Employee reassigned to default role' });
    } catch (error) {
        console.error('removeEmployeeFromRole error:', error);
        res.status(500).json({ error: 'Failed to remove employee from role' });
    }
};

// Update role permissions (legacy endpoint)
const updatePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!permissions) {
            return res.status(400).json({ error: 'Permissions object is required' });
        }

        // Convert to permissionKeys format and use updateRole
        req.body.permissionKeys = Object.entries(permissions)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);

        return updateRole(req, res);
    } catch (error) {
        console.error('updatePermissions error:', error);
        res.status(500).json({ error: 'Failed to update permissions' });
    }
};

/**
 * GET /roles/me/permissions
 * Get permissions for current user
 */
const getMyPermissions = async (req, res) => {
    try {
        const userId = req.user.userId;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId },
            include: {
                role: {
                    include: {
                        rolePermissions: { where: { granted: true } }
                    }
                }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        const permissionKeys = employee.role.rolePermissions.map(rp => rp.permissionKey);
        const hasAllPermissions = permissionKeys.includes('*');
        const finalKeys = hasAllPermissions ? getAllPermissionKeys() : permissionKeys;

        res.json({
            role: employee.role.name,
            roleId: employee.role.id,
            isSystemRole: employee.role.isSystemRole,
            permissionKeys: finalKeys,
            permissionCount: finalKeys.length,
            // Legacy format
            permissions: finalKeys.reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('getMyPermissions error:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};

module.exports = {
    // Permissions
    getPermissions,
    getRoleTemplates,
    // Role CRUD
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    // Role activity
    getRoleActivity,
    // Employee assignment
    assignEmployeesToRole,
    removeEmployeeFromRole,
    // Legacy
    updatePermissions,
    getMyPermissions
};
