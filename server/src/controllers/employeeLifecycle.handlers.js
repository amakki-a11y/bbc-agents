/**
 * Employee Lifecycle Handlers
 * Handles bot tool calls for CV parsing, onboarding, probation, performance analysis
 */

const prisma = require('../lib/prisma');

// Import services
const { parseCV, generateEmployeeProfileSummary } = require('../services/cvParserService');
const {
    analyzeProbationProgress,
    createProbationReview,
    analyzePerformance,
    analyzeAttritionRisk,
    searchEmployees,
    getEmployeesNeedingAttention,
    getDepartmentAnalytics
} = require('../services/employeeAnalyticsService');

// ============================================
// HELPER: Find employee by name
// ============================================
const findEmployeeByName = async (name) => {
    if (!name) return null;
    return await prisma.employee.findFirst({
        where: {
            name: { contains: name, mode: 'insensitive' }
        },
        include: {
            department: true,
            role: true,
            skills: true,
            education: true,
            experience: true
        }
    });
};

// ============================================
// CV PARSING & ONBOARDING HANDLERS
// ============================================

/**
 * Parse CV for an employee
 */
const handleParseEmployeeCV = async ({ employee_name, cv_text }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const result = await parseCV(cv_text, employee.id);

        if (result.success) {
            const data = result.data;
            const skillCount = data.skills?.length || 0;
            const eduCount = data.education?.length || 0;
            const expCount = data.experience?.length || 0;

            return {
                success: true,
                message: `✅ CV parsed for ${employee.name}: ${skillCount} skills, ${eduCount} education records, ${expCount} work experiences extracted`,
                data: {
                    skills: skillCount,
                    education: eduCount,
                    experience: expCount,
                    highestDegree: data.highestEducation,
                    totalYearsExp: data.totalYearsOfExperience
                }
            };
        }

        return result;
    } catch (error) {
        console.error('handleParseEmployeeCV error:', error);
        return { success: false, error: 'Failed to parse CV' };
    }
};

/**
 * Get onboarding status for employees
 */
const handleGetOnboardingStatus = async ({ employee_name }) => {
    try {
        const where = {
            onboardingStatus: { in: ['not_started', 'in_progress'] }
        };

        if (employee_name) {
            const employee = await findEmployeeByName(employee_name);
            if (!employee) {
                return { success: false, error: `Employee "${employee_name}" not found` };
            }

            return {
                success: true,
                employee: {
                    name: employee.name,
                    department: employee.department?.name,
                    status: employee.onboardingStatus,
                    progress: employee.onboardingProgress,
                    cvParsed: !!employee.cvParsedAt,
                    hireDate: employee.hire_date
                },
                message: `📋 ${employee.name}: ${employee.onboardingProgress}% complete, ${employee.onboardingStatus.replace('_', ' ')}`
            };
        }

        const newHires = await prisma.employee.findMany({
            where,
            include: { department: true },
            orderBy: { hire_date: 'desc' },
            take: 10
        });

        if (newHires.length === 0) {
            return {
                success: true,
                count: 0,
                message: '✅ No pending onboarding. All employees are onboarded.'
            };
        }

        const list = newHires.map(e => ({
            name: e.name,
            department: e.department?.name,
            progress: e.onboardingProgress,
            status: e.onboardingStatus
        }));

        const summary = newHires.slice(0, 3)
            .map(e => `${e.name} (${e.onboardingProgress}%)`)
            .join(', ');

        return {
            success: true,
            count: newHires.length,
            employees: list,
            message: `📋 ${newHires.length} in onboarding: ${summary}${newHires.length > 3 ? ` +${newHires.length - 3} more` : ''}`
        };
    } catch (error) {
        console.error('handleGetOnboardingStatus error:', error);
        return { success: false, error: 'Failed to get onboarding status' };
    }
};

/**
 * Update onboarding progress
 */
const handleUpdateOnboardingProgress = async ({ employee_name, progress, status }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const updateData = {};
        if (progress !== undefined) {
            updateData.onboardingProgress = Math.min(100, Math.max(0, progress));
            if (progress >= 100) {
                updateData.onboardingStatus = 'completed';
                updateData.onboardingCompletedAt = new Date();
            }
        }
        if (status) {
            updateData.onboardingStatus = status;
            if (status === 'completed') {
                updateData.onboardingProgress = 100;
                updateData.onboardingCompletedAt = new Date();
            }
        }

        await prisma.employee.update({
            where: { id: employee.id },
            data: updateData
        });

        const statusMsg = updateData.onboardingStatus === 'completed' ? 'completed' : `${updateData.onboardingProgress || employee.onboardingProgress}%`;
        return {
            success: true,
            message: `✅ ${employee.name} onboarding updated to ${statusMsg}`
        };
    } catch (error) {
        console.error('handleUpdateOnboardingProgress error:', error);
        return { success: false, error: 'Failed to update onboarding progress' };
    }
};

