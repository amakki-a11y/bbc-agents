const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: 'amakki@bbcorp.trade',
      password_hash: hashedPassword,
    }
  });

  console.log('✅ User created:', user.email);
  console.log('Password: Admin123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
