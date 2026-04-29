require('./setup');
const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/lib/prisma');

const login = async (email) => {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Demo123!' });
  return r.body.accessToken;
};

describe('Notification ownership', () => {
  let userBNotificationId;

  beforeAll(async () => {
    const userB = await prisma.user.findUnique({
      where: { email: 'ayse.kaya@hacettepe.edu.tr' },
    });
    const n = await prisma.notification.create({
      data: {
        userId: userB.id,
        type: 'account',
        title: 'Jest test notification',
        body: 'Jest ownership test notification',
      },
    });
    userBNotificationId = n.id;
  });

  afterAll(async () => {
    await prisma.notification.delete({ where: { id: userBNotificationId } }).catch(() => {});
    await prisma.$disconnect();
  });

  test("user A cannot mark user B's notification as read", async () => {
    const tokenA = await login('mehmet.demir@metu.edu.tr');
    const r = await request(app)
      .post(`/api/notifications/${userBNotificationId}/read`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(r.status).toBe(404); // 404 hides existence — security best practice
  });

  test('user B can mark their own notification as read', async () => {
    const tokenB = await login('ayse.kaya@hacettepe.edu.tr');
    const r = await request(app)
      .post(`/api/notifications/${userBNotificationId}/read`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(r.status).toBe(200);
    expect(r.body.isRead).toBe(true);
  });

  test('/notifications only returns own notifications', async () => {
    const tokenA = await login('mehmet.demir@metu.edu.tr');
    const r = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(r.status).toBe(200);
    expect(r.body.notifications.find((n) => n.id === userBNotificationId)).toBeUndefined();
  });
});
