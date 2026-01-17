const request = require('supertest');
const app = require('../../app');
const prisma = require('../../test-utils/setup');
const { createTestUser } = require('../../test-utils/fixtures');

describe('Data Routes (Projects)', () => {
    let token;
    let userId;

    beforeEach(async () => {
        const { user, token: t } = await createTestUser();
        token = t;
        userId = user.id;
    });

    describe('GET /api/projects', () => {
        it('should return 401 if not authenticated', async () => {
            const res = await request(app).get('/api/projects');
            expect(res.statusCode).toBe(401); // Or 403 depending on middleware
        });

        it('should return empty list for new user', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });
    });

    describe('POST /api/projects', () => {
        it('should create a new project', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Project',
                    description: 'Project Description'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('New Project');

            // Verify in DB
            const project = await prisma.project.findUnique({
                where: { id: res.body.id }
            });
            expect(project).toBeDefined();
            expect(project.user_id).toBe(userId);
        });
    });
});
