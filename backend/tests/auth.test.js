require('./setup');
const { EDU_EMAIL_RE } = require('../src/services/auth');

describe('institutional email regex (FR-01)', () => {
  test('accepts plain .edu', () => {
    expect(EDU_EMAIL_RE.test('alice@mit.edu')).toBe(true);
  });

  test('accepts .edu.tr', () => {
    expect(EDU_EMAIL_RE.test('ayse.kaya@hacettepe.edu.tr')).toBe(true);
    expect(EDU_EMAIL_RE.test('mehmet.demir@metu.edu.tr')).toBe(true);
  });

  test('accepts .edu.au', () => {
    expect(EDU_EMAIL_RE.test('researcher@unimelb.edu.au')).toBe(true);
  });

  test('rejects gmail / outlook / yahoo', () => {
    expect(EDU_EMAIL_RE.test('alice@gmail.com')).toBe(false);
    expect(EDU_EMAIL_RE.test('alice@outlook.com')).toBe(false);
    expect(EDU_EMAIL_RE.test('alice@yahoo.com')).toBe(false);
  });

  test('rejects empty / malformed', () => {
    expect(EDU_EMAIL_RE.test('')).toBe(false);
    expect(EDU_EMAIL_RE.test('not an email')).toBe(false);
    expect(EDU_EMAIL_RE.test('@edu')).toBe(false);
    expect(EDU_EMAIL_RE.test('alice@.edu')).toBe(false);
  });
});

const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

describe('POST /api/auth/register honeypot', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'jest-honeypot-' } } });
    await prisma.$disconnect();
  });

  test('rejects when honeypot field is non-empty', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'jest-honeypot-bot@mit.edu',
      password: 'TestPass123!',
      firstName: 'Bot',
      lastName: 'Net',
      role: 'engineer',
      honeypot: 'i-am-a-bot',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Bot submission rejected/i);
  });

  test('rejects non-edu domains', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'jest-honeypot-other@gmail.com',
      password: 'TestPass123!',
      firstName: 'Mal',
      lastName: 'Mail',
      role: 'engineer',
    });
    // Either 400 (regex) or 422 — anything not a 201.
    expect(res.status).not.toBe(201);
  });

  test('rejects non-allowed roles', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'jest-honeypot-doctor@mit.edu',
      password: 'TestPass123!',
      firstName: 'Doc',
      lastName: 'Tor',
      role: 'doctor',
    });
    expect(res.status).toBe(400);
  });
});

describe('M-01 — refresh token rotation', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('the previous refresh token is rejected after a successful refresh', async () => {
    // Login to obtain the initial refresh token.
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mehmet.demir@metu.edu.tr', password: 'Demo123!' });
    expect(loginRes.status).toBe(200);
    const oldRefresh = loginRes.body.refreshToken;
    expect(oldRefresh).toBeTruthy();

    // First refresh succeeds and returns a new refresh token.
    const firstRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(firstRefresh.status).toBe(200);
    expect(firstRefresh.body.accessToken).toBeTruthy();
    expect(firstRefresh.body.refreshToken).toBeTruthy();
    expect(firstRefresh.body.refreshToken).not.toBe(oldRefresh);

    // Replaying the OLD refresh token must now be rejected.
    const replay = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(replay.status).toBe(401);
  });
});
