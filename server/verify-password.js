const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'amakki@bbcorp.trade' }
  });

  console.log('User found:', user ? 'Yes' : 'No');
  console.log('Password hash:', user?.password_hash?.substring(0, 30) + '...');

  // Test password comparison
  const testPassword = 'Admin123!';
  const isValid = await bcrypt.compare(testPassword, user.password_hash);
  console.log('Password "Admin123!" valid:', isValid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
