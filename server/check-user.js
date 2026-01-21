const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking for user: amakki@bbcorp.trade\n');

  const user = await prisma.user.findUnique({
    where: { email: 'amakki@bbcorp.trade' },
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });

  if (user) {
    console.log('User found:', user);
  } else {
    console.log('User NOT found with email: amakki@bbcorp.trade');
  }

  console.log('\n--- All users in database ---');
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });
  console.log('Total users:', allUsers.length);
  allUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
