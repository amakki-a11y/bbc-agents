/**
 * Permission checking middleware
 * Checks if the user has the required permission(s) to access a route
 */

// Legacy permission to new permission mapping
const LEGACY_PERMISSION_MAP = {
    'manage_departments': ['departments.view', 'departments.create', 'departments.edit', 'departments.delete'],
    'manage_employees': ['employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.lifecycle'],
    'manage_roles': ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'],
    'view_all_tasks': ['tasks.view_all'],
    'view_department_tasks': ['tasks.view_department'],
    'manage_attendance': ['attendance.view_all', 'attendance.manage', 'attendance.approve'],
    'view_reports': ['reports.view_personal', 'reports.view_department', 'reports.view_company'],
    'send_announcements': ['messaging.department_announce', 'messaging.company_announce']
};

// Reverse mapping for checking
const PERMISSION_EQUIVALENTS = {};
for (const [legacy, newPerms] of Object.entries(LEGACY_PERMISSION_MAP)) {
    for (const newPerm of newPerms) {
        if (!PERMISSION_EQUIVALENTS[newPerm]) {
            PERMISSION_EQUIVALENTS[newPerm] = [];
        }
        PERMISSION_EQUIVALENTS[newPerm].push(legacy);
    }
}

/**
 * Check if user has permission, supporting both legacy and new permission systems
 * @param {Array} userPermissions - User's permissions
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean}
 */
const hasPermissionKey = (userPermissions, requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) return false;

    // Direct match
    if (userPermissions.includes(requiredPermission)) return true;

    // Wildcard (all permissions)
    if (userPermissions.includes('*')) return true;

    // Check if user has legacy permission that covers this new permission
    const legacyEquivalents = PERMISSION_EQUIVALENTS[requiredPermission] || [];
    for (const legacy of legacyEquivalents) {
        if (userPermissions.includes(legacy)) return true;
    }

    // Check if required permission is legacy and user has any of the new equivalents
    const newEquivalents = LEGACY_PERMISSION_MAP[requiredPermission] || [];
    for (const newPerm of newEquivalents) {
        if (userPermissions.includes(newPerm)) return true;
    }

    return false;
};

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

        // Admin/System role users bypass all permission checks
        const isAdmin = req.employee?.role_name === 'Admin' ||
                        req.employee?.role_name === 'Super Admin' ||
                        req.employee?.isSystemRole === true ||
                        userPermissions.includes('*') ||
                        userPermissions.includes('admin');
        if (isAdmin) {
            return next();
        }

        // Check if user has ANY of the required permissions
        const hasPermission = requiredPermissions.some(permission =>
            hasPermissionKey(userPermissions, permission)
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

        // Admin/System role users bypass all permission checks
        const isAdmin = req.employee?.role_name === 'Admin' ||
                        req.employee?.role_name === 'Super Admin' ||
                        req.employee?.isSystemRole === true ||
                        userPermissions.includes('*') ||
                        userPermissions.includes('admin');
        if (isAdmin) {
            return next();
        }

        // Check if user has ALL of the required permissions
        const hasAllPermissions = requiredPermissions.every(permission =>
            hasPermissionKey(userPermissions, permission)
        );

        if (!hasAllPermissions) {
            const missingPermissions = requiredPermissions.filter(
                permission => !hasPermissionKey(userPermissions, permission)
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

/**
 * Optional permission check - sets req.hasPermission flag but doesn't block
 * Useful for conditional rendering in API responses
 * @param {string} permission - Permission to check
 * @returns {Function} Express middleware
 */
const optionalPermissionCheck = (permission) => {
    return (req, res, next) => {
        const userPermissions = req.permissions || [];
        req.hasPermission = req.hasPermission || {};
        req.hasPermission[permission] = hasPermissionKey(userPermissions, permission);
        next();
    };
};

module.exports = {
    checkPermission,
    checkAllPermissions,
    optionalPermissionCheck,
    hasPermissionKey,
    LEGACY_PERMISSION_MAP
};
