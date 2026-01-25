/**
 * Company Settings Menu Configuration
 * Maps sidebar items to their required permissions
 */

export const COMPANY_SETTINGS_MENU = [
    {
        name: "Employees",
        path: "/employees",
        permission: "employees.view",
        icon: "Users"
    },
    {
        name: "Departments",
        path: "/departments",
        permission: "departments.view",
        icon: "Building2"
    },
    {
        name: "Roles",
        path: "/roles",
        permission: "roles.view",
        icon: "Shield"
    },
    {
        name: "Attendance",
        path: "/attendance",
        permission: "attendance.view_own",
        icon: "Clock"
    },
    {
        name: "Leave",
        path: "/leave",
        permission: "attendance.view_own",
        icon: "CalendarOff"
    },
    {
        name: "Org Chart",
        path: "/org-chart",
        permission: "employees.view",
        icon: "GitBranch"
    },
    {
        name: "Activity Logs",
        path: "/activity-logs",
        permission: "system.audit_logs",
        icon: "Activity"
    },
    {
        name: "Documents",
        path: "/documents",
        permission: "documents.view",
        icon: "FileText"
    },
    {
        name: "Users",
        path: "/users",
        permission: "users.view",
        icon: "UserCog"
    }
];

/**
 * Get visible menu items based on user permissions
 * @param {Function} hasPermission - Permission check function
 * @returns {Array} Filtered menu items
 */
export const getVisibleMenuItems = (hasPermission) => {
    return COMPANY_SETTINGS_MENU.filter(item => hasPermission(item.permission));
};

export default COMPANY_SETTINGS_MENU;
