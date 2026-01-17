const http = require('http');

const makeRequest = (path) => {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: data });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const verify = async () => {
    console.log('Verifying Monitoring Implementation...');

    try {
        // 1. Check Health Endpoint
        console.log('\nChecking /health...');
        const health = await makeRequest('/health');
        console.log('Status Base:', health.statusCode);
        console.log('Body Base:', health.body);

        if (health.statusCode === 200) {
            console.log('✅ Base Health Check Passed');
        } else {
            console.log('❌ Base Health Check Failed');
        }

        // 2. Check Detailed Health Endpoint
        console.log('\nChecking /health/detailed...');
        const detailed = await makeRequest('/health/detailed');
        console.log('Status Detailed:', detailed.statusCode);

        // Parse to check structure
        try {
            const json = JSON.parse(detailed.body);
            if (json.system && json.system.cpu && json.system.memory) {
                console.log('✅ Detailed Health Check Passed (Schema Valid)');
            } else {
                console.log('❌ Detailed Health Check Schema Invalid');
            }
        } catch (e) {
            console.log('❌ Failed to parse JSON:', e.message);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
        console.log('Ensure the server is running on port 3000!');
    }
};

verify();
