require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');
const { calculateProfileCompleteness } = require('../src/services/users');

const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Demo123!' });
  return res.body.accessToken;
};

describe('FR-46 profile completeness recompute', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('engineer with 3 tags + portfolio reaches >= 80', () => {
    const score = calculateProfileCompleteness({
      role: 'engineer',
      institution: 'METU',
      city: 'Ankara',
      country: 'Turkey',
      bio: 'AI researcher',
      preferredContactValue: 'a@b.edu',
      expertiseTags: ['ML', 'CV', 'NLP'],
      portfolioSummary: 'Yes',
      portfolioLinks: ['https://github.com/x'],
      onboardingCompleted: true,
    });
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('PATCH /me recomputes profileCompleteness', async () => {
    const token = await login('mehmet.demir@metu.edu.tr');
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Updated bio for completeness test' });
    expect(res.status).toBe(200);
    expect(typeof res.body.profileCompleteness).toBe('number');
    expect(res.body.profileCompleteness).toBeGreaterThan(0);
  });

  test('admin role always returns 100', () => {
    expect(calculateProfileCompleteness({ role: 'admin' })).toBe(100);
  });
});
