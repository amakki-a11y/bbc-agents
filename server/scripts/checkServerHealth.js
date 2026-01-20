const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function checkHealth() {
  console.log('=== BBC Server Health Check ===\n');

  // 1. Check if server is running
  console.log('1. Server Status:');
  try {
    const res = await axios.get(BASE_URL);
    console.log(`   ✅ Server is running: ${res.data.message}\n`);
  } catch (e) {
    console.log(`   ❌ Server not responding: ${e.message}\n`);
    return;
  }

  // 2. Test login
  console.log('2. Login Test:');
  let token;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bbc.com',
      password: 'admin123'
    });
    token = loginRes.data.accessToken;
    console.log('   ✅ Login successful\n');
  } catch (e) {
    console.log(`   ❌ Login failed: ${e.response?.data || e.message}\n`);
    return;
  }

  // 3. Test all main endpoints
  console.log('3. Endpoint Tests:');
  const endpoints = [
    { path: '/api/tasks', name: 'Tasks' },
    { path: '/api/projects', name: 'Projects' },
    { path: '/api/events', name: 'Events' },
    { path: '/api/bot/context', name: 'Bot Context' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${ep.path}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   ✅ ${ep.name}: ${res.status} OK`);
    } catch (e) {
      console.log(`   ❌ ${ep.name}: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    }
  }

  console.log('\n=== Health Check Complete ===');
  console.log('\nIf you see 500 errors in browser:');
  console.log('1. Open browser DevTools → Application → Local Storage');
  console.log('2. Clear "token" entry for localhost:5173');
  console.log('3. Refresh the page and login again');
}

checkHealth().catch(console.error);
