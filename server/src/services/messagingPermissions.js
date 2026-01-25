/**
 * Messaging Permissions Service
 *
 * Hierarchy-based messaging rules:
 *
 * EMPLOYEE can message:
 *   - Their direct manager
 *   - Anyone in same department
 *   - HR department (any member)
 *
 * MANAGER can message:
 *   - Their direct reports (subordinates)
 *   - Other managers at same level
 *   - Their own manager
 *   - HR department
 *
 * HEAD OF DEPARTMENT can message:
 *   - Everyone in their department
 *   - Other HODs
 *   - Management/Admin
 *   - HR department
 *
 * ADMIN/HR can message:
 *   - Anyone in the company
 */

const prisma = require('../lib/prisma');

/**
 * Check if sender can message recipient based on organizational hierarchy
 * @param {string} senderId - Sender employee ID
 * @param {string} recipientId - Recipient employee ID
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
const canMessageEmployee = async (senderId, recipientId) => {
    try {
        // Get sender with full context
        const sender = await prisma.employee.findUnique({
            where: { id: senderId },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true } },
                subordinates: { select: { id: true } }
            }
        });

        // Get recipient with full context
        const recipient = await prisma.employee.findUnique({
            where: { id: recipientId },
            include: {
                department: true,
                role: true
            }
        });

        if (!sender) return { allowed: false, reason: 'Sender not found' };
        if (!recipient) return { allowed: false, reason: 'Recipient not found' };

        // Can't message yourself
        if (senderId === recipientId) {
            return { allowed: false, reason: 'Cannot message yourself' };
        }

        const senderRoleName = sender.role?.name?.toLowerCase() || '';
        const recipientDeptName = recipient.department?.name?.toLowerCase() || '';

        // Admin/HR can message anyone
        if (senderRoleName === 'admin' || senderRoleName.includes('hr')) {
            return { allowed: true, reason: 'Admin/HR can message anyone' };
        }

        // Can always message own manager
        if (sender.manager && sender.manager.id === recipientId) {
            return { allowed: true, reason: 'Messaging direct manager' };
        }

        // Can always message HR department members
        if (recipientDeptName.includes('hr') || recipientDeptName.includes('human resource')) {
            return { allowed: true, reason: 'HR is always accessible' };
        }

        // Same department - can message colleagues
        if (sender.department_id === recipient.department_id) {
            return { allowed: true, reason: 'Same department colleague' };
        }

        // Managers can message their direct reports
        if (sender.subordinates?.some(s => s.id === recipientId)) {
            return { allowed: true, reason: 'Direct report' };
        }

        // Head of Department can message other HODs and management
        if (senderRoleName.includes('head') || senderRoleName.includes('director')) {
            const recipientRoleName = recipient.role?.name?.toLowerCase() || '';
            if (recipientRoleName.includes('head') ||
                recipientRoleName.includes('director') ||
                recipientRoleName === 'admin') {
                return { allowed: true, reason: 'Leadership communication' };
            }
        }

        // Managers can message other managers at same level
        const isManager = sender.subordinates && sender.subordinates.length > 0;
        if (isManager) {
            const recipientSubordinates = await prisma.employee.count({
                where: { manager_id: recipientId }
            });
            if (recipientSubordinates > 0) {
                return { allowed: true, reason: 'Manager-to-manager communication' };
            }
        }

        return {
            allowed: false,
            reason: 'You can only message your manager, HR, or colleagues in your department. Ask your manager to forward if needed.'
        };
    } catch (error) {
        console.error('canMessageEmployee error:', error);
        return { allowed: false, reason: 'Permission check failed' };
    }
};

/**
 * Get list of employees that a user can message
 * @param {string} employeeId - The employee checking their contacts
 * @returns {Promise<{manager: Object|null, subordinates: Array, department: Array, hr: Array, total: number}>}
 */
