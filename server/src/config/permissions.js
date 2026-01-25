/**
 * Comprehensive Permissions Configuration
 *
 * Permission key format: category.action
 * e.g., "employees.create", "tasks.view_all"
 */

const PERMISSION_CATEGORIES = {
    employees: {
        name: 'Employees',
        description: 'Employee management permissions',
        icon: 'users',
        permissions: {
            'employees.view': {
                name: 'View Employees',
                description: 'View employee profiles and basic information'
            },
            'employees.create': {
                name: 'Create Employees',
                description: 'Add new employees to the system'
            },
            'employees.edit': {
                name: 'Edit Employees',
                description: 'Modify employee information'
            },
            'employees.delete': {
                name: 'Delete Employees',
                description: 'Remove employees from the system'
            },
            'employees.lifecycle': {
                name: 'Manage Employee Lifecycle',
                description: 'Handle onboarding, offboarding, and status changes'
            }
        }
    },
    departments: {
        name: 'Departments',
        description: 'Department management permissions',
        icon: 'building',
        permissions: {
            'departments.view': {
                name: 'View Departments',
                description: 'View department information and structure'
            },
            'departments.create': {
                name: 'Create Departments',
                description: 'Add new departments'
            },
            'departments.edit': {
                name: 'Edit Departments',
                description: 'Modify department details'
            },
            'departments.delete': {
                name: 'Delete Departments',
                description: 'Remove departments from the system'
            }
        }
    },
    roles: {
        name: 'Roles',
        description: 'Role and permission management',
        icon: 'shield',
        permissions: {
            'roles.view': {
                name: 'View Roles',
                description: 'View roles and their permissions'
            },
            'roles.create': {
                name: 'Create Roles',
                description: 'Create new roles'
            },
            'roles.edit': {
                name: 'Edit Roles',
                description: 'Modify roles and permissions'
            },
            'roles.delete': {
                name: 'Delete Roles',
                description: 'Remove roles from the system'
            }
        }
    },
    tasks: {
        name: 'Tasks',
        description: 'Task management permissions',
        icon: 'check-square',
        permissions: {
            'tasks.view_own': {
                name: 'View Own Tasks',
                description: 'View tasks assigned to you'
            },
            'tasks.view_department': {
                name: 'View Department Tasks',
                description: 'View tasks within your department'
            },
            'tasks.view_all': {
                name: 'View All Tasks',
                description: 'View tasks across all departments'
            },
            'tasks.create': {
                name: 'Create Tasks',
                description: 'Create new tasks'
            },
            'tasks.assign': {
                name: 'Assign Tasks',
                description: 'Assign tasks to other employees'
            },
            'tasks.edit_any': {
                name: 'Edit Any Task',
                description: 'Modify any task regardless of ownership'
            },
            'tasks.delete': {
                name: 'Delete Tasks',
                description: 'Remove tasks from the system'
            }
        }
    },
    attendance: {
        name: 'Attendance',
        description: 'Attendance and leave management',
        icon: 'clock',
        permissions: {
            'attendance.view_own': {
                name: 'View Own Attendance',
                description: 'View your attendance records'
            },
            'attendance.view_department': {
                name: 'View Department Attendance',
                description: 'View attendance for your department'
            },
            'attendance.view_all': {
                name: 'View All Attendance',
                description: 'View attendance across all employees'
            },
            'attendance.manage': {
                name: 'Manage Attendance',
                description: 'Edit and manage attendance records'
            },
            'attendance.approve': {
                name: 'Approve Leave Requests',
                description: 'Approve or reject leave requests'
            }
        }
    },
    goals: {
        name: 'Goals',
        description: 'Goal and OKR management',
        icon: 'target',
        permissions: {
            'goals.view_own': {
                name: 'View Own Goals',
                description: 'View your personal goals'
            },
            'goals.view_department': {
                name: 'View Department Goals',
                description: 'View goals within your department'
            },
            'goals.view_all': {
                name: 'View All Goals',
                description: 'View goals across the organization'
            },
            'goals.create': {
                name: 'Create Goals',
                description: 'Create new goals'
            },
            'goals.edit': {
                name: 'Edit Goals',
                description: 'Modify existing goals'
            },
            'goals.approve': {
                name: 'Approve Goals',
                description: 'Approve and finalize goals'
            }
        }
    },
    messaging: {
        name: 'Messaging',
        description: 'Communication and announcements',
        icon: 'message-circle',
        permissions: {
            'messaging.send': {
                name: 'Send Messages',
                description: 'Send messages to other employees'
            },
            'messaging.department_announce': {
                name: 'Department Announcements',
                description: 'Send announcements to your department'
            },
            'messaging.company_announce': {
                name: 'Company Announcements',
                description: 'Send company-wide announcements'
            },
            'messaging.view_all': {
                name: 'View All Messages',
                description: 'Admin access to view all messages'
            }
        }
    },
    reports: {
        name: 'Reports',
        description: 'Analytics and reporting',
        icon: 'bar-chart-2',
        permissions: {
            'reports.view_personal': {
                name: 'View Personal Reports',
                description: 'Access your personal analytics and reports'
            },
            'reports.view_department': {
                name: 'View Department Reports',
                description: 'Access department-level analytics'
            },
            'reports.view_company': {
                name: 'View Company Analytics',
                description: 'Access company-wide analytics and dashboards'
            },
            'reports.export': {
                name: 'Export Reports',
                description: 'Export reports to CSV, PDF, etc.'
            }
        }
    },
    ai_assistant: {
        name: 'AI Assistant',
        description: 'AI assistant access and configuration',
        icon: 'bot',
        permissions: {
            'ai.access': {
                name: 'Access AI Assistant',
                description: 'Use the AI assistant features'
            },
            'ai.configure': {
                name: 'Configure AI Settings',
                description: 'Modify AI assistant settings and behavior'
            },
            'ai.view_logs': {
                name: 'View AI Decision Logs',
                description: 'Review AI decision history and logs'
            }
        }
    },
    system: {
        name: 'System',
        description: 'System administration',
        icon: 'settings',
        permissions: {
            'system.settings': {
                name: 'Manage System Settings',
                description: 'Configure system-wide settings'
            },
            'system.audit_logs': {
                name: 'View Audit Logs',
                description: 'Access system audit logs'
            },
            'system.integrations': {
                name: 'Manage Integrations',
                description: 'Configure third-party integrations'
            },
            'system.billing': {
                name: 'Manage Billing',
                description: 'Access billing and subscription management'
            }
        }
    }
};

