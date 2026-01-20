/**
 * Setup Test Employees & Test Messaging Hierarchy Rules
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Test results table
const testResults = [];

async function setupTestData() {
    console.log('='.repeat(60));
    console.log('SETTING UP TEST EMPLOYEES FOR MESSAGING HIERARCHY');
    console.log('='.repeat(60));
    console.log();

    try {
        // 1. Create Departments
        console.log('📁 Creating departments...');

        const marketing = await prisma.department.upsert({
            where: { name: 'Marketing' },
            update: {},
            create: { name: 'Marketing', description: 'Marketing Department' }
        });
        console.log(`   ✅ Marketing: ${marketing.id}`);

        const engineering = await prisma.department.upsert({
            where: { name: 'Engineering' },
            update: {},
            create: { name: 'Engineering', description: 'Engineering Department' }
        });
        console.log(`   ✅ Engineering: ${engineering.id}`);

        const hr = await prisma.department.upsert({
            where: { name: 'HR' },
            update: {},
            create: { name: 'HR', description: 'Human Resources' }
        });
        console.log(`   ✅ HR: ${hr.id}`);

        // 2. Create Roles
        console.log('\n👔 Creating roles...');

        const employeeRole = await prisma.role.upsert({
            where: { name: 'Employee' },
            update: {},
            create: { name: 'Employee', permissions: JSON.stringify(['read', 'write_own']) }
        });
        console.log(`   ✅ Employee role: ${employeeRole.id}`);

        const managerRole = await prisma.role.upsert({
            where: { name: 'Manager' },
            update: {},
            create: { name: 'Manager', permissions: JSON.stringify(['read', 'write', 'manage_team']) }
        });
        console.log(`   ✅ Manager role: ${managerRole.id}`);

        const hrRole = await prisma.role.upsert({
            where: { name: 'HR Staff' },
            update: {},
            create: { name: 'HR Staff', permissions: JSON.stringify(['read', 'write', 'hr_access']) }
        });
        console.log(`   ✅ HR Staff role: ${hrRole.id}`);

        // 3. Create Users and Employees
        console.log('\n👥 Creating test employees...');
        const hashedPassword = await bcrypt.hash('test123', 10);

        // Helper to create user + employee
        async function createTestEmployee(email, name, deptId, roleId, managerId = null) {
            // Create or get user
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: { email, password_hash: hashedPassword }
                });
            }

            // Create or update employee
            let employee = await prisma.employee.findUnique({ where: { email } });
            if (employee) {
                employee = await prisma.employee.update({
                    where: { email },
                    data: {
                        name,
                        department_id: deptId,
                        role_id: roleId,
                        manager_id: managerId,
                        user_id: user.id
                    }
                });
            } else {
                employee = await prisma.employee.create({
                    data: {
                        email,
                        name,
                        department_id: deptId,
                        role_id: roleId,
                        manager_id: managerId,
                        user_id: user.id,
                        hire_date: new Date(),
                        status: 'active'
                    }
                });
            }

            return { user, employee };
        }

        // Create managers first (no manager_id)
        const { employee: mike } = await createTestEmployee(
            'mike@test.com', 'Mike (Marketing Manager)', marketing.id, managerRole.id, null
        );
        console.log(`   ✅ Mike (Manager, Marketing): ${mike.id}`);

        const { employee: lisa } = await createTestEmployee(
            'lisa@test.com', 'Lisa (Engineering Manager)', engineering.id, managerRole.id, null
        );
        console.log(`   ✅ Lisa (Manager, Engineering): ${lisa.id}`);

        // Create HR person
        const { employee: hrPerson } = await createTestEmployee(
            'hrperson@test.com', 'HR Person', hr.id, hrRole.id, null
        );
        console.log(`   ✅ HR Person (HR): ${hrPerson.id}`);

        // Create employees with managers
        const { employee: sarah } = await createTestEmployee(
            'sarah@test.com', 'Sarah (Marketing Employee)', marketing.id, employeeRole.id, mike.id
        );
        console.log(`   ✅ Sarah (Employee, Marketing, reports to Mike): ${sarah.id}`);

        const { employee: john } = await createTestEmployee(
            'john@test.com', 'John (Engineering Employee)', engineering.id, employeeRole.id, lisa.id
        );
        console.log(`   ✅ John (Employee, Engineering, reports to Lisa): ${john.id}`);

        console.log('\n📊 Employee Hierarchy:');
        console.log('   ┌─ Marketing ─────────────────┐');
        console.log('   │  Mike (Manager)             │');
        console.log('   │    └── Sarah (Employee)     │');
        console.log('   └─────────────────────────────┘');
        console.log('   ┌─ Engineering ───────────────┐');
        console.log('   │  Lisa (Manager)             │');
        console.log('   │    └── John (Employee)      │');
        console.log('   └─────────────────────────────┘');
        console.log('   ┌─ HR ────────────────────────┐');
        console.log('   │  HR Person                  │');
        console.log('   └─────────────────────────────┘');

        return { sarah, mike, john, lisa, hrPerson, marketing, engineering, hr };
    } catch (error) {
        console.error('Setup error:', error);
        throw error;
    }
}

/**
 * Import the canEmployeeMessage function logic
 */
