const prisma = require('../lib/prisma');
const cache = require('../utils/cache');

// Get all employees with pagination and filters
const getEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { department_id, role_id, status, search } = req.query;

        const cacheKey = `employees:${JSON.stringify(req.query)}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            res.set('X-Cache', 'HIT');
            return res.json(cachedData);
        }

        const where = {
            ...(department_id && { department_id }),
            ...(role_id && { role_id }),
            ...(status && { status }),
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } }
                ]
            })
        };

        // Get total count for pagination
        const total = await prisma.employee.count({ where });

        const employees = await prisma.employee.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            include: {
                department: { select: { id: true, name: true } },
                role: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
                _count: { select: { subordinates: true } }
            }
        });

        const response = {
            data: employees,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        cache.set(cacheKey, response, 30);
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

// Get single employee by ID
const getEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true, email: true } },
                subordinates: { select: { id: true, name: true, email: true, status: true } },
                user: { select: { id: true, email: true, avatar_url: true } }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
};

// Create employee
const createEmployee = async (req, res) => {
    try {
        const {
            user_id, name, email, phone,
            department_id, role_id, manager_id,
            hire_date, status
        } = req.body;

        if (!name || !email || !department_id || !role_id) {
            return res.status(400).json({
                error: 'name, email, department_id, and role_id are required'
            });
        }

        const employee = await prisma.employee.create({
            data: {
                ...(user_id && { user_id: parseInt(user_id) }),
                name,
                email,
                phone,
                department_id,
                role_id,
                manager_id: manager_id || null,
                hire_date: hire_date ? new Date(hire_date) : new Date(),
                status: status || 'active'
            },
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } },
                manager: { select: { name: true } }
            }
        });

        cache.delByPrefix('employees');
        res.status(201).json(employee);
    } catch (error) {
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            return res.status(400).json({ error: `${field || 'Field'} already exists` });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid reference: check user_id, department_id, role_id, or manager_id' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
};

// Update employee
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, email, phone,
            department_id, role_id, manager_id,
            hire_date, status
        } = req.body;

        // Prevent self-referencing manager
        if (manager_id === id) {
            return res.status(400).json({ error: 'Employee cannot be their own manager' });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(department_id && { department_id }),
                ...(role_id && { role_id }),
                ...(manager_id !== undefined && { manager_id: manager_id || null }),
                ...(hire_date && { hire_date: new Date(hire_date) }),
                ...(status && { status })
            },
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } },
                manager: { select: { name: true } }
            }
        });

        cache.delByPrefix('employees');
        res.json(employee);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Employee not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if employee has subordinates
        const subordinateCount = await prisma.employee.count({
            where: { manager_id: id }
        });

        if (subordinateCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete employee with subordinates. Reassign subordinates first.'
            });
        }

        await prisma.employee.delete({ where: { id } });

        cache.delByPrefix('employees');
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Employee not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};

// Get employee hierarchy (org chart)
const getHierarchy = async (req, res) => {
    try {
        const { department_id } = req.query;

        // Get top-level employees (no manager)
        const where = {
            manager_id: null,
            ...(department_id && { department_id })
        };

        const topLevel = await prisma.employee.findMany({
            where,
            include: {
                department: { select: { name: true } },
                role: { select: { name: true } },
                subordinates: {
                    include: {
                        role: { select: { name: true } },
                        subordinates: {
                            include: {
                                role: { select: { name: true } },
                                subordinates: {
                                    select: { id: true, name: true, email: true, status: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.json(topLevel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch hierarchy' });
    }
};

// Get my profile (current user's employee profile)
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const employee = await prisma.employee.findUnique({
            where: { user_id: userId },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true, email: true } },
                subordinates: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee profile not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Get full employee profile with all related data
const getFullProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Get employee with all relations
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                role: true,
                manager: { select: { id: true, name: true, email: true } },
                subordinates: { select: { id: true, name: true, email: true, status: true } },
                user: { select: { id: true, email: true, avatar_url: true } }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Get documents
        const documents = await prisma.employeeDocument.findMany({
            where: { employee_id: id },
            orderBy: { created_at: 'desc' }
        });

        // Get skills
        const skills = await prisma.employeeSkill.findMany({
            where: { employee_id: id },
            orderBy: [{ category: 'asc' }, { proficiency: 'desc' }]
        });

        // Get role history
        const roleHistory = await prisma.employeeRoleHistory.findMany({
            where: { employee_id: id },
            orderBy: { effectiveDate: 'desc' }
        });

        // Get status history
        const statusHistory = await prisma.employeeStatusHistory.findMany({
            where: { employee_id: id },
            orderBy: { effectiveDate: 'desc' }
        });

        // Get performance reviews
        const reviews = await prisma.performanceReview.findMany({
            where: { employee_id: id },
            orderBy: { reviewDate: 'desc' },
            take: 5
        });

        // Get goals
        const goals = await prisma.goal.findMany({
            where: {
                ownerType: 'employee',
                ownerId: id
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Get achievements
        const achievements = await prisma.achievement.findMany({
            where: { employeeId: id },
            orderBy: { earnedAt: 'desc' },
            take: 10
        });

        // Get gamification points
        const points = await prisma.employeePoints.findUnique({
            where: { employeeId: id }
        });

        // Calculate stats
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Task count (using Messages as proxy for activity or custom calculation)
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                employee_id: id,
                date: { gte: thirtyDaysAgo }
            }
        });

        const presentDays = attendanceRecords.filter(a =>
            a.status === 'present' || a.status === 'late'
        ).length;
        const workingDays = attendanceRecords.length || 1;
        const attendanceRate = Math.round((presentDays / workingDays) * 100);

        const completedGoals = goals.filter(g => g.status === 'completed').length;

        res.json({
            employee,
            documents,
            skills,
            history: {
                roles: roleHistory,
                statuses: statusHistory
            },
            performance: {
                reviews,
                goals,
                achievements
            },
            stats: {
                tasksCompleted: 0, // Would need task tracking per employee
                goalsAchieved: `${completedGoals}/${goals.length}`,
                attendanceRate,
                currentStreak: points?.currentStreak || 0,
                totalPoints: points?.totalPoints || 0,
                level: points?.level || 1
            }
        });
    } catch (error) {
        console.error('Error fetching full profile:', error);
        res.status(500).json({ error: 'Failed to fetch employee profile' });
    }
};

// Get employee documents
const getEmployeeDocuments = async (req, res) => {
    try {
        const { id } = req.params;

        const documents = await prisma.employeeDocument.findMany({
            where: { employee_id: id },
            orderBy: { created_at: 'desc' }
        });

        res.json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// Add employee document
const addEmployeeDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType, title, fileUrl, fileName, fileSize, mimeType, expiryDate } = req.body;

        if (!documentType || !title) {
            return res.status(400).json({ error: 'documentType and title are required' });
        }

        const document = await prisma.employeeDocument.create({
            data: {
                employee_id: id,
                documentType,
                title,
                fileUrl: fileUrl || '',
                fileName: fileName || title,
                fileSize: fileSize ? parseInt(fileSize) : null,
                mimeType,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                status: 'active'
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add document' });
    }
};

// Get employee skills
const getEmployeeSkills = async (req, res) => {
    try {
        const { id } = req.params;

        const skills = await prisma.employeeSkill.findMany({
            where: { employee_id: id },
            orderBy: [{ category: 'asc' }, { proficiency: 'desc' }]
        });

        res.json(skills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
};

// Add employee skill
const addEmployeeSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { skillName, category, proficiency, yearsOfExp } = req.body;

        if (!skillName) {
            return res.status(400).json({ error: 'skillName is required' });
        }

        // Check for duplicate skill
        const existing = await prisma.employeeSkill.findFirst({
            where: {
                employee_id: id,
                skillName: skillName
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Skill already exists for this employee' });
        }

        const skill = await prisma.employeeSkill.create({
            data: {
                employee_id: id,
                skillName,
                category: category || 'technical',
                proficiency: proficiency || 'intermediate',
                yearsOfExp: yearsOfExp ? parseFloat(yearsOfExp) : null,
                source: 'manual'
            }
        });

        res.status(201).json(skill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add skill' });
    }
};

// Delete employee skill
const deleteEmployeeSkill = async (req, res) => {
    try {
        const { id, skillId } = req.params;

        await prisma.employeeSkill.delete({
            where: { id: skillId }
        });

        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Skill not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
};

// Get employee history (roles and status changes)
const getEmployeeHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const [roleHistory, statusHistory] = await Promise.all([
            prisma.employeeRoleHistory.findMany({
                where: { employee_id: id },
                orderBy: { effectiveDate: 'desc' }
            }),
            prisma.employeeStatusHistory.findMany({
                where: { employee_id: id },
                orderBy: { effectiveDate: 'desc' }
            })
        ]);

        res.json({
            roles: roleHistory,
            statuses: statusHistory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getHierarchy,
    getMyProfile,
    getFullProfile,
    getEmployeeDocuments,
    addEmployeeDocument,
    getEmployeeSkills,
    addEmployeeSkill,
    deleteEmployeeSkill,
    getEmployeeHistory
};
