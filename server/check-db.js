const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, created_at: true }
    });
    console.log('👥 Users in database:', users.length);
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`  - ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`);
      });
    } else {
      console.log('  No users found - database needs seeding!');
    }

    // Check employees
    const employees = await prisma.employee.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, status: true, role: true }
    });
    console.log('\n👔 Employees in database:', employees.length);
    if (employees.length > 0) {
      employees.forEach(e => {
        console.log(`  - ${e.firstName} ${e.lastName} (${e.email}) - Role: ${e.role?.name || 'N/A'}, Status: ${e.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
