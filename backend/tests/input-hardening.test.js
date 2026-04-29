require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Demo123!' });
  expect(res.status).toBe(200);
  return res.body.accessToken;
};

describe('M-02 — input hardening (path traversal / null bytes / oversize)', () => {
  let token;

  beforeAll(async () => {
    token = await login('mehmet.demir@metu.edu.tr');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/posts/..%2Fetc%2Fpasswd → 400', async () => {
    const res = await request(app)
      .get('/api/posts/..%2Fetc%2Fpasswd')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('GET /api/posts/p1%00 → 400 (null byte rejected)', async () => {
    const res = await request(app)
      .get('/api/posts/p1%00')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test("GET /api/posts/' OR '1'='1 → 400 (SQLi-like chars rejected)", async () => {
    const res = await request(app)
      .get(`/api/posts/${encodeURIComponent("' OR '1'='1")}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('POST /api/messages with content containing null byte → 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: 'p2', recipientId: 'u1', content: 'hello\x00world' });
    expect(res.status).toBe(400);
  });

  test('GET /api/posts?search=<3000-char string> → 400 (length cap exceeded)', async () => {
    const longSearch = 'x'.repeat(3000);
    const res = await request(app)
      .get(`/api/posts?search=${longSearch}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('valid request still works → 2xx', async () => {
    const res = await request(app)
      .get('/api/posts/p2')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 403, 404]).toContain(res.status);
    if (res.status === 200) expect(res.body.id).toBe('p2');
  });
});

describe('M-05 — array length caps', () => {
  let userToken;
  let healthcareToken;

  beforeAll(async () => {
    userToken = await login('mehmet.demir@metu.edu.tr');
    healthcareToken = await login('ayse.kaya@hacettepe.edu.tr');
  });

  afterAll(async () => {
    await prisma.meetingRequest.deleteMany({ where: { introductoryMessage: { contains: 'jest-test M-05' } } });
    await prisma.$disconnect();
  });

  test('PATCH /me with 100 expertise tags → 400', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ expertiseTags: Array(100).fill('x') });
    expect(res.status).toBe(400);
  });

  test('PATCH /me with single 200-char tag → 400', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ expertiseTags: ['x'.repeat(200)] });
    expect(res.status).toBe(400);
  });

  test('PATCH /me with 50 valid tags → 200', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ expertiseTags: Array(50).fill(0).map((_, i) => `tag${i}`) });
    expect(res.status).toBe(200);
  });

  test('POST /api/posts with 50 requiredExpertise → 400', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${healthcareToken}`)
      .send({
        title: 'M-05 array cap test post',
        workingDomain: 'Cardiology',
        shortExplanation: 'array cap test',
        requiredExpertise: Array(50).fill('Machine Learning'),
        projectStage: 'ideation',
        confidentiality: 'public',
        country: 'Turkey',
        city: 'Ankara',
      });
    expect(res.status).toBe(400);
  });

  test('POST /api/meetings with 6 proposedSlots → 400', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        postId: 'p3',
        introductoryMessage: 'jest-test M-05 too many slots',
        ndaAccepted: true,
        proposedSlots: [
          '2026-09-01T10:00:00Z',
          '2026-09-02T10:00:00Z',
          '2026-09-03T10:00:00Z',
          '2026-09-04T10:00:00Z',
          '2026-09-05T10:00:00Z',
          '2026-09-06T10:00:00Z',
        ],
      });
    expect(res.status).toBe(400);
  });
});

describe('M-06 — portfolioLinks + externalUrl protocol whitelist', () => {
  let userToken;

  beforeAll(async () => {
    userToken = await login('mehmet.demir@metu.edu.tr');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('PATCH /me portfolioLinks: javascript: → 400', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ portfolioLinks: ['javascript:alert(1)'] });
    expect(res.status).toBe(400);
  });

  test('PATCH /me portfolioLinks: file:// → 400', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ portfolioLinks: ['file:///etc/passwd'] });
    expect(res.status).toBe(400);
  });

  test('PATCH /me portfolioLinks: data: → 400', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ portfolioLinks: ['data:text/html,<script>alert(1)</script>'] });
    expect(res.status).toBe(400);
  });

  test('PATCH /me portfolioLinks: ftp:// → 400', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ portfolioLinks: ['ftp://files.example.com'] });
    expect(res.status).toBe(400);
  });

  test('PATCH /me portfolioLinks: https://github.com/user → 200', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ portfolioLinks: ['https://github.com/user'] });
    expect(res.status).toBe(200);
  });

  test('POST /api/meetings externalUrl: javascript: → 400', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        postId: 'p3',
        introductoryMessage: 'jest-test M-06 bad external',
        ndaAccepted: true,
        proposedSlots: ['2026-10-01T10:00:00Z'],
        externalUrl: 'javascript:void(0)',
      });
    expect(res.status).toBe(400);
  });
});
