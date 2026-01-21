const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email: 'amakki@bbcorp.trade' },
    data: { password_hash: hashedPassword }
  });

  console.log('✅ Password reset for:', user.email);
  console.log('New password: Admin123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