/**
 * Permission Dependencies
 * Key: permission that depends on others
 * Value: array of required permissions
 */
const PERMISSION_DEPENDENCIES = {
    // Employees
    'employees.edit': ['employees.view'],
    'employees.delete': ['employees.view'],
    'employees.lifecycle': ['employees.view', 'employees.edit'],

    // Departments
    'departments.edit': ['departments.view'],
    'departments.delete': ['departments.view'],

    // Roles
    'roles.edit': ['roles.view'],
    'roles.delete': ['roles.view'],

    // Tasks
    'tasks.view_department': ['tasks.view_own'],
    'tasks.view_all': ['tasks.view_department'],
    'tasks.assign': ['tasks.view_department', 'tasks.create'],
    'tasks.edit_any': ['tasks.view_all'],
    'tasks.delete': ['tasks.view_all'],

    // Attendance
    'attendance.view_department': ['attendance.view_own'],
    'attendance.view_all': ['attendance.view_department'],
    'attendance.manage': ['attendance.view_all'],
    'attendance.approve': ['attendance.view_department'],

    // Goals
    'goals.view_department': ['goals.view_own'],
    'goals.view_all': ['goals.view_department'],
    'goals.edit': ['goals.view_own'],
    'goals.approve': ['goals.view_department'],

    // Messaging
    'messaging.department_announce': ['messaging.send'],
    'messaging.company_announce': ['messaging.send', 'messaging.department_announce'],
    'messaging.view_all': ['messaging.send'],

    // Reports
    'reports.view_department': ['reports.view_personal'],
    'reports.view_company': ['reports.view_department'],
    'reports.export': ['reports.view_personal'],

    // AI
    'ai.configure': ['ai.access'],
    'ai.view_logs': ['ai.access'],

    // System
    'system.audit_logs': ['system.settings'],
    'system.integrations': ['system.settings'],
    'system.billing': ['system.settings']
};

/**
 * Role Templates
 */
const ROLE_TEMPLATES = [
    {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        color: '#dc2626',
        icon: 'shield',
        isSystemRole: true,
        permissions: ['*'] // All permissions
    },
    {
        name: 'Department Manager',
        description: 'Manage department employees, tasks, and attendance',
        color: '#7c3aed',
        icon: 'users',
        permissions: [
            'employees.view', 'employees.edit',
            'departments.view', 'departments.edit',
            'tasks.view_own', 'tasks.view_department', 'tasks.create', 'tasks.assign', 'tasks.edit_any',
            'attendance.view_own', 'attendance.view_department', 'attendance.manage', 'attendance.approve',
            'goals.view_own', 'goals.view_department', 'goals.create', 'goals.edit',
            'messaging.send', 'messaging.department_announce',
            'reports.view_personal', 'reports.view_department',
            'ai.access'
        ]
    },
    {
        name: 'Team Lead',
        description: 'Lead a team with task and goal management',
        color: '#2563eb',
        icon: 'user-check',
        permissions: [
            'employees.view',
            'tasks.view_own', 'tasks.view_department', 'tasks.create', 'tasks.assign',
            'attendance.view_own', 'attendance.view_department',
            'goals.view_own', 'goals.view_department', 'goals.create',
            'messaging.send',
            'reports.view_personal',
            'ai.access'
        ]
    },
    {
        name: 'HR Manager',
        description: 'Full employee and attendance management',
        color: '#059669',
        icon: 'heart-handshake',
        permissions: [
            'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.lifecycle',
            'departments.view',
            'roles.view',
            'attendance.view_own', 'attendance.view_department', 'attendance.view_all', 'attendance.manage', 'attendance.approve',
            'reports.view_personal', 'reports.view_department', 'reports.view_company', 'reports.export',
            'ai.access'
        ]
    },
    {
        name: 'Employee',
        description: 'Standard employee access',
        color: '#6366f1',
        icon: 'user',
        isDefault: true,
        permissions: [
            'employees.view',
            'tasks.view_own', 'tasks.create',
            'attendance.view_own',
            'goals.view_own', 'goals.create',
            'messaging.send',
            'reports.view_personal',
            'ai.access'
        ]
    },
    {
        name: 'Viewer',
        description: 'Read-only access to view data',
        color: '#64748b',
        icon: 'eye',
        permissions: [
            'employees.view',
            'departments.view',
            'tasks.view_own',
            'attendance.view_own',
            'goals.view_own',
            'reports.view_personal'
        ]
    }
];

