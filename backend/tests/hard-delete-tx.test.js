require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = async (email) => {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Demo123!' });
  return r.body.accessToken;
};

describe('Hard-delete transaction', () => {
  let testUserId;

  beforeAll(async () => {
    const u = await prisma.user.create({
      data: {
        email: `jest-harddelete-${Date.now()}@mit.edu`,
        passwordHash: 'x',
        firstName: 'Hard',
        lastName: 'Delete',
        fullName: 'Hard Delete',
        role: 'engineer',
        bio: 'Original bio',
        institution: 'MIT',
        city: 'Boston',
        country: 'USA',
        expertiseTags: ['Original'],
        portfolioLinks: ['https://example.com'],
      },
    });
    testUserId = u.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('admin hard-delete fully anonymises in a single transaction', async () => {
    const adminToken = await login('admin@healthai.edu.tr');
    const r = await request(app)
      .post(`/api/admin/users/${testUserId}/hard-delete`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(200);

    const u = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(u.email).toMatch(/^deleted-/);
    expect(u.firstName).toBe('Deleted');
    expect(u.lastName).toBe('User');
    expect(u.fullName).toBe('Deleted User');
    expect(u.bio).toBeNull();
    expect(u.institution).toBeNull();
    expect(u.city).toBeNull();
    expect(u.country).toBeNull();
    expect(u.expertiseTags).toEqual([]);
    expect(u.portfolioLinks).toEqual([]);
    expect(u.passwordHash).toBe('');
    expect(u.deletedAt).not.toBeNull();
    expect(u.status).toBe('deactivated');
  });
});
