require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = async (email) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Demo123!' });
  expect(res.status).toBe(200);
  return res.body.accessToken;
};

describe('Posts RBAC + status transitions', () => {
  let healthcareToken;
  let engineerToken;
  let p3OwnerToken; // Can Ozturk

  beforeAll(async () => {
    healthcareToken = await login('ayse.kaya@hacettepe.edu.tr');
    engineerToken = await login('mehmet.demir@metu.edu.tr');
    p3OwnerToken = await login('can.ozturk@bilkent.edu.tr');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('healthcare role can publish posts (UC-05)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${healthcareToken}`)
      .send({
        title: 'Healthcare jest test post',
        workingDomain: 'Cardiology',
        shortExplanation: 'Lorem ipsum description for jest healthcare post.',
        requiredExpertise: ['Machine Learning'],
        projectStage: 'ideation',
        confidentiality: 'public',
        commitmentLevel: 'Part-time',
        collaborationType: 'Co-Development',
        country: 'Turkey',
        city: 'Ankara',
        autoClose: false,
        publish: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active');
    expect(res.body.ownerRole).toBe('healthcare');
    await prisma.post.delete({ where: { id: res.body.id } });
  });

  test('post status transition writes PostStatusHistory', async () => {
    // Use seed post p3 owned by Can (engineer)
    const before = await prisma.post.findUnique({
      where: { id: 'p3' },
      include: { statusHistory: true },
    });
    const initialHistoryCount = before.statusHistory.length;
    const initialStatus = before.status;

    const target = initialStatus === 'partner_found' ? 'active' : 'partner_found';
    const res = await request(app)
      .post('/api/posts/p3/status')
      .set('Authorization', `Bearer ${p3OwnerToken}`)
      .send({ status: target, reason: 'jest transition' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(target === 'active' ? 'active' : 'partner_found');

    const after = await prisma.post.findUnique({
      where: { id: 'p3' },
      include: { statusHistory: true },
    });
    expect(after.statusHistory.length).toBeGreaterThan(initialHistoryCount);

    // Restore original status
    await prisma.post.update({
      where: { id: 'p3' },
      data: { status: initialStatus },
    });
  });

  test('owner-only edit enforcement', async () => {
    // engineer (Mehmet) cannot edit healthcare-owned p1
    const res = await request(app)
      .put('/api/posts/p1')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Hijack attempt' });
    expect(res.status).toBe(403);
  });
});
