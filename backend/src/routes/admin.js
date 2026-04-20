const express = require('express');
const { query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, requireRole('admin'));

const log = (userId, action, resource, resourceId, req) =>
  prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, institution: true, verifiedAt: true, createdAt: true,
          _count: { select: { posts: true, sentMessages: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

router.get('/posts', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { ...(status && { status }) };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    await log(req.user.id, 'DELETE_USER', 'user', req.params.id, req);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await prisma.post.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: 'expired' },
    });

    await log(req.user.id, 'DELETE_POST', 'post', req.params.id, req);
    res.json({ message: 'Post removed' });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalPosts, activePosts, totalMessages] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: 'active', deletedAt: null } }),
      prisma.message.count({ where: { deletedAt: null } }),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { deletedAt: null },
    });

    res.json({
      totalUsers,
      totalPosts,
      activePosts,
      totalMessages,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count.role })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await prisma.auditLog.findMany({
      skip,
      take: parseInt(limit),
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