/**
 * Get comprehensive employee profile
 */
const handleGetEmployeeProfile = async ({ employee_name }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        // Generate AI summary if not available
        if (!employee.aiProfileSummary) {
            await generateEmployeeProfileSummary(employee.id);
        }

        const skillsList = employee.skills.slice(0, 5).map(s => s.skillName).join(', ');
        const tenure = Math.floor((new Date() - employee.hire_date) / (365 * 24 * 60 * 60 * 1000));

        return {
            success: true,
            profile: {
                name: employee.name,
                jobTitle: employee.jobTitle || employee.role?.name,
                department: employee.department?.name,
                email: employee.email,
                tenure: `${tenure} years`,
                status: employee.status,
                probationStatus: employee.probationStatus,
                skills: employee.skills.map(s => ({ name: s.skillName, level: s.proficiency })),
                education: employee.education.map(e => ({ degree: e.degree, field: e.fieldOfStudy, institution: e.institution })),
                experience: employee.experience.map(e => ({ company: e.companyName, title: e.jobTitle })),
                performanceScore: employee.performanceScore,
                attritionRisk: employee.attritionRisk
            },
            message: `📋 ${employee.name}: ${employee.jobTitle || employee.role?.name}, ${employee.department?.name}. Skills: ${skillsList || 'Not recorded'}. ${tenure} yrs tenure`
        };
    } catch (error) {
        console.error('handleGetEmployeeProfile error:', error);
        return { success: false, error: 'Failed to get employee profile' };
    }
};

// ============================================
// PROBATION HANDLERS
// ============================================

/**
 * Get probation status
 */
const handleGetProbationStatus = async ({ employee_name }) => {
    try {
        if (employee_name) {
            const employee = await findEmployeeByName(employee_name);
            if (!employee) {
                return { success: false, error: `Employee "${employee_name}" not found` };
            }

            const result = await analyzeProbationProgress(employee.id);
            if (!result.success) return result;

            const analysis = result.analysis;
            return {
                success: true,
                analysis,
                message: `📊 ${employee.name} probation: ${analysis.timeline.progressPercent}% complete (${analysis.timeline.daysRemaining} days left). Status: ${analysis.aiAnalysis?.overallAssessment || 'pending review'}`
            };
        }

        // Get all on probation
        const onProbation = await prisma.employee.findMany({
            where: {
                probationStatus: { in: ['pending', 'in_progress'] }
            },
            include: { department: true },
            orderBy: { probationEndDate: 'asc' }
        });

        if (onProbation.length === 0) {
            return {
                success: true,
                count: 0,
                message: '✅ No employees currently on probation'
            };
        }

        const list = onProbation.map(e => {
            const daysRemaining = e.probationEndDate
                ? Math.ceil((new Date(e.probationEndDate) - new Date()) / (1000 * 60 * 60 * 24))
                : 'N/A';
            return {
                name: e.name,
                department: e.department?.name,
                status: e.probationStatus,
                daysRemaining
            };
        });

        const summary = onProbation.slice(0, 3)
            .map(e => {
                const days = e.probationEndDate
                    ? Math.ceil((new Date(e.probationEndDate) - new Date()) / (1000 * 60 * 60 * 24))
                    : '?';
                return `${e.name} (${days}d left)`;
            })
            .join(', ');

        return {
            success: true,
            count: onProbation.length,
            employees: list,
            message: `📊 ${onProbation.length} on probation: ${summary}${onProbation.length > 3 ? ` +${onProbation.length - 3} more` : ''}`
        };
    } catch (error) {
        console.error('handleGetProbationStatus error:', error);
        return { success: false, error: 'Failed to get probation status' };
    }
};

/**
 * Create probation review
 */