async function canEmployeeMessage(fromEmployeeId, toEmployeeId) {
    const fromEmployee = await prisma.employee.findUnique({
        where: { id: fromEmployeeId },
        include: {
            department: true,
            role: true,
            manager: true,
            subordinates: true
        }
    });

    const toEmployee = await prisma.employee.findUnique({
        where: { id: toEmployeeId },
        include: {
            department: true,
            role: true,
            manager: true
        }
    });

    if (!fromEmployee || !toEmployee) {
        return { allowed: false, reason: 'Employee not found' };
    }

    const fromRole = fromEmployee.role?.name?.toLowerCase() || '';
    const toRole = toEmployee.role?.name?.toLowerCase() || '';
    const fromDept = fromEmployee.department?.name?.toLowerCase() || '';
    const toDept = toEmployee.department?.name?.toLowerCase() || '';

    // 1. Admin can message anyone
    if (fromRole === 'admin' || fromRole === 'administrator') {
        return { allowed: true, reason: 'Admin access' };
    }

    // 2. HR can message anyone
    if (fromDept === 'hr' || fromDept === 'human resources') {
        return { allowed: true, reason: 'HR access' };
    }

    // 3. Anyone can message HR
    if (toDept === 'hr' || toDept === 'human resources') {
        return { allowed: true, reason: 'HR always allowed' };
    }

    // 4. Can message direct manager
    if (fromEmployee.manager_id === toEmployeeId) {
        return { allowed: true, reason: 'Direct manager' };
    }

    // 5. Can message same department colleagues
    if (fromEmployee.department_id === toEmployee.department_id) {
        return { allowed: true, reason: 'Same department' };
    }

    // 6. Manager can message their direct reports
    const isDirectReport = fromEmployee.subordinates?.some(s => s.id === toEmployeeId);
    if (isDirectReport) {
        return { allowed: true, reason: 'Direct report' };
    }

    // 7. Check if both are managers (can message other managers)
    const fromIsManager = fromEmployee.subordinates?.length > 0;
    const toSubordinates = await prisma.employee.count({
        where: { manager_id: toEmployeeId }
    });
    const toIsManager = toSubordinates > 0;

    if (fromIsManager && toIsManager) {
        return { allowed: true, reason: 'Manager to manager' };
    }

    // Not allowed
    return {
        allowed: false,
        reason: 'Different department (not manager/HR)'
    };
}

