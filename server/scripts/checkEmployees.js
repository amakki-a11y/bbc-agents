const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const employees = await prisma.employee.findMany({
        include: {
            user: { select: { id: true, email: true } },
            department: true,
            role: true
        }
    });

    console.log('Employees with linked users:');
    console.log('============================');
    employees.forEach(e => {
        console.log(`Name: ${e.name}`);
        console.log(`Email: ${e.email}`);
        console.log(`Department: ${e.department.name}`);
        console.log(`Role: ${e.role.name}`);
        console.log(`User ID: ${e.user_id || 'NOT LINKED'}`);
        console.log('---');
    });

    await prisma.$disconnect();
}

check();