const handleCreateProbationReview = async (reviewerEmployeeId, {
    employee_name,
    performance_rating,
    attendance_rating,
    attitude_rating,
    learning_rating,
    teamwork_rating,
    strengths,
    improvements,
    concerns
}) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const result = await createProbationReview(employee.id, {
            performanceRating: performance_rating,
            attendanceRating: attendance_rating,
            attitudeRating: attitude_rating,
            learningRating: learning_rating,
            teamworkRating: teamwork_rating,
            strengths,
            improvements,
            concerns,
            conductedBy: reviewerEmployeeId
        });

        if (!result.success) return result;

        return {
            success: true,
            review: result.review,
            message: `✅ Probation review created for ${employee.name}. Overall: ${result.review.overallRating}/5, Outcome: ${result.outcome}, AI recommendation: ${result.aiRecommendation}`
        };
    } catch (error) {
        console.error('handleCreateProbationReview error:', error);
        return { success: false, error: 'Failed to create probation review' };
    }
};

/**
 * Get probation alerts
 */
const handleGetProbationAlerts = async () => {
    try {
        const result = await getEmployeesNeedingAttention();
        if (!result.success) return result;

        const alerts = result.alerts;
        const total = alerts.probationEnding.count + alerts.probationReviewsOverdue.count;

        if (total === 0) {
            return {
                success: true,
                message: '✅ No probation alerts. All reviews are up to date.'
            };
        }

        let message = `🚨 Probation alerts: `;
        const parts = [];
        if (alerts.probationEnding.count > 0) {
            parts.push(`${alerts.probationEnding.count} ending soon`);
        }
        if (alerts.probationReviewsOverdue.count > 0) {
            parts.push(`${alerts.probationReviewsOverdue.count} overdue reviews`);
        }

        return {
            success: true,
            alerts: {
                endingSoon: alerts.probationEnding.employees,
                overdueReviews: alerts.probationReviewsOverdue.employees
            },
            message: message + parts.join(', ')
        };
    } catch (error) {
        console.error('handleGetProbationAlerts error:', error);
        return { success: false, error: 'Failed to get probation alerts' };
    }
};

/**
 * Extend probation
 */
const handleExtendProbation = async ({ employee_name, weeks, reason }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const currentEnd = employee.probationEndDate || new Date();
        const newEnd = new Date(currentEnd.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);

        await prisma.employee.update({
            where: { id: employee.id },
            data: {
                probationEndDate: newEnd,
                probationExtended: true,
                probationExtensions: { increment: 1 },
                probationStatus: 'extended',
                probationNotes: reason ? `Extended: ${reason}` : null
            }
        });

        // Record status change
        await prisma.employeeStatusHistory.create({
            data: {
                employee_id: employee.id,
                fromStatus: employee.probationStatus,
                toStatus: 'extended',
                reason: reason || `Extended by ${weeks} weeks`,
                effectiveDate: new Date()
            }
        });

        return {
            success: true,
            message: `✅ ${employee.name}'s probation extended by ${weeks} weeks to ${newEnd.toLocaleDateString()}`
        };
    } catch (error) {
        console.error('handleExtendProbation error:', error);
        return { success: false, error: 'Failed to extend probation' };
    }
};

/**
 * Complete probation (pass/fail)
 */
const handleCompleteProbation = async ({ employee_name, outcome, notes }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const newStatus = outcome === 'passed' ? 'active' : 'terminated';
        const probationStatus = outcome === 'passed' ? 'passed' : 'failed';

        await prisma.employee.update({
            where: { id: employee.id },
            data: {
                probationStatus,
                status: newStatus,
                probationNotes: notes
            }
        });

        // Record status change
        await prisma.employeeStatusHistory.create({
            data: {
                employee_id: employee.id,
                fromStatus: employee.status,
                toStatus: newStatus,
                reason: `Probation ${outcome}: ${notes || ''}`,
                effectiveDate: new Date()
            }
        });

        const emoji = outcome === 'passed' ? '🎉' : '⚠️';
        return {
            success: true,
            message: `${emoji} ${employee.name} probation ${outcome}. Status updated to ${newStatus}.`
        };
    } catch (error) {
        console.error('handleCompleteProbation error:', error);
        return { success: false, error: 'Failed to complete probation' };
    }
};

// ============================================
// PERFORMANCE & ANALYTICS HANDLERS
// ============================================

/**
 * Analyze employee performance
 */
const handleAnalyzeEmployeePerformance = async ({ employee_name }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const result = await analyzePerformance(employee.id);
        if (!result.success) return result;

        const analysis = result.analysis;
        const ai = analysis.aiAnalysis;

        return {
            success: true,
            analysis,
            message: `📊 ${employee.name} performance: ${ai?.overallPerformance || 'N/A'} (${ai?.performanceScore || 'N/A'}/100). Trend: ${ai?.trend || 'stable'}. ${ai?.promotionReadiness === 'ready' ? '🌟 Ready for promotion' : ''}`
        };
    } catch (error) {
        console.error('handleAnalyzeEmployeePerformance error:', error);
        return { success: false, error: 'Failed to analyze performance' };
    }
};

