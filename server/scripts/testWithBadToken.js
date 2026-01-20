const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('Testing with various token scenarios...\n');

  const endpoints = ['/api/tasks', '/api/projects', '/api/events'];

  // Test 1: No token
  console.log('1. No token:');
  for (const ep of endpoints) {
    try {
      await axios.get(`${BASE_URL}${ep}`);
      console.log(`  ${ep}: OK`);
    } catch (e) {
      console.log(`  ${ep}: ${e.response?.status} - ${e.response?.data || e.message}`);
    }
  }

  // Test 2: Invalid/garbage token
  console.log('\n2. Invalid token:');
  for (const ep of endpoints) {
    try {
      await axios.get(`${BASE_URL}${ep}`, {
        headers: { Authorization: 'Bearer invalid_garbage_token' }
      });
      console.log(`  ${ep}: OK`);
    } catch (e) {
      console.log(`  ${ep}: ${e.response?.status} - ${JSON.stringify(e.response?.data) || e.message}`);
    }
  }

  // Test 3: Malformed bearer header
  console.log('\n3. Malformed Bearer header:');
  for (const ep of endpoints) {
    try {
      await axios.get(`${BASE_URL}${ep}`, {
        headers: { Authorization: 'invalid_format' }
      });
      console.log(`  ${ep}: OK`);
    } catch (e) {
      console.log(`  ${ep}: ${e.response?.status} - ${JSON.stringify(e.response?.data) || e.message}`);
    }
  }

  // Test 4: Expired-like token (old JWT)
  console.log('\n4. Expired/tampered JWT:');
  const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAwMDAxfQ.fake_signature';
  for (const ep of endpoints) {
    try {
      await axios.get(`${BASE_URL}${ep}`, {
        headers: { Authorization: `Bearer ${fakeJwt}` }
      });
      console.log(`  ${ep}: OK`);
    } catch (e) {
      console.log(`  ${ep}: ${e.response?.status} - ${JSON.stringify(e.response?.data) || e.message}`);
    }
  }

  // Test 5: Valid token
  console.log('\n5. Valid token:');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@bbc.com',
    password: 'admin123'
  });
  const validToken = loginRes.data.accessToken;
  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${ep}`, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      console.log(`  ${ep}: ${res.status} OK`);
    } catch (e) {
      console.log(`  ${ep}: ${e.response?.status} - ${JSON.stringify(e.response?.data) || e.message}`);
    }
  }
}

test().catch(e => console.error('Script error:', e.message));
