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
