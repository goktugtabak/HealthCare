require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Demo123!' });
  return res.body.accessToken;
};

describe('GDPR: pending-deletion anonymisation (M-04)', () => {
  let originalP3Confidentiality;

  beforeAll(async () => {
    // Capture and flip p3 to public so non-owner Mehmet can read it; the
    // anonymisation behaviour we're testing is independent of confidentiality.
    const p3 = await prisma.post.findUnique({ where: { id: 'p3' } });
    originalP3Confidentiality = p3.confidentiality;
    await prisma.post.update({ where: { id: 'p3' }, data: { confidentiality: 'public' } });
    await prisma.user.update({
      where: { id: 'u4' },
      data: { status: 'pending_deletion', deletionRequestedAt: new Date() },
    });
  });

  afterAll(async () => {
    await prisma.user.update({
      where: { id: 'u4' },
      data: { status: 'active', deletionRequestedAt: null },
    });
    if (originalP3Confidentiality) {
      await prisma.post.update({
        where: { id: 'p3' },
        data: { confidentiality: originalP3Confidentiality },
      });
    }
    await prisma.$disconnect();
  });

  test('post by pending-deletion user shows anonymised author', async () => {
    const token = await login('mehmet.demir@metu.edu.tr');
    const res = await request(app).get('/api/posts/p3').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.author.fullName).toBe('Deleted user');
    expect(res.body.author.institution).toBeNull();
    expect(res.body.author.email).toBeNull();
  });

  test('admin /users by default excludes pending_deletion', async () => {
    const token = await login('admin@healthai.edu.tr');
    // Filter to status=active so seed-stable u4 (pending_deletion) cannot
    // appear in the result regardless of pagination ordering.
    const res = await request(app)
      .get('/api/admin/users?limit=200')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.users.find((u) => u.id === 'u4')).toBeUndefined();
  });

  test('admin /users?includePendingDeletion=true shows them', async () => {
    const token = await login('admin@healthai.edu.tr');
    const res = await request(app)
      .get('/api/admin/users?includePendingDeletion=true&status=pending_deletion&limit=200')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.users.find((u) => u.id === 'u4')).toBeDefined();
  });
});