// ===== Helper Functions =====

/**
 * Get all available permissions as a flat array
 * @returns {Array} Array of permission objects with key, name, description, category
 */
const getAllPermissions = () => {
    const permissions = [];
    for (const [categoryKey, category] of Object.entries(PERMISSION_CATEGORIES)) {
        for (const [permKey, perm] of Object.entries(category.permissions)) {
            permissions.push({
                key: permKey,
                name: perm.name,
                description: perm.description,
                category: categoryKey,
                categoryName: category.name,
                categoryIcon: category.icon
            });
        }
    }
    return permissions;
};

/**
 * Get permissions grouped by category
 * @returns {Object} Permissions organized by category
 */
const getPermissionsByCategory = () => {
    return PERMISSION_CATEGORIES;
};

/**
 * Get all permission keys
 * @returns {Array} Array of permission key strings
 */
const getAllPermissionKeys = () => {
    return getAllPermissions().map(p => p.key);
};

/**
 * Validate that all required dependencies are included
 * @param {Array} permissionKeys - Array of permission keys
 * @returns {Object} { valid: boolean, missing: Array }
 */
const validatePermissionDependencies = (permissionKeys) => {
    const missing = [];

    for (const permKey of permissionKeys) {
        const dependencies = PERMISSION_DEPENDENCIES[permKey];
        if (dependencies) {
            for (const dep of dependencies) {
                if (!permissionKeys.includes(dep)) {
                    missing.push({
                        permission: permKey,
                        requires: dep,
                        message: `"${getPermissionName(permKey)}" requires "${getPermissionName(dep)}"`
                    });
                }
            }
        }
    }

    return {
        valid: missing.length === 0,
        missing
    };
};

/**
 * Get the human-readable name of a permission
 * @param {string} permKey - Permission key
 * @returns {string} Permission name
 */
const getPermissionName = (permKey) => {
    for (const category of Object.values(PERMISSION_CATEGORIES)) {
        if (category.permissions[permKey]) {
            return category.permissions[permKey].name;
        }
    }
    return permKey;
};

/**
 * Resolve all dependencies for a set of permissions
 * @param {Array} permissionKeys - Array of permission keys
 * @returns {Array} Array with all required permissions included
 */
const resolvePermissions = (permissionKeys) => {
    const resolved = new Set(permissionKeys);

    for (const permKey of permissionKeys) {
        const dependencies = PERMISSION_DEPENDENCIES[permKey];
        if (dependencies) {
            for (const dep of dependencies) {
                resolved.add(dep);
            }
        }
    }

    return Array.from(resolved);
};

/**
 * Get permissions that depend on a given permission
 * @param {string} permKey - Permission key
 * @returns {Array} Array of permission keys that depend on this one
 */
const getDependentsOf = (permKey) => {
    const dependents = [];

    for (const [key, deps] of Object.entries(PERMISSION_DEPENDENCIES)) {
        if (deps.includes(permKey)) {
            dependents.push(key);
        }
    }

    return dependents;
};

/**
 * Check if a permission can be safely deselected
 * @param {string} permKey - Permission to check
 * @param {Array} selectedPermissions - Currently selected permissions
 * @returns {Object} { canDeselect: boolean, blockedBy: Array }
 */
const canDeselect = (permKey, selectedPermissions) => {
    const dependents = getDependentsOf(permKey);
    const blockedBy = dependents.filter(dep => selectedPermissions.includes(dep));

    return {
        canDeselect: blockedBy.length === 0,
        blockedBy
    };
};

/**
 * Expand '*' wildcard to all permissions
 * @param {Array} permissionKeys - Array of permission keys (may include '*')
 * @returns {Array} Array with '*' expanded to all permissions
 */
const expandWildcard = (permissionKeys) => {
    if (permissionKeys.includes('*')) {
        return getAllPermissionKeys();
    }
    return permissionKeys;
};

/**
 * Check if user has a specific permission
 * @param {Array} userPermissions - User's permission keys
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (userPermissions, requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) return false;
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(requiredPermission);
};

module.exports = {
    PERMISSION_CATEGORIES,
    PERMISSION_DEPENDENCIES,
    ROLE_TEMPLATES,
    getAllPermissions,
    getPermissionsByCategory,
    getAllPermissionKeys,
    validatePermissionDependencies,
    getPermissionName,
    resolvePermissions,
    getDependentsOf,
    canDeselect,
    expandWildcard,
    hasPermission
};
