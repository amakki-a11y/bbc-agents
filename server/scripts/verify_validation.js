const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add confirmPassword to testUser since register schema might require it or checking logic
// Previous view of authSchemas.js (client side) showed confirmPassword, but backend route (server/src/routes/auth.routes.js) didn't explicitly check confirmPassword in express-validator chain step 60.
// However, the controller might check it. Usually controller just takes email/password/name.
// I'll include it just in case controller logic expects it or if my schema changes implied it.
// Looking at step 12 originally, controller took register.
// Step 60 added checks for firstName, lastName, email, password. No confirmPassword check in route.
// So I won't send confirmPassword unless schema requires it. 
// Wait, client schema requires it. Backend usually doesn't need it if frontend checks match.
// But I'll send it if the controller expects it. I haven't seen the controller.
// I'll send basic fields first.

const timestamp = Date.now();
const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${timestamp}@example.com`,
    password: 'Password123!'
};

const runTests = async () => {
    try {
        console.log('Starting Validation Verification...');

        // 1. Invalid Email Register
        console.log('1. Testing Invalid Email Registration...');
        const res1 = await request(app).post('/auth/register').send({
            ...testUser,
            email: 'invalid-email'
        });
        if (res1.status === 400 && res1.body.error === 'Validation failed') {
            console.log('✅ PASS: Invalid email rejected');
        } else {
            console.error('❌ FAIL: Expected 400, got', res1.status, JSON.stringify(res1.body));
        }

        // 2. Short Password Register
        console.log('2. Testing Short Password Registration...');
        const res2 = await request(app).post('/auth/register').send({
            ...testUser,
            password: '123'
        });
        if (res2.status === 400) {
            console.log('✅ PASS: Short password rejected');
        } else {
            console.error('❌ FAIL: Expected 400, got', res2.status, JSON.stringify(res2.body));
        }

        // 3. Valid Register
        console.log('3. Testing Valid Registration...');
        const res3 = await request(app).post('/auth/register').send(testUser);
        if (res3.status === 201 || res3.status === 200) {
            console.log('✅ PASS: Valid registration accepted');
        } else {
            console.error('❌ FAIL: Expected 201/200, got', res3.status, JSON.stringify(res3.body));
            // If this fails, we can't continue easily
        }

        // 4. Login to get token
        console.log('4. Logging in...');
        const loginRes = await request(app).post('/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });

        if (loginRes.status !== 200) {
            console.error('❌ FAIL: Login failed', loginRes.status, loginRes.body);
            process.exit(1);
        }

        const token = loginRes.body.accessToken;
        if (!token) {
            console.error('❌ FAIL: No access token received', loginRes.body);
            process.exit(1);
        }
        console.log('✅ PASS: Login successful');

        // 5. Test Project Validation (Missing Name)
        console.log('5. Testing Project Validation (Missing Name)...');
        const res5 = await request(app).post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ description: 'No name provided' });

        if (res5.status === 400) {
            console.log('✅ PASS: Missing project name rejected');
        } else {
            console.error('❌ FAIL: Expected 400, got', res5.status, JSON.stringify(res5.body));
        }

        // 6. Test XSS Sanitization
        console.log('6. Testing XSS Sanitization...');
        const res6 = await request(app).post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'XSS Project',
                description: '<script>alert("xss")</script>Safe Content<b>Bold</b>'
            });

        if (res6.status === 201 || res6.status === 200) {
            const project = res6.body;
            // Check if description was sanitized
            // Sanitize-html default behavior or custom config
            // My custom config allows <b> etc but removes script.
            if (project.description && !project.description.includes('<script>') && project.description.includes('Safe Content')) {
                console.log('✅ PASS: XSS tag removed from description');
            } else {
                console.error('❌ FAIL: XSS tag not removed properly or content lost', project.description);
            }
        } else {
            console.error('❌ FAIL: Expected successful creation, got', res6.status, JSON.stringify(res6.body));
        }

        console.log('Verification Complete.');
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        await prisma.$disconnect();
    }
};

runTests();
