/**
 * Employee Analytics Service
 * AI-powered analysis for probation, performance, attrition risk, and engagement
 */

const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const anthropic = new Anthropic();

// ============================================
// PROBATION ANALYSIS
// ============================================

/**
 * Analyze employee's probation progress and generate AI recommendations
 * @param {string} employeeId - Employee ID
 * @returns {Object} Probation analysis with recommendations
 */
async function analyzeProbationProgress(employeeId) {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                probationReviews: {
                    orderBy: { reviewDate: 'desc' }
                },
                attendances: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                        }
                    }
                },
                leaves: {
                    where: { status: 'approved' }
                },
                department: true,
                role: true,
                manager: true
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Calculate metrics
        const totalWorkDays = 90; // Approximate working days in probation
        const presentDays = employee.attendances.filter(a => a.status === 'present').length;
        const lateDays = employee.attendances.filter(a => a.status === 'late').length;
        const absentDays = employee.attendances.filter(a => a.status === 'absent').length;
        const attendanceRate = Math.round((presentDays / Math.max(employee.attendances.length, 1)) * 100);

        const reviews = employee.probationReviews;
        const latestReview = reviews[0];
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length
            : null;

        // Days into probation
        const probationStartDate = employee.hire_date || employee.startDate || employee.created_at;
        const daysIntoProbation = Math.floor((new Date() - probationStartDate) / (1000 * 60 * 60 * 24));
        const probationEndDate = employee.probationEndDate || new Date(probationStartDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.max(0, Math.floor((probationEndDate - new Date()) / (1000 * 60 * 60 * 24)));

        // Prepare data for AI analysis
        const analysisData = {
            employeeName: employee.name,
            jobTitle: employee.jobTitle || employee.role?.name,
            department: employee.department?.name,
            daysIntoProbation,
            daysRemaining,
            attendanceMetrics: {
                rate: attendanceRate,
                presentDays,
                lateDays,
                absentDays
            },
            reviews: reviews.map(r => ({
                week: r.reviewWeek,
                type: r.reviewType,
                overallRating: r.overallRating,
                strengths: r.strengths,
                improvements: r.improvements,
                concerns: r.concerns,
                outcome: r.outcome
            })),
            averageRating: avgRating,
            probationExtended: employee.probationExtended,
            extensions: employee.probationExtensions
        };

        // Generate AI analysis
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `You are an HR analytics expert analyzing employee probation progress.
Based on the data provided, generate a comprehensive analysis with:
1. Overall assessment (on_track, needs_attention, at_risk, or critical)
2. Key observations (2-3 bullet points)
3. Risk factors identified (if any)
4. Specific recommendations for the remaining probation period
5. Prediction for probation outcome (likely_pass, uncertain, likely_fail)

Return as JSON:
{
    "overallAssessment": "on_track|needs_attention|at_risk|critical",
    "assessmentScore": 0-100,
    "keyObservations": ["observation1", "observation2"],
    "riskFactors": ["risk1", "risk2"],
    "recommendations": ["rec1", "rec2"],
    "predictedOutcome": "likely_pass|uncertain|likely_fail",
    "confidenceLevel": 0-100,
    "nextActions": ["action1", "action2"],
    "summary": "Brief 2-3 sentence summary"
}`,
            messages: [{
                role: 'user',
                content: `Analyze this employee's probation progress:\n${JSON.stringify(analysisData, null, 2)}`
            }]
        });

        const aiContent = response.content[0]?.text || '';
        let aiAnalysis;

        try {
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            aiAnalysis = { summary: aiContent };
        }

        // Update employee with analysis
        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                probationNotes: aiAnalysis?.summary || aiContent,
                lastAnalyzedAt: new Date()
            }
        });

        return {
            success: true,
            analysis: {
                employee: {
                    name: employee.name,
                    jobTitle: employee.jobTitle || employee.role?.name,
                    department: employee.department?.name,
                    probationStatus: employee.probationStatus
                },
                timeline: {
                    startDate: probationStartDate,
                    endDate: probationEndDate,
                    daysIntoProbation,
                    daysRemaining,
                    progressPercent: Math.round((daysIntoProbation / 90) * 100)
                },
                metrics: {
                    attendanceRate,
                    reviewsCompleted: reviews.length,
                    averageRating: avgRating ? avgRating.toFixed(1) : 'N/A',
                    latestReviewOutcome: latestReview?.outcome || 'No reviews yet'
                },
                aiAnalysis,
                analyzedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Probation analysis error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a probation review record
 * @param {string} employeeId - Employee ID
 * @param {Object} reviewData - Review data
 * @returns {Object} Created review
 */
async function createProbationReview(employeeId, reviewData) {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { probationReviews: true }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Calculate review week
        const startDate = employee.hire_date || employee.created_at;
        const weekNumber = Math.ceil((new Date() - startDate) / (7 * 24 * 60 * 60 * 1000));

        // Determine review type based on timing
        let reviewType = 'weekly_checkin';
        if (weekNumber >= 12) reviewType = 'final_review';
        else if (weekNumber >= 6) reviewType = 'mid_probation';
        else if (weekNumber % 4 === 0) reviewType = 'monthly_review';

        // Calculate overall rating
        const ratings = [
            reviewData.performanceRating,
            reviewData.attendanceRating,
            reviewData.attitudeRating,
            reviewData.learningRating,
            reviewData.teamworkRating
        ].filter(r => r != null);

        const overallRating = ratings.length > 0
            ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
            : null;

        // Determine outcome based on ratings
        let outcome = 'on_track';
        if (overallRating) {
            if (overallRating >= 4) outcome = 'on_track';
            else if (overallRating >= 3) outcome = 'needs_improvement';
            else outcome = 'at_risk';
        }

        // Generate AI analysis for the review
        const aiResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: `Analyze this probation review data and provide a brief recommendation:
Week ${weekNumber}, Ratings: Performance=${reviewData.performanceRating}, Attendance=${reviewData.attendanceRating},
Attitude=${reviewData.attitudeRating}, Learning=${reviewData.learningRating}, Teamwork=${reviewData.teamworkRating}
Strengths: ${reviewData.strengths || 'Not specified'}
Areas for Improvement: ${reviewData.improvements || 'Not specified'}
Concerns: ${reviewData.concerns || 'None noted'}

Respond with JSON: {"recommendation": "pass|extend|fail|monitor", "reasoning": "brief explanation"}`
            }]
        });

        let aiRecommendation = 'monitor';
        let aiAnalysis = '';
        try {
            const aiContent = aiResponse.content[0]?.text || '';
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                aiRecommendation = parsed.recommendation;
                aiAnalysis = parsed.reasoning;
            }
        } catch {}

        const review = await prisma.probationReview.create({
            data: {
                employee_id: employeeId,
                reviewDate: new Date(),
                reviewWeek: weekNumber,
                reviewType,
                performanceRating: reviewData.performanceRating,
                attendanceRating: reviewData.attendanceRating,
                attitudeRating: reviewData.attitudeRating,
                learningRating: reviewData.learningRating,
                teamworkRating: reviewData.teamworkRating,
                overallRating,
                strengths: reviewData.strengths,
                improvements: reviewData.improvements,
                concerns: reviewData.concerns,
                managerNotes: reviewData.managerNotes,
                employeeFeedback: reviewData.employeeFeedback,
                aiAnalysis,
                aiRecommendation,
                outcome,
                conductedBy: reviewData.conductedBy
            }
        });

        // Update employee probation status if needed
        if (outcome === 'at_risk' || outcome === 'needs_improvement') {
            await prisma.employee.update({
                where: { id: employeeId },
                data: { probationStatus: 'in_progress' }
            });
        }

        return {
            success: true,
            review,
            aiRecommendation,
            outcome
        };

    } catch (error) {
        console.error('Create probation review error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PERFORMANCE ANALYSIS
// ============================================

/**
 * Analyze employee performance and generate insights
 * @param {string} employeeId - Employee ID
 * @returns {Object} Performance analysis
 */
async function analyzePerformance(employeeId) {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                performanceReviews: {
                    orderBy: { reviewDate: 'desc' },
                    take: 4
                },
                attendances: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                        }
                    }
                },
                achievements: {
                    orderBy: { earnedAt: 'desc' },
                    take: 10
                },
                points: true,
                department: true,
                role: true,
                createdGoals: {
                    where: { status: { in: ['active', 'completed'] } }
                }
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Calculate metrics
        const attendanceRate = employee.attendances.length > 0
            ? Math.round((employee.attendances.filter(a => a.status === 'present').length / employee.attendances.length) * 100)
            : 100;

        const completedGoals = employee.createdGoals.filter(g => g.status === 'completed').length;
        const totalGoals = employee.createdGoals.length;
        const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        const latestReview = employee.performanceReviews[0];
        const reviewTrend = employee.performanceReviews.length >= 2
            ? employee.performanceReviews[0].overallRating - employee.performanceReviews[1].overallRating
            : 0;

        // Prepare data for AI
        const analysisData = {
            employee: {
                name: employee.name,
                tenure: Math.floor((new Date() - employee.hire_date) / (365 * 24 * 60 * 60 * 1000)),
                department: employee.department?.name,
                role: employee.role?.name
            },
            metrics: {
                attendanceRate,
                goalCompletionRate,
                achievementsCount: employee.achievements.length,
                totalPoints: employee.points?.totalPoints || 0,
                currentStreak: employee.points?.currentStreak || 0
            },
            reviews: employee.performanceReviews.map(r => ({
                period: r.reviewPeriod,
                overallRating: r.overallRating,
                strengths: r.strengths,
                improvements: r.improvements
            })),
            currentScores: {
                performance: employee.performanceScore,
                communication: employee.communicationScore,
                teamwork: employee.teamScore,
                leadership: employee.leadershipScore
            }
        };

        // Generate AI analysis
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `You are an HR performance analyst. Analyze the employee data and provide insights.
Return JSON:
{
    "overallPerformance": "exceptional|strong|satisfactory|needs_improvement|underperforming",
    "performanceScore": 0-100,
    "trend": "improving|stable|declining",
    "keyStrengths": ["strength1", "strength2"],
    "developmentAreas": ["area1", "area2"],
    "recommendations": ["rec1", "rec2"],
    "promotionReadiness": "ready|developing|not_ready",
    "summary": "2-3 sentence summary"
}`,
            messages: [{
                role: 'user',
                content: `Analyze this employee's performance:\n${JSON.stringify(analysisData, null, 2)}`
            }]
        });

        const aiContent = response.content[0]?.text || '';
        let aiAnalysis;

        try {
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            aiAnalysis = { summary: aiContent };
        }

        // Update employee with new scores
        if (aiAnalysis?.performanceScore) {
            await prisma.employee.update({
                where: { id: employeeId },
                data: {
                    performanceScore: aiAnalysis.performanceScore,
                    lastAnalyzedAt: new Date()
                }
            });
        }

        return {
            success: true,
            analysis: {
                employee: analysisData.employee,
                metrics: analysisData.metrics,
                reviewHistory: analysisData.reviews,
                aiAnalysis,
                analyzedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Performance analysis error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// ATTRITION RISK ANALYSIS
// ============================================

/**
 * Analyze employee attrition risk
 * @param {string} employeeId - Employee ID
 * @returns {Object} Attrition risk analysis
 */
async function analyzeAttritionRisk(employeeId) {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                attendances: {
                    where: {
                        date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
                    }
                },
                leaves: {
                    where: { status: 'approved' },
                    orderBy: { created_at: 'desc' },
                    take: 10
                },
                performanceReviews: {
                    orderBy: { reviewDate: 'desc' },
                    take: 2
                },
                roleHistory: {
                    orderBy: { effectiveDate: 'desc' },
                    take: 3
                },
                department: true,
                role: true,
                manager: true
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        // Calculate risk factors
        const riskFactors = [];
        let riskScore = 0;

        // Tenure risk (1-2 year mark is high risk)
        const tenureMonths = Math.floor((new Date() - employee.hire_date) / (30 * 24 * 60 * 60 * 1000));
        if (tenureMonths >= 12 && tenureMonths <= 24) {
            riskFactors.push('In high-risk tenure period (1-2 years)');
            riskScore += 15;
        }

        // No promotion in 2+ years
        const lastPromotion = employee.roleHistory.find(r => r.changeType === 'promotion');
        if (!lastPromotion && tenureMonths > 24) {
            riskFactors.push('No promotion in 2+ years');
            riskScore += 20;
        }

        // Declining performance
        if (employee.performanceReviews.length >= 2) {
            const trend = employee.performanceReviews[0].overallRating - employee.performanceReviews[1].overallRating;
            if (trend < 0) {
                riskFactors.push('Declining performance trend');
                riskScore += 15;
            }
        }

        // High leave usage
        const recentLeaves = employee.leaves.filter(l => {
            const leaveDate = new Date(l.start_date);
            return leaveDate >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        });
        if (recentLeaves.length >= 3) {
            riskFactors.push('Frequent recent leaves');
            riskScore += 10;
        }

        // Attendance issues
        const lateCount = employee.attendances.filter(a => a.status === 'late').length;
        if (lateCount > 5) {
            riskFactors.push('Frequent late arrivals');
            riskScore += 10;
        }

        // No manager (unclear reporting)
        if (!employee.manager_id) {
            riskFactors.push('No direct manager assigned');
            riskScore += 5;
        }

        // Low engagement score
        if (employee.engagementScore && employee.engagementScore < 50) {
            riskFactors.push('Low engagement score');
            riskScore += 20;
        }

        // Determine risk level
        let riskLevel = 'low';
        if (riskScore >= 50) riskLevel = 'critical';
        else if (riskScore >= 35) riskLevel = 'high';
        else if (riskScore >= 20) riskLevel = 'medium';

        // AI analysis for deeper insights
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `Analyze attrition risk for employee:
Name: ${employee.name}
Tenure: ${tenureMonths} months
Department: ${employee.department?.name}
Role: ${employee.role?.name}
Risk Factors: ${riskFactors.join(', ') || 'None identified'}
Risk Score: ${riskScore}/100

Provide JSON response:
{
    "retentionRecommendations": ["rec1", "rec2"],
    "urgentActions": ["action1", "action2"],
    "engagementIdeas": ["idea1", "idea2"],
    "summary": "Brief assessment"
}`
            }]
        });

        const aiContent = response.content[0]?.text || '';
        let aiAnalysis;
        try {
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            aiAnalysis = null;
        }

        // Update employee with risk analysis
        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                attritionRisk: riskLevel,
                riskFactors: JSON.stringify(riskFactors),
                retentionPriority: riskLevel === 'critical' || riskLevel === 'high' ? 'critical' : 'standard',
                lastAnalyzedAt: new Date()
            }
        });

        return {
            success: true,
            analysis: {
                employee: {
                    name: employee.name,
                    department: employee.department?.name,
                    tenure: `${tenureMonths} months`
                },
                risk: {
                    level: riskLevel,
                    score: riskScore,
                    factors: riskFactors
                },
                aiRecommendations: aiAnalysis,
                analyzedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Attrition risk analysis error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EMPLOYEE SEARCH & DISCOVERY
// ============================================

/**
 * Search employees by various criteria
 * @param {Object} criteria - Search criteria
 * @returns {Object} Search results
 */
async function searchEmployees(criteria) {
    try {
        const {
            query,
            department,
            skills,
            minExperience,
            status,
            probationStatus,
            attritionRisk,
            limit = 20
        } = criteria;

        const where = {};

        if (status) where.status = status;
        if (probationStatus) where.probationStatus = probationStatus;
        if (attritionRisk) where.attritionRisk = attritionRisk;
        if (department) {
            where.department = { name: { contains: department, mode: 'insensitive' } };
        }

        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { jobTitle: { contains: query, mode: 'insensitive' } }
            ];
        }

        const employees = await prisma.employee.findMany({
            where,
            include: {
                department: true,
                role: true,
                skills: true
            },
            take: limit,
            orderBy: { name: 'asc' }
        });

        // Filter by skills if specified
        let results = employees;
        if (skills && skills.length > 0) {
            results = employees.filter(emp => {
                const empSkills = emp.skills.map(s => s.skillName.toLowerCase());
                return skills.some(skill =>
                    empSkills.some(es => es.includes(skill.toLowerCase()))
                );
            });
        }

        // Filter by experience if specified
        if (minExperience) {
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - minExperience);
            results = results.filter(emp => emp.hire_date <= minDate);
        }

        return {
            success: true,
            count: results.length,
            employees: results.map(emp => ({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                jobTitle: emp.jobTitle,
                department: emp.department?.name,
                role: emp.role?.name,
                status: emp.status,
                hireDate: emp.hire_date,
                skills: emp.skills.map(s => s.skillName),
                performanceScore: emp.performanceScore,
                attritionRisk: emp.attritionRisk
            }))
        };

    } catch (error) {
        console.error('Employee search error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get employees needing attention (probation ending, high risk, etc.)
 * @returns {Object} Employees requiring attention
 */
async function getEmployeesNeedingAttention() {
    try {
        const now = new Date();
        const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        // Probation ending soon
        const probationEnding = await prisma.employee.findMany({
            where: {
                probationStatus: { in: ['pending', 'in_progress'] },
                probationEndDate: {
                    gte: now,
                    lte: twoWeeksFromNow
                }
            },
            include: { department: true, role: true }
        });

        // High attrition risk
        const highRisk = await prisma.employee.findMany({
            where: {
                attritionRisk: { in: ['high', 'critical'] },
                status: 'active'
            },
            include: { department: true, role: true }
        });

        // Overdue probation reviews
        const reviewsOverdue = await prisma.employee.findMany({
            where: {
                probationStatus: { in: ['pending', 'in_progress'] },
                probationReviews: {
                    none: {
                        reviewDate: {
                            gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            },
            include: { department: true, role: true }
        });

        // Performance reviews due
        const performanceReviewsDue = await prisma.employee.findMany({
            where: {
                status: 'active',
                performanceReviews: {
                    none: {
                        reviewDate: {
                            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            },
            take: 10,
            include: { department: true, role: true }
        });

        return {
            success: true,
            alerts: {
                probationEnding: {
                    count: probationEnding.length,
                    employees: probationEnding.map(e => ({
                        id: e.id,
                        name: e.name,
                        department: e.department?.name,
                        probationEndDate: e.probationEndDate
                    }))
                },
                highAttritionRisk: {
                    count: highRisk.length,
                    employees: highRisk.map(e => ({
                        id: e.id,
                        name: e.name,
                        department: e.department?.name,
                        riskLevel: e.attritionRisk
                    }))
                },
                probationReviewsOverdue: {
                    count: reviewsOverdue.length,
                    employees: reviewsOverdue.map(e => ({
                        id: e.id,
                        name: e.name,
                        department: e.department?.name
                    }))
                },
                performanceReviewsDue: {
                    count: performanceReviewsDue.length,
                    employees: performanceReviewsDue.map(e => ({
                        id: e.id,
                        name: e.name,
                        department: e.department?.name
                    }))
                }
            },
            totalAlerts: probationEnding.length + highRisk.length + reviewsOverdue.length + performanceReviewsDue.length,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Get alerts error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get department analytics summary
 * @param {string} departmentId - Optional department ID
 * @returns {Object} Department analytics
 */
async function getDepartmentAnalytics(departmentId = null) {
    try {
        const where = departmentId ? { department_id: departmentId } : {};

        const employees = await prisma.employee.findMany({
            where: { ...where, status: 'active' },
            include: {
                department: true,
                performanceReviews: {
                    orderBy: { reviewDate: 'desc' },
                    take: 1
                }
            }
        });

        // Group by department
        const deptStats = {};
        for (const emp of employees) {
            const deptName = emp.department?.name || 'Unassigned';
            if (!deptStats[deptName]) {
                deptStats[deptName] = {
                    count: 0,
                    avgPerformance: [],
                    probationCount: 0,
                    highRiskCount: 0
                };
            }
            deptStats[deptName].count++;
            if (emp.performanceScore) deptStats[deptName].avgPerformance.push(emp.performanceScore);
            if (emp.probationStatus === 'in_progress') deptStats[deptName].probationCount++;
            if (emp.attritionRisk === 'high' || emp.attritionRisk === 'critical') deptStats[deptName].highRiskCount++;
        }

        // Calculate averages
        const analytics = Object.entries(deptStats).map(([dept, stats]) => ({
            department: dept,
            headcount: stats.count,
            avgPerformanceScore: stats.avgPerformance.length > 0
                ? Math.round(stats.avgPerformance.reduce((a, b) => a + b, 0) / stats.avgPerformance.length)
                : null,
            onProbation: stats.probationCount,
            highRisk: stats.highRiskCount
        }));

        return {
            success: true,
            totalEmployees: employees.length,
            departmentAnalytics: analytics,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Department analytics error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    // Probation
    analyzeProbationProgress,
    createProbationReview,

    // Performance
    analyzePerformance,

    // Attrition
    analyzeAttritionRisk,

    // Search & Discovery
    searchEmployees,
    getEmployeesNeedingAttention,
    getDepartmentAnalytics
};
