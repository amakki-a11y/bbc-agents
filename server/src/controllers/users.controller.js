const prisma = require('../lib/prisma');

/**
 * Get all users with their linked employee status
 */
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                created_at: true,
                employee: {
                    select: {
                        id: true,
                        name: true,
                        department: { select: { name: true } },
                        role: { select: { name: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error('[Users] Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Get a single user by ID
 */
const getUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                username: true,
                created_at: true,
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: { select: { id: true, name: true } },
                        role: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('[Users] Failed to fetch user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

/**
 * Get unlinked employees (employees without a user account)
 */
const getUnlinkedEmployees = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: { user_id: null },
            select: {
                id: true,
                name: true,
                email: true,
                department: { select: { name: true } },
                role: { select: { name: true } }
            },
            orderBy: { name: 'asc' }
        });

        res.json(employees);
    } catch (error) {
        console.error('[Users] Failed to fetch unlinked employees:', error);
        res.status(500).json({ error: 'Failed to fetch unlinked employees' });
    }
};

/**
 * Link a user to an employee profile
 */
const linkUserToEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }

        const userId = parseInt(id);

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if employee exists and is not already linked
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        if (employee.user_id) {
            return res.status(400).json({ error: 'Employee is already linked to another user' });
        }

        // Check if user is already linked to an employee
        const existingLink = await prisma.employee.findUnique({ where: { user_id: userId } });
        if (existingLink) {
            return res.status(400).json({ error: 'User is already linked to an employee' });
        }

        // Link the user to the employee
        const updatedEmployee = await prisma.employee.update({
            where: { id: employeeId },
            data: { user_id: userId },
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } }
            }
        });

        res.json({
            message: 'User linked to employee successfully',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('[Users] Failed to link user to employee:', error);
        res.status(500).json({ error: 'Failed to link user to employee' });
    }
};

/**
 * Unlink a user from an employee profile
 */
const unlinkUserFromEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        // Find the employee linked to this user
        const employee = await prisma.employee.findUnique({ where: { user_id: userId } });
        if (!employee) {
            return res.status(404).json({ error: 'No employee linked to this user' });
        }

        // Unlink
        await prisma.employee.update({
            where: { id: employee.id },
            data: { user_id: null }
        });

        res.json({ message: 'User unlinked from employee successfully' });
    } catch (error) {
        console.error('[Users] Failed to unlink user from employee:', error);
        res.status(500).json({ error: 'Failed to unlink user from employee' });
    }
};

/**
 * Delete a user (admin only)
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Unlink from employee first if linked
        await prisma.employee.updateMany({
            where: { user_id: userId },
            data: { user_id: null }
        });

        // Delete the user
        await prisma.user.delete({ where: { id: userId } });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('[Users] Failed to delete user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

module.exports = {
    getUsers,
    getUser,
    getUnlinkedEmployees,
    linkUserToEmployee,
    unlinkUserFromEmployee,
    deleteUser
};
