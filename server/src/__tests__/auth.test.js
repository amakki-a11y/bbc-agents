const request = require('supertest');
const app = require('../app');
const { prisma, TEST_PREFIX } = require('../test-utils/setup');

describe('Auth API', () => {
    // Generate unique test email with timestamp and random suffix
    const testEmail = `${TEST_PREFIX}auth_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
    const testUser = {
        email: testEmail,
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User'
    };

    // Clean up any existing test user with same email before tests
    beforeAll(async () => {
        try {
            await prisma.user.deleteMany({
                where: { email: testEmail }
            });
        } catch (e) {
            // Ignore - user might not exist
        }
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should reject duplicate email', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(testUser);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Email already exists');
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'weak@test.com',
                    password: '123',
                    firstName: 'Weak',
                    lastName: 'Pass'
                });

            expect(res.status).toBe(400);
        });

        it('should reject invalid email', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'not-an-email',
                    password: 'Test1234!',
                    firstName: 'Invalid',
                    lastName: 'Email'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'Test1234!'
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid credentials');
        });
    });

    describe('POST /auth/refresh', () => {
        let refreshToken;

        beforeAll(async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            refreshToken = res.body.refreshToken;
        });

        it('should refresh token with valid refresh token', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
        });

        it('should reject invalid refresh token', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(res.status).toBe(403);
        });

        it('should reject missing refresh token', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .send({});

            // Accept either 400 (bad request) or 401 (unauthorized) for missing token
            expect([400, 401]).toContain(res.status);
        });
    });
});
