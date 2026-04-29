// C-01 — verifies that X-Forwarded-For spoofing cannot escape the auth
// rate limiter. Loaded as its own jest module so the env overrides apply
// before src/index.js is required (the limiter is built at module load).
//
// In production we DO trust XFF (Caddy rewrites it to the real client IP).
// In test there is no proxy, so trust proxy stays off and req.ip resolves
// to the loopback socket regardless of attacker-supplied XFF. With the
// explicit keyGenerator: (req) => req.ip on both limiters, every spoofed
// XFF still keys to the same bucket and gets blocked.

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://healthai_user:healthai_password@localhost:5434/healthai_db';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'jest-test-secret-32-char-minimum-jest-test-secret-32-char-minimum';
process.env.ALLOW_UNVERIFIED = 'true';
process.env.RATE_LIMIT_MAX = '1000';
process.env.AUTH_RATE_LIMIT_MAX = '10';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';
delete process.env.TRUST_PROXY;

const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

describe('C-01 — rate limiter cannot be bypassed via X-Forwarded-For', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('11th failed login is 429 even with a different spoofed XFF on every attempt', async () => {
    let attemptStatuses = [];
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `203.0.113.${i + 1}`)
        .send({ email: 'jest-c01-nobody@mit.edu', password: 'WrongPass!' });
      attemptStatuses.push(res.status);
    }

    // First 10 should be 401 (auth fail). The 11th must be 429 — proving
    // the limiter still applied despite varying XFF on each request.
    expect(attemptStatuses[10]).toBe(429);
    expect(attemptStatuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(1);
  });
});
