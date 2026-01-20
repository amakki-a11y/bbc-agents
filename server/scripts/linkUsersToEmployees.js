const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkUsersToEmployees() {
    console.log('Starting user-employee linking...\n');

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);

    // Get all employees
    const employees = await prisma.employee.findMany();
    console.log(`Found ${employees.length} employees\n`);

    let linkedCount = 0;
    let alreadyLinkedCount = 0;
    let noMatchCount = 0;

    for (const user of users) {
        // Check if user already has an employee linked
        const existingLink = await prisma.employee.findFirst({
            where: { user_id: user.id }
        });

        if (existingLink) {
            console.log(`[SKIP] User ${user.email} already linked to employee ${existingLink.name}`);
            alreadyLinkedCount++;
            continue;
        }

        // Find employee with same email
        const employee = await prisma.employee.findFirst({
            where: { email: user.email }
        });

        if (employee) {
            if (!employee.user_id) {
                await prisma.employee.update({
                    where: { id: employee.id },
                    data: { user_id: user.id }
                });
                console.log(`[LINKED] User ${user.email} -> Employee ${employee.name}`);
                linkedCount++;
            } else if (employee.user_id !== user.id) {
                console.log(`[CONFLICT] Employee ${employee.email} already linked to different user`);
            }
        } else {
            console.log(`[NO MATCH] No employee found for user ${user.email}`);
            noMatchCount++;
        }
    }

    console.log('\n========== Summary ==========');
    console.log(`Total users: ${users.length}`);
    console.log(`Newly linked: ${linkedCount}`);
    console.log(`Already linked: ${alreadyLinkedCount}`);
    console.log(`No matching employee: ${noMatchCount}`);

    // If there are users without employees, offer to create employees for them
    if (noMatchCount > 0) {
        console.log('\n[INFO] Some users have no matching employee.');
        console.log('Creating employee records for unlinked users...\n');

        // Get default department and role
        const defaultDept = await prisma.department.findFirst();
        const defaultRole = await prisma.role.findFirst({
            where: { name: 'Employee' }
        }) || await prisma.role.findFirst();

        if (!defaultDept || !defaultRole) {
            console.log('[ERROR] Cannot create employees - no departments or roles exist.');
            console.log('Please run: npx prisma db seed');
            return;
        }

        for (const user of users) {
            const hasEmployee = await prisma.employee.findFirst({
                where: {
                    OR: [
                        { user_id: user.id },
                        { email: user.email }
                    ]
                }
            });

            if (!hasEmployee) {
                const newEmployee = await prisma.employee.create({
                    data: {
                        name: user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        email: user.email,
                        user_id: user.id,
                        department_id: defaultDept.id,
                        role_id: defaultRole.id,
                        hire_date: new Date(),
                        status: 'active'
                    }
                });
                console.log(`[CREATED] New employee "${newEmployee.name}" for user ${user.email}`);
            }
        }
    }

    console.log('\nDone!');
}

linkUsersToEmployees()
    .catch(err => {
        console.error('Error:', err);
    })
    .finally(() => prisma.$disconnect());
