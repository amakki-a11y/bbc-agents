const { PrismaClient } = require('@prisma/client');
const validator = require('validator');

const prisma = new PrismaClient();

async function test() {
  const originalEmail = 'admin@bbc.com';

  // Simulate what express-validator's normalizeEmail does
  const normalizedEmail = validator.normalizeEmail(originalEmail);

  console.log('Original email:', originalEmail);
  console.log('Normalized email:', normalizedEmail);
  console.log('Are they equal:', originalEmail === normalizedEmail);

  // Try to find user with both
  const user1 = await prisma.user.findUnique({ where: { email: originalEmail } });
  const user2 = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  console.log('User found with original:', !!user1);
  console.log('User found with normalized:', !!user2);

  await prisma.$disconnect();
}

test();
