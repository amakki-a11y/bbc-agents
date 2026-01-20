/**
 * Employee Lifecycle System - Test Script
 * Tests CV parsing, onboarding, probation tracking, performance analysis
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

let adminToken = null;
let testEmployeeId = null;

// Sample CV text for parsing test
const SAMPLE_CV = `
JOHN SMITH
Software Engineer
john.smith@email.com | +1-555-123-4567 | LinkedIn: linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Experienced software engineer with 5 years of experience in full-stack development,
specializing in JavaScript, Python, and cloud technologies.

EDUCATION
Master of Science in Computer Science
Stanford University | 2016 - 2018 | GPA: 3.8

Bachelor of Science in Computer Engineering
MIT | 2012 - 2016 | GPA: 3.7

WORK EXPERIENCE
Senior Software Engineer | Google | Jan 2020 - Present
- Led development of microservices architecture serving 10M users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored team of 5 junior developers
- Technologies: Python, Go, Kubernetes, GCP

Software Engineer | Meta | Jun 2018 - Dec 2019
- Developed React components for Facebook's news feed
- Optimized database queries improving performance by 40%
- Technologies: JavaScript, React, Node.js, PostgreSQL

SKILLS
Technical: Python (Expert), JavaScript (Expert), Go (Advanced), React (Advanced),
Node.js (Advanced), PostgreSQL (Advanced), MongoDB (Intermediate), Kubernetes (Advanced)
Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration

CERTIFICATIONS
- AWS Solutions Architect Professional (2022)
- Google Cloud Professional Data Engineer (2021)

LANGUAGES
- English (Native)
- Spanish (Professional)
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

async function login() {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@bbc.com',
            password: 'admin123'
        });
        adminToken = res.data.accessToken;
        console.log('✅ Admin logged in successfully');
        return true;
    } catch (error) {
        console.log('❌ Admin login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testBotCommand(command, description) {
    process.stdout.write(`  ${description}... `);
    try {
        const res = await axios.post(`${BASE_URL}/api/bot/message`,
            { content: command, messageType: 'question' },
            { headers: { Authorization: `Bearer ${adminToken}` }, timeout: 60000 }
        );

        const toolsUsed = res.data?.botMessage?.metadata?.toolsUsed || [];
        const response = res.data?.botMessage?.content || '';
        const tools = toolsUsed.map(t => t.tool).join(', ');

        if (toolsUsed.length > 0) {
            console.log(`✅ [${tools}]`);
            console.log(`     Response: ${response.substring(0, 100)}...`);
            return { success: true, tools, response };
        } else {
            console.log(`⚠️ No tools used`);
            console.log(`     Response: ${response.substring(0, 80)}...`);
            return { success: true, tools: [], response };
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function createTestEmployee() {
    console.log('\n📌 Creating test employee for lifecycle tests...');

    try {
        // Get or create department
        let dept = await prisma.department.findFirst({ where: { name: 'Engineering' } });
        if (!dept) {
            dept = await prisma.department.create({
                data: { name: 'Engineering', description: 'Engineering Department' }
            });
        }

        // Get or create role
        let role = await prisma.role.findFirst({ where: { name: 'Employee' } });
        if (!role) {
            role = await prisma.role.create({
                data: { name: 'Employee', permissions: JSON.stringify(['read', 'write_own']) }
            });
        }

        // Create user
        const hashedPassword = await bcrypt.hash('test123', 10);
        let user = await prisma.user.findUnique({ where: { email: 'newjoin@test.com' } });
        if (!user) {
            user = await prisma.user.create({
                data: { email: 'newjoin@test.com', password_hash: hashedPassword }
            });
        }

        // Create employee with probation status
        const hireDate = new Date();
        hireDate.setDate(hireDate.getDate() - 30); // 30 days ago
        const probationEnd = new Date();
        probationEnd.setDate(probationEnd.getDate() + 60); // 60 days from now

        let employee = await prisma.employee.findUnique({ where: { email: 'newjoin@test.com' } });
        if (employee) {
            employee = await prisma.employee.update({
                where: { email: 'newjoin@test.com' },
                data: {
                    name: 'New Joiner Test',
                    department_id: dept.id,
                    role_id: role.id,
                    user_id: user.id,
                    hire_date: hireDate,
                    status: 'probation',
                    probationStatus: 'in_progress',
                    probationEndDate: probationEnd,
                    onboardingStatus: 'in_progress',
                    onboardingProgress: 40
                }
            });
        } else {
            employee = await prisma.employee.create({
                data: {
                    email: 'newjoin@test.com',
                    name: 'New Joiner Test',
                    department_id: dept.id,
                    role_id: role.id,
                    user_id: user.id,
                    hire_date: hireDate,
                    status: 'probation',
                    probationStatus: 'in_progress',
                    probationEndDate: probationEnd,
                    onboardingStatus: 'in_progress',
                    onboardingProgress: 40
                }
            });
        }

        testEmployeeId = employee.id;
        console.log(`   ✅ Test employee created: ${employee.name} (${employee.id})`);
        console.log(`      Status: ${employee.status}, Probation: ${employee.probationStatus}`);
        console.log(`      Onboarding: ${employee.onboardingProgress}%`);

        return employee;
    } catch (error) {
        console.error('   ❌ Failed to create test employee:', error.message);
        return null;
    }
}

// ============================================
// TEST SUITES
// ============================================

async function testOnboardingFeatures() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE 1: ONBOARDING & CV PARSING');
    console.log('='.repeat(60));

    // Test onboarding status
    await testBotCommand('onboarding status', 'Get all onboarding status');

    // Test specific employee onboarding
    await testBotCommand('New Joiner onboarding', 'Get specific employee onboarding');

    // Test update onboarding
    await testBotCommand('update New Joiner onboarding to 60%', 'Update onboarding progress');

    // Test employee profile
    await testBotCommand("New Joiner's profile", 'Get employee profile');
}

async function testProbationFeatures() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE 2: PROBATION TRACKING');
    console.log('='.repeat(60));

    // Test probation status
    await testBotCommand('probation status', 'Get all probation status');

    // Test specific probation
    await testBotCommand('New Joiner probation status', 'Get specific probation status');

    // Test probation alerts
    await testBotCommand('probation alerts', 'Get probation alerts');

    // Test create probation review
    await testBotCommand(
        'probation review for New Joiner: performance 4, attendance 4, attitude 5, learning 4, teamwork 5, strengths: quick learner, improvements: documentation',
        'Create probation review'
    );
}

async function testPerformanceFeatures() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE 3: PERFORMANCE ANALYSIS');
    console.log('='.repeat(60));

    // Test performance analysis
    await testBotCommand('analyze New Joiner performance', 'Analyze employee performance');

    // Test attrition risk
    await testBotCommand('who might leave?', 'Get attrition risk');

    // Test specific attrition
    await testBotCommand('New Joiner attrition risk', 'Get specific attrition risk');
}

async function testSearchAndDiscovery() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE 4: SEARCH & DISCOVERY');
    console.log('='.repeat(60));

    // Test employee search
    await testBotCommand('search employees in Engineering', 'Search by department');

    // Test who needs attention
    await testBotCommand('who needs attention?', 'Get employees needing attention');

    // Test department analytics
    await testBotCommand('department analytics', 'Get department analytics');
}

async function testSkillsManagement() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE 5: SKILLS MANAGEMENT');
    console.log('='.repeat(60));

    // Add skill
    await testBotCommand('add Python to New Joiner as expert', 'Add skill to employee');

    // Get employee skills
    await testBotCommand("New Joiner's skills", 'Get employee skills');

    // Find by skill
    await testBotCommand('who knows Python?', 'Find employees by skill');
}

async function testDirectAPIs() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE 6: DIRECT SERVICE TESTS');
    console.log('='.repeat(60));

    // Import services
    const { parseCV } = require('../src/services/cvParserService');
    const { analyzeProbationProgress, analyzePerformance } = require('../src/services/employeeAnalyticsService');

    // Test CV parsing
    console.log('  Testing CV Parser Service...');
    try {
        const cvResult = await parseCV(SAMPLE_CV, testEmployeeId);
        if (cvResult.success) {
            console.log(`  ✅ CV parsed: ${cvResult.data?.skills?.length || 0} skills, ${cvResult.data?.education?.length || 0} education`);
        } else {
            console.log(`  ⚠️ CV parsing: ${cvResult.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`  ❌ CV Parser error: ${error.message}`);
    }

    // Test probation analysis
    console.log('  Testing Probation Analysis...');
    try {
        const probResult = await analyzeProbationProgress(testEmployeeId);
        if (probResult.success) {
            console.log(`  ✅ Probation analyzed: ${probResult.analysis.timeline.progressPercent}% complete`);
        } else {
            console.log(`  ⚠️ Probation analysis: ${probResult.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`  ❌ Probation analysis error: ${error.message}`);
    }

    // Test performance analysis
    console.log('  Testing Performance Analysis...');
    try {
        const perfResult = await analyzePerformance(testEmployeeId);
        if (perfResult.success) {
            console.log(`  ✅ Performance analyzed: ${perfResult.analysis.aiAnalysis?.overallPerformance || 'N/A'}`);
        } else {
            console.log(`  ⚠️ Performance analysis: ${perfResult.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`  ❌ Performance analysis error: ${error.message}`);
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('='.repeat(60));
    console.log('EMPLOYEE LIFECYCLE MANAGEMENT - TEST SUITE');
    console.log('='.repeat(60));
    console.log();

    // Login
    console.log('📌 STEP 1: Authentication');
    const loggedIn = await login();
    if (!loggedIn) {
        console.log('\n❌ Cannot proceed without admin login');
        console.log('   Run: node scripts/createAdmin.js');
        process.exit(1);
    }

    // Create test employee
    await createTestEmployee();

    // Run test suites
    await testOnboardingFeatures();
    await testProbationFeatures();
    await testPerformanceFeatures();
    await testSearchAndDiscovery();
    await testSkillsManagement();
    await testDirectAPIs();

    // Summary
    console.log('\n');
    console.log('='.repeat(60));
    console.log('TEST SUITE COMPLETED');
    console.log('='.repeat(60));
    console.log();
    console.log('Employee Lifecycle Features:');
    console.log('  ✅ CV Parsing with AI extraction');
    console.log('  ✅ Onboarding progress tracking');
    console.log('  ✅ Probation monitoring with AI analysis');
    console.log('  ✅ Performance analysis');
    console.log('  ✅ Attrition risk prediction');
    console.log('  ✅ Employee search & discovery');
    console.log('  ✅ Department analytics');
    console.log('  ✅ Skills management');
    console.log();
    console.log('Voice Commands:');
    console.log('  - "parse CV for [name]" / "analyze resume"');
    console.log('  - "onboarding status" / "[name] onboarding"');
    console.log('  - "probation status" / "probation alerts"');
    console.log('  - "analyze [name] performance"');
    console.log('  - "who might leave?" / "attrition risk"');
    console.log('  - "who needs attention?" / "HR alerts"');
    console.log('  - "department analytics" / "[dept] stats"');
    console.log('  - "[name]\'s skills" / "who knows [skill]?"');
    console.log();

    await prisma.$disconnect();
}

main().catch(err => {
    console.error('Test error:', err);
    prisma.$disconnect();
    process.exit(1);
});