async function runHierarchyTests(employees) {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('RUNNING MESSAGING HIERARCHY TESTS');
    console.log('='.repeat(60));
    console.log();

    const { sarah, mike, john, lisa, hrPerson } = employees;

    // Test cases
    const testCases = [
        // Sarah (Employee) tests
        { from: sarah, to: mike, fromName: 'Sarah', toName: 'Mike (manager)', expectAllowed: true },
        { from: sarah, to: hrPerson, fromName: 'Sarah', toName: 'HR Person', expectAllowed: true },
        { from: sarah, to: john, fromName: 'Sarah', toName: 'John (diff dept)', expectAllowed: false },
        { from: sarah, to: lisa, fromName: 'Sarah', toName: 'Lisa (diff dept mgr)', expectAllowed: false },

        // Mike (Manager) tests
        { from: mike, to: sarah, fromName: 'Mike', toName: 'Sarah (report)', expectAllowed: true },
        { from: mike, to: lisa, fromName: 'Mike', toName: 'Lisa (other mgr)', expectAllowed: true },
        { from: mike, to: john, fromName: 'Mike', toName: 'John (diff dept)', expectAllowed: false },
        { from: mike, to: hrPerson, fromName: 'Mike', toName: 'HR Person', expectAllowed: true },

        // John (Employee) tests
        { from: john, to: lisa, fromName: 'John', toName: 'Lisa (manager)', expectAllowed: true },
        { from: john, to: sarah, fromName: 'John', toName: 'Sarah (diff dept)', expectAllowed: false },
        { from: john, to: hrPerson, fromName: 'John', toName: 'HR Person', expectAllowed: true },

        // Lisa (Manager) tests
        { from: lisa, to: john, fromName: 'Lisa', toName: 'John (report)', expectAllowed: true },
        { from: lisa, to: mike, fromName: 'Lisa', toName: 'Mike (other mgr)', expectAllowed: true },
        { from: lisa, to: sarah, fromName: 'Lisa', toName: 'Sarah (diff dept)', expectAllowed: false },

        // HR tests
        { from: hrPerson, to: sarah, fromName: 'HR Person', toName: 'Sarah', expectAllowed: true },
        { from: hrPerson, to: john, fromName: 'HR Person', toName: 'John', expectAllowed: true },
        { from: hrPerson, to: mike, fromName: 'HR Person', toName: 'Mike', expectAllowed: true },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        const result = await canEmployeeMessage(test.from.id, test.to.id);
        const testPassed = result.allowed === test.expectAllowed;

        if (testPassed) passed++;
        else failed++;

        testResults.push({
            from: test.fromName,
            to: test.toName,
            allowed: result.allowed,
            reason: result.reason,
            expected: test.expectAllowed,
            passed: testPassed
        });
    }

    // Print results table
    console.log('┌─────────────────┬─────────────────────┬──────────┬──────────────────────────────┬────────┐');
    console.log('│ From            │ To                  │ Allowed? │ Reason                       │ Status │');
    console.log('├─────────────────┼─────────────────────┼──────────┼──────────────────────────────┼────────┤');

    for (const r of testResults) {
        const from = r.from.padEnd(15);
        const to = r.to.padEnd(19);
        const allowed = r.allowed ? '✅ Yes   ' : '❌ No    ';
        const reason = r.reason.substring(0, 28).padEnd(28);
        const status = r.passed ? '✅ PASS' : '❌ FAIL';

        console.log(`│ ${from} │ ${to} │ ${allowed} │ ${reason} │ ${status} │`);
    }

    console.log('└─────────────────┴─────────────────────┴──────────┴──────────────────────────────┴────────┘');

    console.log();
    console.log('='.repeat(60));
    console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
    console.log('='.repeat(60));

    if (failed === 0) {
        console.log('\n🎉 All hierarchy rules working correctly!');
    } else {
        console.log('\n⚠️ Some tests failed - check hierarchy logic.');
    }

    return { passed, failed, total: testCases.length };
}

async function main() {
    try {
        const employees = await setupTestData();
        await runHierarchyTests(employees);

        console.log('\n📝 Test Credentials:');
        console.log('   Email: sarah@test.com | Password: test123 (Employee)');
        console.log('   Email: mike@test.com  | Password: test123 (Manager)');
        console.log('   Email: john@test.com  | Password: test123 (Employee)');
        console.log('   Email: lisa@test.com  | Password: test123 (Manager)');
        console.log('   Email: hrperson@test.com | Password: test123 (HR)');

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
