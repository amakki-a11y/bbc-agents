const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');


const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;

        // Fetch employee record with role to get permissions
        // Wrapped in try-catch to handle database connection issues gracefully
        try {
            const employee = await prisma.employee.findUnique({
                where: { user_id: user.userId },
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                where: { granted: true },
                                select: { permissionKey: true }
                            }
                        }
                    },
                    department: true
                }
            });

            if (employee) {
                req.employee = {
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    department_id: employee.department_id,
                    department_name: employee.department?.name,
                    role_id: employee.role_id,
                    role_name: employee.role?.name,
                    manager_id: employee.manager_id,
                    status: employee.status,
                    isSystemRole: employee.role?.isSystemRole || false
                };

                // Get permissions from RolePermission table first
                const rolePermissions = employee.role?.rolePermissions || [];

                if (rolePermissions.length > 0) {
                    // Use new RolePermission system
                    req.permissions = rolePermissions.map(rp => rp.permissionKey);
                } else {
                    // Fall back to legacy JSON permissions
                    try {
                        const legacyPerms = JSON.parse(employee.role?.permissions || '{}');
                        // Convert object format to array of keys
                        if (Array.isArray(legacyPerms)) {
                            req.permissions = legacyPerms;
                        } else {
                            req.permissions = Object.entries(legacyPerms)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key);
                        }
                    } catch {
                        req.permissions = [];
                    }
                }
            } else {
                // User exists but has no employee record - still allow access to basic features
                req.employee = null;
                req.permissions = [];
            }
        } catch (dbError) {
            // Database error - log but don't block authentication
            // This allows the app to work even if employee lookup fails
            console.error('Employee lookup failed (DB error):', dbError.message);
            req.employee = null;
            req.permissions = [];
        }

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = authenticateToken;
