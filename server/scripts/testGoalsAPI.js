const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testGoalsAPI() {
  console.log('=== Testing Goals API ===\n');

  // Login first
  console.log('1. Logging in...');
  let token;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bbc.com',
      password: 'admin123'
    });
    token = loginRes.data.accessToken;
    console.log('   ✅ Login successful\n');
  } catch (e) {
    console.log('   ❌ Login failed:', e.response?.data || e.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Test GET /api/goals/stats
  console.log('2. Testing GET /api/goals/stats...');
  try {
    const res = await axios.get(`${BASE_URL}/api/goals/stats`, { headers });
    console.log('   ✅ Stats:', JSON.stringify(res.data));
  } catch (e) {
    console.log('   ❌ Failed:', e.response?.data || e.message);
  }

  // Test GET /api/goals
  console.log('\n3. Testing GET /api/goals...');
  try {
    const res = await axios.get(`${BASE_URL}/api/goals`, { headers });
    console.log(`   ✅ Found ${res.data.length} goals`);
  } catch (e) {
    console.log('   ❌ Failed:', e.response?.data || e.message);
  }

  // Test POST /api/goals (create a goal)
  console.log('\n4. Testing POST /api/goals (create goal)...');
  let createdGoalId;
  try {
    const res = await axios.post(`${BASE_URL}/api/goals`, {
      title: 'Test Goal from API',
      targetValue: 100,
      unit: 'tasks',
      ownerType: 'company',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }, { headers });
    createdGoalId = res.data.id;
    console.log('   ✅ Created goal ID:', createdGoalId);
  } catch (e) {
    console.log('   ❌ Failed:', e.response?.data || e.message);
  }

  // Test PUT /api/goals/:id (update goal)
  if (createdGoalId) {
    console.log('\n5. Testing PUT /api/goals/:id (update goal)...');
    try {
      const res = await axios.put(`${BASE_URL}/api/goals/${createdGoalId}`, {
        currentValue: 50,
        title: 'Updated Test Goal'
      }, { headers });
      console.log('   ✅ Updated goal:', res.data.title, '- Progress:', res.data.currentValue + '/' + res.data.targetValue);
    } catch (e) {
      console.log('   ❌ Failed:', e.response?.data || e.message);
    }

    // Test DELETE /api/goals/:id
    console.log('\n6. Testing DELETE /api/goals/:id...');
    try {
      await axios.delete(`${BASE_URL}/api/goals/${createdGoalId}`, { headers });
      console.log('   ✅ Goal deleted');
    } catch (e) {
      console.log('   ❌ Failed:', e.response?.data || e.message);
    }
  }

  console.log('\n=== Goals API Tests Complete ===');
}

testGoalsAPI().catch(console.error);
