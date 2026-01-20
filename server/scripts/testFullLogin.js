const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
require('dotenv').config();

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

async function testLogin() {
  const reqBody = { email: 'admin@bbc.com', password: 'admin123' };

  try {
    console.log('Step 1: Validating input...');
    const validation = loginSchema.safeParse(reqBody);
    if (!validation.success) {
      console.log('Validation failed:', validation.error);
      return;
    }
    console.log('Validation passed');

    const { email, password } = validation.data;
    console.log('Email:', email);

    console.log('Step 2: Finding user...');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User found:', user.id, user.email);

    console.log('Step 3: Comparing password...');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('Invalid password');
      return;
    }
    console.log('Password valid');

    console.log('Step 4: Generating tokens...');
    const tokens = generateTokens(user);
    console.log('Tokens generated successfully');

    console.log('Step 5: Preparing response...');
    const response = { ...tokens, user: { id: user.id, email: user.email } };
    console.log('Response:', JSON.stringify(response, null, 2));

    console.log('\n✓ Login would succeed!');
  } catch (error) {
    console.error('Error at some step:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