/**
 * Get attrition risk
 */
const handleGetAttritionRisk = async ({ employee_name }) => {
    try {
        if (employee_name) {
            const employee = await findEmployeeByName(employee_name);
            if (!employee) {
                return { success: false, error: `Employee "${employee_name}" not found` };
            }

            const result = await analyzeAttritionRisk(employee.id);
            if (!result.success) return result;

            const risk = result.analysis.risk;
            const emoji = risk.level === 'critical' ? '🚨' : risk.level === 'high' ? '⚠️' : risk.level === 'medium' ? '⚡' : '✅';

            return {
                success: true,
                analysis: result.analysis,
                message: `${emoji} ${employee.name} attrition risk: ${risk.level.toUpperCase()} (${risk.score}/100). Factors: ${risk.factors.slice(0, 2).join(', ') || 'None identified'}`
            };
        }

        // Get all high-risk employees
        const highRisk = await prisma.employee.findMany({
            where: {
                attritionRisk: { in: ['high', 'critical'] },
                status: 'active'
            },
            include: { department: true },
            take: 10
        });

        if (highRisk.length === 0) {
            return {
                success: true,
                count: 0,
                message: '✅ No high attrition risk employees identified'
            };
        }

        const summary = highRisk.slice(0, 3)
            .map(e => `${e.name} (${e.attritionRisk})`)
            .join(', ');

        return {
            success: true,
            count: highRisk.length,
            employees: highRisk.map(e => ({
                name: e.name,
                department: e.department?.name,
                risk: e.attritionRisk
            })),
            message: `⚠️ ${highRisk.length} flight risks: ${summary}${highRisk.length > 3 ? ` +${highRisk.length - 3} more` : ''}`
        };
    } catch (error) {
        console.error('handleGetAttritionRisk error:', error);
        return { success: false, error: 'Failed to analyze attrition risk' };
    }
};

// ============================================
// SEARCH & DISCOVERY HANDLERS
// ============================================

/**
 * Search employees
 */
const handleSearchEmployees = async ({ query, skills, department, status }) => {
    try {
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : null;

        const result = await searchEmployees({
            query,
            skills: skillsArray,
            department,
            status
        });

        if (!result.success) return result;

        if (result.count === 0) {
            return {
                success: true,
                count: 0,
                message: '🔍 No employees found matching criteria'
            };
        }

        const summary = result.employees.slice(0, 3)
            .map(e => e.name)
            .join(', ');

        return {
            success: true,
            count: result.count,
            employees: result.employees,
            message: `🔍 Found ${result.count}: ${summary}${result.count > 3 ? ` +${result.count - 3} more` : ''}`
        };
    } catch (error) {
        console.error('handleSearchEmployees error:', error);
        return { success: false, error: 'Failed to search employees' };
    }
};

/**
 * Get employees needing attention
 */
const handleGetEmployeesNeedingAttention = async () => {
    try {
        const result = await getEmployeesNeedingAttention();
        if (!result.success) return result;

        const alerts = result.alerts;
        const total = result.totalAlerts;

        if (total === 0) {
            return {
                success: true,
                message: '✅ No employees need attention. All clear!'
            };
        }

        const parts = [];
        if (alerts.probationEnding.count > 0) parts.push(`${alerts.probationEnding.count} probation ending`);
        if (alerts.highAttritionRisk.count > 0) parts.push(`${alerts.highAttritionRisk.count} high risk`);
        if (alerts.probationReviewsOverdue.count > 0) parts.push(`${alerts.probationReviewsOverdue.count} overdue reviews`);
        if (alerts.performanceReviewsDue.count > 0) parts.push(`${alerts.performanceReviewsDue.count} perf reviews due`);

        return {
            success: true,
            alerts,
            totalAlerts: total,
            message: `🚨 ${total} need attention: ${parts.join(', ')}`
        };
    } catch (error) {
        console.error('handleGetEmployeesNeedingAttention error:', error);
        return { success: false, error: 'Failed to get attention alerts' };
    }
};

/**
 * Get department analytics
 */
