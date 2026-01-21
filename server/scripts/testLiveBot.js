/**
 * Test Live BBC Assistant Bot API
 */

const https = require('https');

const BASE_URL = 'back-end-production-bad8.up.railway.app';

// Helper to make HTTPS requests
const request = (method, path, data = null, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         BBC ASSISTANT - LIVE API TEST                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Test 1: Server health
    console.log('1. Testing server health...');
    try {
        const health = await request('GET', '/');
        console.log(`   ✅ Server responding: Status ${health.status}\n`);
    } catch (e) {
        console.log(`   ❌ Server error: ${e.message}\n`);
        return;
    }

    // Test 2: Register or login
    console.log('2. Authenticating...');
    let token = null;

    // First try to register a test user
    try {
        console.log('   Registering test user...');
        const register = await request('POST', '/auth/register', {
            firstName: 'Test',
            lastName: 'Bot',
            email: 'testbot@bbcorp.trade',
            password: 'testbot123'
        });

        if (register.status === 201 || register.status === 200) {
            console.log('   ✅ Test user registered');
            if (register.data.token) {
                token = register.data.token;
                console.log('   ✅ Got token from registration\n');
            }
        } else {
            console.log(`   ⚠️ Register returned: ${register.status} - ${JSON.stringify(register.data)}`);
        }
    } catch (e) {
        console.log(`   ⚠️ Register error (user may exist): ${e.message}`);
    }

    // Now try to login
    try {
        const login = await request('POST', '/auth/login', {
            email: 'testbot@bbcorp.trade',
            password: 'testbot123'
        });

        if (login.status === 200 && login.data.token) {
            token = login.data.token;
            console.log(`   ✅ Login successful\n`);
        } else {
            console.log(`   ⚠️ Login returned: ${login.status} - ${JSON.stringify(login.data)}`);

            // Try with existing user
            console.log('   Trying existing user credentials...');
            const login2 = await request('POST', '/auth/login', {
                email: 'amakki@bbcorp.trade',
                password: 'password123'
            });

            if (login2.status === 200 && login2.data.token) {
                token = login2.data.token;
                console.log(`   ✅ Login successful with existing user\n`);
            } else {
                console.log(`   ❌ Login failed: ${JSON.stringify(login2.data)}\n`);
            }
        }
    } catch (e) {
        console.log(`   ❌ Login error: ${e.message}\n`);
    }

    if (!token) {
        console.log('Cannot proceed without authentication token.');
        console.log('\nTo test manually, use:');
        console.log('1. Login: POST /api/auth/login with valid credentials');
        console.log('2. Bot: POST /api/bot/message with {"message": "pulse check"}');
        return;
    }

    // Test 3: Bot commands
    const botTests = [
        { name: 'Pulse check', message: 'pulse check' },
        { name: 'My tasks', message: 'my tasks' },
        { name: 'My goals', message: 'my goals' },
        { name: 'My stats', message: 'my stats' },
    ];

    console.log('3. Testing bot commands...\n');

    for (const test of botTests) {
        try {
            console.log(`   Testing: "${test.message}"...`);
            const response = await request('POST', '/api/bot/message', {
                message: test.message
            }, token);

            if (response.status === 200) {
                const preview = response.data.response?.substring(0, 50) || JSON.stringify(response.data).substring(0, 50);
                console.log(`   ✅ ${test.name}: ${preview}...\n`);
            } else {
                console.log(`   ❌ ${test.name}: Status ${response.status} - ${JSON.stringify(response.data).substring(0, 50)}\n`);
            }
        } catch (e) {
            console.log(`   ❌ ${test.name}: Error - ${e.message}\n`);
        }
    }

    console.log('════════════════════════════════════════════════════════════════');
    console.log('Live API test complete!');
    console.log('════════════════════════════════════════════════════════════════\n');
};

runTests().catch(console.error);