const getMessageableEmployees = async (employeeId) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true, email: true, department: { select: { name: true } } } },
                subordinates: { select: { id: true, name: true, email: true } }
            }
        });

        if (!employee) return { manager: null, subordinates: [], department: [], hr: [], total: 0 };

        const result = {
            manager: employee.manager || null,
            subordinates: employee.subordinates || [],
            department: [],
            hr: []
        };

        // Get department colleagues
        result.department = await prisma.employee.findMany({
            where: {
                department_id: employee.department_id,
                id: { not: employeeId }
            },
            select: { id: true, name: true, email: true, jobTitle: true }
        });

        // Get HR staff
        result.hr = await prisma.employee.findMany({
            where: {
                department: {
                    name: { contains: 'HR', mode: 'insensitive' }
                },
                id: { not: employeeId }
            },
            select: { id: true, name: true, email: true, jobTitle: true }
        });

        // Calculate total unique contacts
        const contactIds = new Set();
        if (result.manager) contactIds.add(result.manager.id);
        result.subordinates.forEach(s => contactIds.add(s.id));
        result.department.forEach(d => contactIds.add(d.id));
        result.hr.forEach(h => contactIds.add(h.id));

        result.total = contactIds.size;

        return result;
    } catch (error) {
        console.error('getMessageableEmployees error:', error);
        return { manager: null, subordinates: [], department: [], hr: [], total: 0 };
    }
};

/**
 * Find all HR staff members
 * @returns {Promise<Array>}
 */
const findHRStaff = async () => {
    try {
        return await prisma.employee.findMany({
            where: {
                OR: [
                    { department: { name: { contains: 'HR', mode: 'insensitive' } } },
                    { department: { name: { contains: 'Human Resource', mode: 'insensitive' } } }
                ],
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
                role: { select: { name: true } }
            },
            orderBy: [
                { role: { name: 'asc' } },
                { name: 'asc' }
            ]
        });
    } catch (error) {
        console.error('findHRStaff error:', error);
        return [];
    }
};

/**
 * Get escalation chain for an employee
 * Builds chain: employee → manager → manager's manager → ... → HR
 * @param {string} employeeId - Starting employee
 * @returns {Promise<Array>}
 */
const getEscalationChain = async (employeeId) => {
    try {
        const chain = [];
        let currentId = employeeId;
        const visitedIds = new Set();

        // Walk up the management chain (max 10 levels)
        for (let i = 0; i < 10; i++) {
            const employee = await prisma.employee.findUnique({
                where: { id: currentId },
                include: {
                    manager: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: { select: { name: true } },
                            department: { select: { name: true } }
                        }
                    }
                }
            });

            if (!employee?.manager || visitedIds.has(employee.manager.id)) break;

            visitedIds.add(employee.manager.id);
            chain.push({
                level: i + 1,
                ...employee.manager
            });
            currentId = employee.manager.id;
        }

        // Add HR at the end of the chain
        const hrStaff = await findHRStaff();
        if (hrStaff.length > 0) {
            // Find HR manager or first HR member not already in chain
            const hrContact = hrStaff.find(h => !visitedIds.has(h.id));
            if (hrContact) {
                chain.push({
                    level: chain.length + 1,
                    ...hrContact,
                    isHR: true
                });
            }
        }

        return chain;
    } catch (error) {
        console.error('getEscalationChain error:', error);
        return [];
    }
};

/**
 * Find employee by name (partial match)
 * @param {string} name - Name to search
 * @returns {Promise<Array>}
 */
const findEmployeeByName = async (name) => {
    try {
        return await prisma.employee.findMany({
            where: {
                name: { contains: name, mode: 'insensitive' },
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
                department: { select: { name: true } },
                role: { select: { name: true } },
                manager: { select: { name: true } }
            },
            take: 10
        });
    } catch (error) {
        console.error('findEmployeeByName error:', error);
        return [];
    }
};

/**
 * Get employees in a department
 * @param {string} departmentName - Department name (partial match)
 * @returns {Promise<Array>}
 */
const getEmployeesInDepartment = async (departmentName) => {
    try {
        return await prisma.employee.findMany({
            where: {
                department: { name: { contains: departmentName, mode: 'insensitive' } },
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
                role: { select: { name: true } }
            },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('getEmployeesInDepartment error:', error);
        return [];
    }
};

module.exports = {
    canMessageEmployee,
    getMessageableEmployees,
    findHRStaff,
    getEscalationChain,
    findEmployeeByName,
    getEmployeesInDepartment
};
