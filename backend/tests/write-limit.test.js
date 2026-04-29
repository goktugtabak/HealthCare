// H-05 / H-06: per-user write limit. Loaded as its own jest module so the
// env override applies before src/index.js (and the writeLimit middleware)
// is required. Uses a tiny limit so the test stays fast.

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://healthai_user:healthai_password@localhost:5434/healthai_db';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'jest-test-secret-32-char-minimum-jest-test-secret-32-char-minimum';
process.env.ALLOW_UNVERIFIED = 'true';
process.env.RATE_LIMIT_MAX = '1000';
process.env.AUTH_RATE_LIMIT_MAX = '50';
process.env.WRITE_RATE_LIMIT_MAX = '5';
process.env.WRITE_RATE_LIMIT_WINDOW_MS = '60000';
delete process.env.TRUST_PROXY;

const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = async (email) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Demo123!' });
  return res.body.accessToken;
};

const createPostBody = (titleSuffix) => ({
  title: `H-05 spam ${titleSuffix}`,
  workingDomain: 'Cardiology',
  shortExplanation: 'Per-user write rate limit assertion.',
  requiredExpertise: ['ML'],
  projectStage: 'ideation',
  collaborationType: 'Co-Development',
  confidentiality: 'public',
  commitmentLevel: 'Part-time',
  highLevelIdea: 'jest H-05 fixture — should be deleted in afterAll.',
  country: 'Turkey',
  city: 'Ankara',
  autoClose: false,
  publish: false,
});

describe('H-05 / H-06 — per-user write rate limit', () => {
  let token;

  beforeAll(async () => {
    token = await login('mehmet.demir@metu.edu.tr');
  });

  afterAll(async () => {
    await prisma.post
      .deleteMany({ where: { title: { startsWith: 'H-05 spam ' } } })
      .catch(() => {});
    await prisma.$disconnect();
  });

  test('the 6th create-post call from the same user returns 429', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(createPostBody(`${Date.now()}-${i}`));
      statuses.push(res.status);
    }
    // First 5 should be 201; the 6th must be 429.
    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
