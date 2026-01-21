const request = require('supertest');
const app = require('../app');

describe('Health API', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'OK');
            expect(res.body).toHaveProperty('uptime');
            expect(res.body).toHaveProperty('timestamp');
        });
    });

    describe('GET /', () => {
        it('should return API info', async () => {
            const res = await request(app).get('/');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'BBC Agents API');
            expect(res.body).toHaveProperty('version');
            expect(res.body).toHaveProperty('endpoints');
            expect(res.body.endpoints).toHaveProperty('v1', '/api/v1');
        });
    });
});

describe('API Versioning', () => {
    describe('GET /api/v1/tasks', () => {
        it('should require authentication', async () => {
            const res = await request(app).get('/api/v1/tasks');

            // Should return 401 or 403 for unauthenticated request
            expect([401, 403]).toContain(res.status);
        });
    });

    describe('GET /api/tasks (legacy)', () => {
        it('should work with legacy endpoint', async () => {
            const res = await request(app).get('/api/tasks');

            // Should return 401 or 403 for unauthenticated request (same as v1)
            expect([401, 403]).toContain(res.status);
        });
    });
});
