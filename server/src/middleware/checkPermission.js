/**
 * Permission checking middleware
 * Checks if the user has the required permission(s) to access a route
 */

/**
 * Check if user has ANY of the required permissions
 * @param {...string} requiredPermissions - Permission name(s) to check
 * @returns {Function} Express middleware
 */
const checkPermission = (...requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.permissions || [];

        // If no permissions required, allow access
        if (requiredPermissions.length === 0) {
            return next();
        }

        // Admin users bypass all permission checks
        const isAdmin = req.employee?.role_name === 'Admin' ||
                        userPermissions.includes('*') ||
                        userPermissions.includes('admin');
        if (isAdmin) {
            return next();
        }

        // Check if user has ANY of the required permissions
        const hasPermission = requiredPermissions.some(permission =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to perform this action',
                required: requiredPermissions
            });
        }

        next();
    };
};

/**
 * Check if user has ALL of the required permissions
 * @param {...string} requiredPermissions - Permission name(s) to check
 * @returns {Function} Express middleware
 */
const checkAllPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.permissions || [];

        // If no permissions required, allow access
        if (requiredPermissions.length === 0) {
            return next();
        }

        // Admin users bypass all permission checks
        const isAdmin = req.employee?.role_name === 'Admin' ||
                        userPermissions.includes('*') ||
                        userPermissions.includes('admin');
        if (isAdmin) {
            return next();
        }

        // Check if user has ALL of the required permissions
        const hasAllPermissions = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
            const missingPermissions = requiredPermissions.filter(
                permission => !userPermissions.includes(permission)
            );
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have all required permissions',
                missing: missingPermissions
            });
        }

        next();
    };
};

module.exports = {
    checkPermission,
    checkAllPermissions
};
