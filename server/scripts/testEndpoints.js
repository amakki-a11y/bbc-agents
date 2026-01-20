const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function test() {
  // Login first
  console.log('Logging in...');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@bbc.com',
    password: 'admin123'
  });
  const token = loginRes.data.accessToken;
  console.log('Token obtained!\n');

  const endpoints = [
    '/api/tasks',
    '/api/projects',
    '/api/events'
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    try {
      const res = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`  ✅ Status: ${res.status}`);
      console.log(`  Data: ${JSON.stringify(res.data).substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`  ❌ Status: ${error.response?.status}`);
      console.log(`  Error: ${JSON.stringify(error.response?.data)}`);
      console.log(`  Message: ${error.message}\n`);
    }
  }
}

test().catch(e => console.error('Script error:', e.message));
