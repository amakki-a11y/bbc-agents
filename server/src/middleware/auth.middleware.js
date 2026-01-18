const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;

        // Fetch employee record with role to get permissions
        const employee = await prisma.employee.findUnique({
            where: { user_id: user.userId },
            include: {
                role: true,
                department: true
            }
        });

        if (employee) {
            req.employee = {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                department_id: employee.department_id,
                department_name: employee.department.name,
                role_id: employee.role_id,
                role_name: employee.role.name,
                manager_id: employee.manager_id,
                status: employee.status
            };

            // Parse permissions from role
            try {
                req.permissions = JSON.parse(employee.role.permissions || '[]');
            } catch {
                req.permissions = [];
            }
        } else {
            // User exists but has no employee record
            req.employee = null;
            req.permissions = [];
        }

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.sendStatus(403);
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = authenticateToken;
