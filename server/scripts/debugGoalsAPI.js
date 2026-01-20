const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugGoals() {
  console.log('=== Debugging Goals API ===\n');

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

  // Test with ownerType: 'individual' (what frontend sends)
  console.log('2. Testing with ownerType: "individual" (frontend sends this)...');
  try {
    const res = await axios.post(`${BASE_URL}/api/goals`, {
      title: 'Test Goal',
      targetValue: 100,
      unit: 'tasks',
      ownerType: 'individual',  // This is wrong!
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { headers });
    console.log('   ✅ Created:', res.data.id);
  } catch (e) {
    console.log('   ❌ Failed:', e.response?.status, JSON.stringify(e.response?.data));
  }

  // Test with ownerType: 'employee' (what backend expects)
  console.log('\n3. Testing with ownerType: "employee" (backend expects this)...');
  try {
    const res = await axios.post(`${BASE_URL}/api/goals`, {
      title: 'Test Goal 2',
      targetValue: 100,
      unit: 'tasks',
      ownerType: 'employee',  // Correct
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { headers });
    console.log('   ✅ Created:', res.data.id);
    // Clean up
    await axios.delete(`${BASE_URL}/api/goals/${res.data.id}`, { headers });
    console.log('   ✅ Cleaned up');
  } catch (e) {
    console.log('   ❌ Failed:', e.response?.status, JSON.stringify(e.response?.data));
  }

  // Test with ownerType: 'company'
  console.log('\n4. Testing with ownerType: "company"...');
  try {
    const res = await axios.post(`${BASE_URL}/api/goals`, {
      title: 'Test Company Goal',
      targetValue: 100,
      unit: 'tasks',
      ownerType: 'company',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { headers });
    console.log('   ✅ Created:', res.data.id);
    // Clean up
    await axios.delete(`${BASE_URL}/api/goals/${res.data.id}`, { headers });
    console.log('   ✅ Cleaned up');
  } catch (e) {
    console.log('   ❌ Failed:', e.response?.status, JSON.stringify(e.response?.data));
  }

  console.log('\n=== Debug Complete ===');
  console.log('\nISSUE FOUND: Frontend sends "individual" but backend expects "employee"');
}

debugGoals().catch(console.error);
