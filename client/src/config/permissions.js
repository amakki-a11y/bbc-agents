/**
 * Frontend Permissions Configuration
 * Mirrors the backend permissions config
 */

export const PERMISSION_CATEGORIES = {
    employees: {
        name: 'Employees',
        description: 'Employee management permissions',
        icon: 'Users',
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
        icon: 'Building',
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
        icon: 'Shield',
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
        icon: 'CheckSquare',
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
        icon: 'Clock',
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
        icon: 'Target',
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
        icon: 'MessageCircle',
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
        icon: 'BarChart2',
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
        icon: 'Bot',
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
    users: {
        name: 'Users',
        description: 'User account management',
        icon: 'UserCog',
        permissions: {
            'users.view': {
                name: 'View Users',
                description: 'View user accounts and their linked employee profiles'
            },
            'users.manage': {
                name: 'Manage Users',
                description: 'Link and unlink users to employee profiles'
            },
            'users.delete': {
                name: 'Delete Users',
                description: 'Delete user accounts from the system'
            }
        }
    },
    system: {
        name: 'System',
        description: 'System administration',
        icon: 'Settings',
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
 */
export const PERMISSION_DEPENDENCIES = {
    'employees.edit': ['employees.view'],
    'employees.delete': ['employees.view'],
    'employees.lifecycle': ['employees.view', 'employees.edit'],
    'departments.edit': ['departments.view'],
    'departments.delete': ['departments.view'],
    'roles.edit': ['roles.view'],
    'roles.delete': ['roles.view'],
    'tasks.view_department': ['tasks.view_own'],
    'tasks.view_all': ['tasks.view_department'],
    'tasks.assign': ['tasks.view_department', 'tasks.create'],
    'tasks.edit_any': ['tasks.view_all'],
    'tasks.delete': ['tasks.view_all'],
    'attendance.view_department': ['attendance.view_own'],
    'attendance.view_all': ['attendance.view_department'],
    'attendance.manage': ['attendance.view_all'],
    'attendance.approve': ['attendance.view_department'],
    'goals.view_department': ['goals.view_own'],
    'goals.view_all': ['goals.view_department'],
    'goals.edit': ['goals.view_own'],
    'goals.approve': ['goals.view_department'],
    'messaging.department_announce': ['messaging.send'],
    'messaging.company_announce': ['messaging.send', 'messaging.department_announce'],
    'messaging.view_all': ['messaging.send'],
    'reports.view_department': ['reports.view_personal'],
    'reports.view_company': ['reports.view_department'],
    'reports.export': ['reports.view_personal'],
    'ai.configure': ['ai.access'],
    'ai.view_logs': ['ai.access'],
    'users.manage': ['users.view'],
    'users.delete': ['users.view', 'users.manage'],
    'system.audit_logs': ['system.settings'],
    'system.integrations': ['system.settings'],
    'system.billing': ['system.settings']
};

// Helper functions
export const getAllPermissions = () => {
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

export const getAllPermissionKeys = () => getAllPermissions().map(p => p.key);

export const getPermissionName = (permKey) => {
    for (const category of Object.values(PERMISSION_CATEGORIES)) {
        if (category.permissions[permKey]) {
            return category.permissions[permKey].name;
        }
    }
    return permKey;
};

export const resolvePermissions = (selectedKeys) => {
    const resolved = new Set(selectedKeys);
    for (const permKey of selectedKeys) {
        const dependencies = PERMISSION_DEPENDENCIES[permKey];
        if (dependencies) {
            dependencies.forEach(dep => resolved.add(dep));
        }
    }
    return Array.from(resolved);
};

export const getDependentsOf = (permKey) => {
    const dependents = [];
    for (const [key, deps] of Object.entries(PERMISSION_DEPENDENCIES)) {
        if (deps.includes(permKey)) {
            dependents.push(key);
        }
    }
    return dependents;
};

export const canDeselect = (permKey, selectedPermissions) => {
    const dependents = getDependentsOf(permKey);
    const blockedBy = dependents.filter(dep => selectedPermissions.includes(dep));
    return {
        canDeselect: blockedBy.length === 0,
        blockedBy
    };
};

// Preset colors for roles
export const ROLE_COLORS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Cyan', value: '#0891b2' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Slate', value: '#64748b' }
];

// Icons for roles
export const ROLE_ICONS = [
    { name: 'Shield', value: 'shield' },
    { name: 'Users', value: 'users' },
    { name: 'User', value: 'user' },
    { name: 'User Check', value: 'user-check' },
    { name: 'Heart Handshake', value: 'heart-handshake' },
    { name: 'Eye', value: 'eye' },
    { name: 'Crown', value: 'crown' },
    { name: 'Star', value: 'star' }
];
