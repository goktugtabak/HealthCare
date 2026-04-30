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

describe('H-01 / FR-10 — confidentiality enforcement on post reads', () => {
  // Seed: p1 confidential (owner u1 Ayse healthcare), mr1 attaches u2 (Mehmet
  // engineer) to p1 in pending status. We mutate mr1.status for the
  // accepted-meeting case and restore it after.
  let ayseToken; // u1 — owner of p1
  let mehmetToken; // u2 — engineer with pending meeting on p1
  let elifToken; // u3 — healthcare, no meeting on p1
  let adminToken;
  let originalMr1Status;

  beforeAll(async () => {
    const login = async (email) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'Demo123!' });
      return res.body.accessToken;
    };
    ayseToken = await login('ayse.kaya@hacettepe.edu.tr');
    mehmetToken = await login('mehmet.demir@metu.edu.tr');
    elifToken = await login('elif.yilmaz@itu.edu.tr');
    adminToken = await login('admin@healthai.edu.tr');
    const mr = await prisma.meetingRequest.findUnique({ where: { id: 'mr1' } });
    originalMr1Status = mr.status;
  });

  afterAll(async () => {
    if (originalMr1Status) {
      await prisma.meetingRequest.update({
        where: { id: 'mr1' },
        data: { status: originalMr1Status },
      });
    }
    await prisma.$disconnect();
  });

  test('engineer without accepted meeting → 403 on confidential post', async () => {
    // mr1 is in 'pending' (or whatever the seed left). Force it to a
    // non-accepting state so this test is independent of seed ordering.
    await prisma.meetingRequest.update({ where: { id: 'mr1' }, data: { status: 'pending' } });
    const res = await request(app)
      .get('/api/posts/p1')
      .set('Authorization', `Bearer ${mehmetToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/confidential/i);
  });

  test('engineer with accepted MeetingRequest on confidential post → 200', async () => {
    await prisma.meetingRequest.update({ where: { id: 'mr1' }, data: { status: 'accepted' } });
    const res = await request(app)
      .get('/api/posts/p1')
      .set('Authorization', `Bearer ${mehmetToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
  });

  test('different healthcare user (no meeting) → 403 on confidential post', async () => {
    const res = await request(app)
      .get('/api/posts/p1')
      .set('Authorization', `Bearer ${elifToken}`);
    expect(res.status).toBe(403);
  });

  test('admin → 200 on any confidential post', async () => {
    const res = await request(app)
      .get('/api/posts/p1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('owner → 200 on own confidential post', async () => {
    const res = await request(app)
      .get('/api/posts/p1')
      .set('Authorization', `Bearer ${ayseToken}`);
    expect(res.status).toBe(200);
  });

  test('public post is readable by any authenticated user', async () => {
    // p2 is public. Have all four roles read it.
    for (const tok of [ayseToken, mehmetToken, elifToken, adminToken]) {
      const res = await request(app)
        .get('/api/posts/p2')
        .set('Authorization', `Bearer ${tok}`);
      expect(res.status).toBe(200);
    }
  });

  test('listPosts filters out non-public posts the engineer cannot see', async () => {
    await prisma.meetingRequest.update({ where: { id: 'mr1' }, data: { status: 'pending' } });
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${elifToken}`);
    expect(res.status).toBe(200);
    const visibleIds = res.body.posts.map((p) => p.id);
    expect(visibleIds).not.toContain('p1'); // p1 is confidential, elif has no meeting
  });
});