const handleGetDepartmentAnalytics = async ({ department_name }) => {
    try {
        let departmentId = null;
        if (department_name) {
            const dept = await prisma.department.findFirst({
                where: { name: { contains: department_name, mode: 'insensitive' } }
            });
            if (dept) departmentId = dept.id;
        }

        const result = await getDepartmentAnalytics(departmentId);
        if (!result.success) return result;

        const analytics = result.departmentAnalytics;
        const summary = analytics.slice(0, 3)
            .map(d => `${d.department}: ${d.headcount} staff, ${d.avgPerformanceScore || 'N/A'} perf`)
            .join(' | ');

        return {
            success: true,
            totalEmployees: result.totalEmployees,
            analytics,
            message: `📊 ${summary}`
        };
    } catch (error) {
        console.error('handleGetDepartmentAnalytics error:', error);
        return { success: false, error: 'Failed to get department analytics' };
    }
};

// ============================================
// SKILLS HANDLERS
// ============================================

/**
 * Get employee skills or find by skill
 */
const handleGetEmployeeSkills = async ({ employee_name, skill_name }) => {
    try {
        if (employee_name) {
            const employee = await findEmployeeByName(employee_name);
            if (!employee) {
                return { success: false, error: `Employee "${employee_name}" not found` };
            }

            const skills = await prisma.employeeSkill.findMany({
                where: { employee_id: employee.id },
                orderBy: { proficiency: 'desc' }
            });

            if (skills.length === 0) {
                return {
                    success: true,
                    message: `📋 ${employee.name} has no recorded skills`
                };
            }

            const skillsList = skills.slice(0, 5)
                .map(s => `${s.skillName} (${s.proficiency})`)
                .join(', ');

            return {
                success: true,
                skills,
                message: `📋 ${employee.name}'s skills: ${skillsList}${skills.length > 5 ? ` +${skills.length - 5} more` : ''}`
            };
        }

        if (skill_name) {
            const employeesWithSkill = await prisma.employeeSkill.findMany({
                where: {
                    skillName: { contains: skill_name, mode: 'insensitive' }
                },
                include: {
                    employee: { select: { name: true, department: { select: { name: true } } } }
                },
                orderBy: { proficiency: 'desc' }
            });

            if (employeesWithSkill.length === 0) {
                return {
                    success: true,
                    message: `🔍 No employees found with skill "${skill_name}"`
                };
            }

            const list = employeesWithSkill.slice(0, 5)
                .map(s => `${s.employee.name} (${s.proficiency})`)
                .join(', ');

            return {
                success: true,
                count: employeesWithSkill.length,
                employees: employeesWithSkill.map(s => ({
                    name: s.employee.name,
                    department: s.employee.department?.name,
                    proficiency: s.proficiency
                })),
                message: `🔍 ${employeesWithSkill.length} with ${skill_name}: ${list}`
            };
        }

        return { success: false, error: 'Please specify employee_name or skill_name' };
    } catch (error) {
        console.error('handleGetEmployeeSkills error:', error);
        return { success: false, error: 'Failed to get skills' };
    }
};

/**
 * Add skill to employee
 */
const handleAddEmployeeSkill = async ({ employee_name, skill_name, category, proficiency }) => {
    try {
        const employee = await findEmployeeByName(employee_name);
        if (!employee) {
            return { success: false, error: `Employee "${employee_name}" not found` };
        }

        const skill = await prisma.employeeSkill.upsert({
            where: {
                employee_id_skillName: {
                    employee_id: employee.id,
                    skillName: skill_name
                }
            },
            update: {
                proficiency: proficiency || 'intermediate',
                category: category || 'technical'
            },
            create: {
                employee_id: employee.id,
                skillName: skill_name,
                category: category || 'technical',
                proficiency: proficiency || 'intermediate',
                source: 'manual'
            }
        });

        return {
            success: true,
            message: `✅ Added ${skill_name} (${skill.proficiency}) to ${employee.name}'s profile`
        };
    } catch (error) {
        console.error('handleAddEmployeeSkill error:', error);
        return { success: false, error: 'Failed to add skill' };
    }
};

module.exports = {
    handleParseEmployeeCV,
    handleGetOnboardingStatus,
    handleUpdateOnboardingProgress,
    handleGetEmployeeProfile,
    handleGetProbationStatus,
    handleCreateProbationReview,
    handleGetProbationAlerts,
    handleExtendProbation,
    handleCompleteProbation,
    handleAnalyzeEmployeePerformance,
    handleGetAttritionRisk,
    handleSearchEmployees,
    handleGetEmployeesNeedingAttention,
    handleGetDepartmentAnalytics,
    handleGetEmployeeSkills,
    handleAddEmployeeSkill
};
