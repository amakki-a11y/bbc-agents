const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

// Get all employees with pagination and filters
const getEmployees = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor || undefined;
        const { department_id, role_id, status, search } = req.query;

        const cacheKey = `employees:${JSON.stringify(req.query)}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            if (cachedData.nextCursor) {
                res.set('X-Next-Cursor', cachedData.nextCursor);
            }
            return res.json(cachedData.data);
        }

        const where = {
            ...(department_id && { department_id }),
            ...(role_id && { role_id }),
            ...(status && { status }),
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } }
                ]
            })
        };

        const employees = await prisma.employee.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { name: 'asc' },
            include: {
                department: { select: { id: true, name: true } },
                role: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
                _count: { select: { subordinates: true } }
            }
        });

        let nextCursor = undefined;
        if (employees.length > limit) {
            const nextItem = employees.pop();
            nextCursor = nextItem.id;
        }

        if (nextCursor) {
            res.set('X-Next-Cursor', nextCursor);
        }

        cache.set(cacheKey, { data: employees, nextCursor }, 30);
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

// Get single employee by ID
const getEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true, email: true } },
                subordinates: { select: { id: true, name: true, email: true, status: true } },
                user: { select: { id: true, email: true, avatar_url: true } }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
};

// Create employee
const createEmployee = async (req, res) => {
    try {
        const {
            user_id, name, email, phone,
            department_id, role_id, manager_id,
            hire_date, status
        } = req.body;

        if (!user_id || !name || !email || !department_id || !role_id) {
            return res.status(400).json({
                error: 'user_id, name, email, department_id, and role_id are required'
            });
        }

        const employee = await prisma.employee.create({
            data: {
                user_id: parseInt(user_id),
                name,
                email,
                phone,
                department_id,
                role_id,
                manager_id: manager_id || null,
                hire_date: hire_date ? new Date(hire_date) : new Date(),
                status: status || 'active'
            },
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } },
                manager: { select: { name: true } }
            }
        });

        cache.delByPrefix('employees');
        res.status(201).json(employee);
    } catch (error) {
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            return res.status(400).json({ error: `${field || 'Field'} already exists` });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid reference: check user_id, department_id, role_id, or manager_id' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
};

// Update employee
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, email, phone,
            department_id, role_id, manager_id,
            hire_date, status
        } = req.body;

        // Prevent self-referencing manager
        if (manager_id === id) {
            return res.status(400).json({ error: 'Employee cannot be their own manager' });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(department_id && { department_id }),
                ...(role_id && { role_id }),
                ...(manager_id !== undefined && { manager_id: manager_id || null }),
                ...(hire_date && { hire_date: new Date(hire_date) }),
                ...(status && { status })
            },
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } },
                manager: { select: { name: true } }
            }
        });

        cache.delByPrefix('employees');
        res.json(employee);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Employee not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if employee has subordinates
        const subordinateCount = await prisma.employee.count({
            where: { manager_id: id }
        });

        if (subordinateCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete employee with subordinates. Reassign subordinates first.'
            });
        }

        await prisma.employee.delete({ where: { id } });

        cache.delByPrefix('employees');
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Employee not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};

// Get employee hierarchy (org chart)
const getHierarchy = async (req, res) => {
    try {
        const { department_id } = req.query;

        // Get top-level employees (no manager)
        const where = {
            manager_id: null,
            ...(department_id && { department_id })
        };

        const topLevel = await prisma.employee.findMany({
            where,
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } },
                subordinates: {
                    include: {
                        role: { select: { name: true } },
                        subordinates: {
                            include: {
                                role: { select: { name: true } },
                                subordinates: {
                                    select: { id: true, name: true, email: true, status: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.json(topLevel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch hierarchy' });
    }
};

// Get my profile (current user's employee profile)
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true, email: true } },
                subordinates: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getHierarchy,
    getMyProfile
};
