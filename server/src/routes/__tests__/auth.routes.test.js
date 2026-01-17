const request = require('supertest');
const app = require('../../app');
const prisma = require('../../test-utils/setup');

describe('Auth Routes', () => {
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: 'Password123!'
                });

            if (res.statusCode !== 201) {
                console.log('Register error body:', JSON.stringify(res.body, null, 2));
            }

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe('test@example.com');
            expect(res.body).toHaveProperty('accessToken');
        });

        it('should fail if email already exists', async () => {
            // first registration
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Duplicate',
                    lastName: 'User',
                    email: 'duplicate@example.com',
                    password: 'Password123!'
                });

            // second registration
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Duplicate',
                    lastName: 'User',
                    email: 'duplicate@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toBe(409); // Assuming 409 for duplicate email
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            // Register first
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Login',
                    lastName: 'User',
                    email: 'login@example.com',
                    password: 'Password123!'
                });

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
        });

        it('should fail with invalid credentials', async () => {
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'LoginFail',
                    lastName: 'User',
                    email: 'login_fail@example.com',
                    password: 'Password123!'
                });

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login_fail@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401); // Assuming 401 for unauthorized
        });
    });
});
