require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');
const { sweepDeletions } = require('../src/jobs/sweeps');

const login = async (email) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Demo123!' });
  return res.body.accessToken;
};

describe('Admin endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await login('admin@healthai.edu.tr');
  });

  afterAll(async () => {
    // Restore u5 back to active (in case suspend test ran)
    await prisma.user.update({ where: { id: 'u5' }, data: { status: 'active', deletionRequestedAt: null } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('non-admins cannot access admin endpoints', async () => {
    const engToken = await login('mehmet.demir@metu.edu.tr');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${engToken}`);
    expect(res.status).toBe(403);
  });

  test('admin stats returns aggregates', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalUsers).toBe('number');
    expect(typeof res.body.matchRate).toBe('number');
  });

  test('audit log filter by action returns matching subset', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?action=Login&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
    for (const log of res.body.logs) {
      expect((log.actionType || log.action).toLowerCase()).toContain('login');
    }
  });

  test('CSV export streams with hash + prevHash columns', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs/export')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/i);
    const firstLine = res.text.split('\n')[0];
    expect(firstLine).toContain('hash');
    expect(firstLine).toContain('prevHash');
  });

  test('hash chain verifier reports valid', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs/verify-chain')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('admin can suspend + reactivate user', async () => {
    const suspend = await request(app)
      .post('/api/admin/users/u5/suspend')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(suspend.status).toBe(200);
    expect(suspend.body.user.status).toBe('suspended');

    const reactivate = await request(app)
      .post('/api/admin/users/u5/reactivate')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.user.status).toBe('active');
  });

  test('72h pending-deletion sweep purges due accounts', async () => {
    // Stage a user with deletionRequestedAt 4 days ago
    const test = await prisma.user.create({
      data: {
        email: `jest-sweep-${Date.now()}@mit.edu`,
        passwordHash: 'x',
        firstName: 'Sweep',
        lastName: 'Test',
        fullName: 'Sweep Test',
        role: 'engineer',
        status: 'pending_deletion',
        deletionRequestedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    });
    const purged = await sweepDeletions();
    expect(purged).toBeGreaterThan(0);
    const after = await prisma.user.findUnique({ where: { id: test.id } });
    expect(after.deletedAt).not.toBeNull();
    expect(after.email).toMatch(/^deleted-/);
  });
});
