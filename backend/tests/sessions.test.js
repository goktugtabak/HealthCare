require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = (email, ua) =>
  request(app)
    .post('/api/auth/login')
    .set('User-Agent', ua || 'JestRunner/1.0')
    .send({ email, password: 'Demo123!' });

describe('Multi-device sessions (N6)', () => {
  let firstRT, secondRT;

  beforeAll(async () => {
    await prisma.session.deleteMany({
      where: { user: { email: 'mehmet.demir@metu.edu.tr' } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: 'ayse.kaya@hacettepe.edu.tr' } },
    });
  });
  afterAll(async () => {
    await prisma.session.deleteMany({
      where: { user: { email: 'mehmet.demir@metu.edu.tr' } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: 'ayse.kaya@hacettepe.edu.tr' } },
    });
    await prisma.$disconnect();
  });

  test('two logins from different UAs → both refresh tokens valid', async () => {
    const r1 = await login('mehmet.demir@metu.edu.tr', 'Mozilla/5.0 (Macintosh)');
    expect(r1.status).toBe(200);
    firstRT = r1.body.refreshToken;

    const r2 = await login('mehmet.demir@metu.edu.tr', 'Mozilla/5.0 (iPhone)');
    expect(r2.status).toBe(200);
    secondRT = r2.body.refreshToken;

    expect(firstRT).not.toBe(secondRT);

    const ref1 = await request(app).post('/api/auth/refresh').send({ refreshToken: firstRT });
    expect(ref1.status).toBe(200);
    const ref2 = await request(app).post('/api/auth/refresh').send({ refreshToken: secondRT });
    expect(ref2.status).toBe(200);
  });

  // NOT: tokenToKeep refresh sonucunda rotated; bu testin amacı 'logout başka
  // session'ı bozmuyor' — kalan aktif session sayısı doğrulanır, spesifik token
  // testi değil. Strict re-test M-01 rotation testinde zaten kapsanıyor.
  test('logout from one session does not revoke the other', async () => {
    const sessions = await prisma.session.findMany({
      where: { user: { email: 'mehmet.demir@metu.edu.tr' }, revokedAt: null },
      orderBy: { lastUsedAt: 'desc' },
    });
    expect(sessions.length).toBe(2);
    const tokenToRevoke = sessions[0].refreshToken;
    const tokenToKeep = sessions[1].refreshToken;

    // Get an access token via the kept session's refresh
    const r = await request(app).post('/api/auth/refresh').send({ refreshToken: tokenToKeep });
    const at = r.body.accessToken;

    // Logout the OTHER session
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${at}`)
      .send({ refreshToken: tokenToRevoke });

    // tokenToRevoke now invalid
    const try1 = await request(app).post('/api/auth/refresh').send({ refreshToken: tokenToRevoke });
    expect(try1.status).toBe(401);

    // Confirm at least one active session remains (tokenToKeep was rotated by the refresh above).
    const remaining = await prisma.session.count({
      where: { user: { email: 'mehmet.demir@metu.edu.tr' }, revokedAt: null },
    });
    expect(remaining).toBeGreaterThanOrEqual(1);
  });

  test('GET /auth/sessions returns active sessions list (no token leak)', async () => {
    const r = await login('ayse.kaya@hacettepe.edu.tr');
    const at = r.body.accessToken;
    const sess = await request(app).get('/api/auth/sessions').set('Authorization', `Bearer ${at}`);
    expect(sess.status).toBe(200);
    expect(Array.isArray(sess.body.sessions)).toBe(true);
    expect(sess.body.sessions.length).toBeGreaterThanOrEqual(1);
    expect(sess.body.sessions[0]).toHaveProperty('device');
    expect(sess.body.sessions[0]).toHaveProperty('createdAt');
    // Refresh token MUST NOT leak
    expect(sess.body.sessions[0].refreshToken).toBeUndefined();
  });

  test('hard-deleted user has all sessions removed', async () => {
    const u = await prisma.user.create({
      data: {
        email: `jest-sessions-cleanup-${Date.now()}@mit.edu`,
        passwordHash: 'x',
        firstName: 'Cleanup',
        lastName: 'Test',
        fullName: 'Cleanup Test',
        role: 'engineer',
      },
    });
    await prisma.session.create({
      data: {
        userId: u.id,
        refreshToken: `jest-rt-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const adminLogin = await login('admin@healthai.edu.tr');
    const adminToken = adminLogin.body.accessToken;
    const r = await request(app)
      .post(`/api/admin/users/${u.id}/hard-delete`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(200);

    const sessionCount = await prisma.session.count({ where: { userId: u.id } });
    expect(sessionCount).toBe(0);
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  });

  test('sweepExpiredSessions deletes past-expiry rows', async () => {
    const { sweepExpiredSessions } = require('../src/jobs/sweeps');
    const u = await prisma.user.findUnique({ where: { email: 'mehmet.demir@metu.edu.tr' } });
    await prisma.session.create({
      data: {
        userId: u.id,
        refreshToken: `jest-expired-${Date.now()}`,
        expiresAt: new Date(Date.now() - 86400000),
      },
    });
    const deleted = await sweepExpiredSessions();
    expect(deleted).toBeGreaterThan(0);
  });
});
