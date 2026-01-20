const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function test() {
  // Get all users
  const users = await prisma.user.findMany({
    include: { employee: true }
  });

  console.log('Users in database:');
  for (const u of users) {
    console.log(`  - ID: ${u.id}, Email: ${u.email}, Has Employee: ${!!u.employee}`);
  }

  // Test login and endpoints for user without employee
  const userWithoutEmployee = users.find(u => !u.employee);
  if (userWithoutEmployee) {
    console.log(`\nTesting user without employee record: ${userWithoutEmployee.email}`);
    console.log('(This might be the cause of 500 errors)\n');

    // We can't login without knowing password, but let's check what we can
  }

  // Check if there's a token in localStorage scenario
  console.log('\nTesting admin user (has employee record):');
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bbc.com',
      password: 'admin123'
    });
    const token = loginRes.data.accessToken;

    for (const ep of ['/api/tasks', '/api/projects', '/api/events']) {
      const res = await axios.get(`${BASE_URL}${ep}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`  ${ep}: ${res.status} OK - ${Array.isArray(res.data) ? res.data.length + ' items' : 'object'}`);
    }
  } catch (e) {
    console.log(`  Error: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
  }

  await prisma.$disconnect();
}

test().catch(e => {
  console.error('Script error:', e.message);
  prisma.$disconnect();
});
