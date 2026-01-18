const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

// Get all departments
const getDepartments = async (req, res) => {
    try {
        const cacheKey = 'departments:all';
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            res.set('X-Cache', 'HIT');
            return res.json(cachedData);
        }

        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        cache.set(cacheKey, departments, 60);
        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

// Get single department by ID
const getDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                employees: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                        role: { select: { name: true } }
                    }
                }
            }
        });

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
};

// Create department
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }

        const department = await prisma.department.create({
            data: { name, description }
        });

        cache.delByPrefix('departments');
        res.status(201).json(department);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create department' });
    }
};

// Update department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const department = await prisma.department.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            }
        });

        cache.delByPrefix('departments');
        res.json(department);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Department not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update department' });
    }
};

// Delete department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department has employees
        const employeeCount = await prisma.employee.count({
            where: { department_id: id }
        });

        if (employeeCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete department with employees. Reassign employees first.'
            });
        }

        await prisma.department.delete({ where: { id } });

        cache.delByPrefix('departments');
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Department not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
};

// Get department stats
const getDepartmentStats = async (req, res) => {
    try {
        const stats = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: { employees: true }
                },
                employees: {
                    select: { status: true }
                }
            }
        });

        const formattedStats = stats.map(dept => ({
            id: dept.id,
            name: dept.name,
            totalEmployees: dept._count.employees,
            activeEmployees: dept.employees.filter(e => e.status === 'active').length,
            onLeave: dept.employees.filter(e => e.status === 'on_leave').length,
            terminated: dept.employees.filter(e => e.status === 'terminated').length
        }));

        res.json(formattedStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch department stats' });
    }
};

module.exports = {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
};
