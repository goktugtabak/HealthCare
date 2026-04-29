const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { recordAuditLog, verifyAuditChain } = require('../services/audit');
const { safeId, safeQueryString } = require('../middleware/sanitizers');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const adminFullName = (u) =>
  u?.fullName || [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Admin';

router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('role').optional().isIn(['engineer', 'healthcare', 'admin']),
    query('status').optional().isIn(['active', 'suspended', 'deactivated', 'pending_deletion']),
    safeQueryString('search', 200),
    query('includePendingDeletion').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, status, search, includePendingDeletion } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { institution: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          role: true,
          institution: true,
          city: true,
          country: true,
          status: true,
          emailVerified: true,
          domainVerified: true,
          profileCompleteness: true,
          deletionRequestedAt: true,
          lastActiveAt: true,
          createdAt: true,
          _count: { select: { posts: true, sentMessages: true, meetingRequests: true } },
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

router.get('/users/:id/metrics', [safeId('id')], validate, async (req, res, next) => {
  try {
    const id = req.params.id;
    const [user, posts, sent, received, accepted, declined, messages, logs] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, fullName: true, role: true, lastActiveAt: true, profileCompleteness: true, status: true },
      }),
      prisma.post.count({ where: { authorId: id, deletedAt: null } }),
      prisma.meetingRequest.count({ where: { requestorId: id } }),
      prisma.meetingRequest.count({ where: { recipientId: id } }),
      prisma.meetingRequest.count({ where: { recipientId: id, status: { in: ['accepted', 'scheduled'] } } }),
      prisma.meetingRequest.count({ where: { recipientId: id, status: 'declined' } }),
      prisma.message.count({ where: { senderId: id, deletedAt: null } }),
      prisma.auditLog.count({ where: { userId: id } }),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user,
      metrics: {
        postsCreated: posts,
        meetingsRequested: sent,
        meetingsReceived: received,
        meetingsAccepted: accepted,
        meetingsDeclined: declined,
        messagesSent: messages,
        auditLogCount: logs,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/posts',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('status').optional().isString().trim().isLength({ max: 32 }).matches(/^[a-zA-Z_]+$/),
    safeQueryString('city', 100),
    safeQueryString('domain', 200),
  ],
  validate,
  async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, city, domain } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(status && { status }),
      ...(city && { city: { equals: city, mode: 'insensitive' } }),
      ...(domain && {
        OR: [
          { workingDomain: { contains: domain, mode: 'insensitive' } },
          { domain: { contains: domain, mode: 'insensitive' } },
        ],
      }),
    };
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { id: true, firstName: true, lastName: true, fullName: true, email: true, role: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
          _count: { select: { messages: true, meetingRequests: true } },
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

router.delete('/posts/:id', [safeId('id')], validate, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await prisma.post.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        status: 'removed',
        statusHistory: {
          create: { status: 'removed', changedBy: req.user.id, reason: req.body?.reason || 'Removed by admin' },
        },
      },
    });
    await recordAuditLog({
      userId: req.user.id,
      userName: adminFullName(req.user),
      role: 'admin',
      action: 'admin_post_remove',
      actionType: 'Admin Removed Post',
      resource: 'post',
      resourceId: post.id,
      targetEntity: post.title,
      details: { reason: req.body?.reason || null },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ message: 'Post removed' });
  } catch (err) {
    next(err);
  }
});

// C-02 / C-03: any state change that takes a user out of "active admin"
// circulation must refuse to (a) hit the calling admin's own account or
// (b) leave the platform with zero active admins. SELF_DESTRUCTIVE_STATUSES
// captures the destinations that disable login for the target.
const SELF_DESTRUCTIVE_STATUSES = new Set(['suspended', 'deactivated']);

const guardAdminInvariant = async (req, res, target, status) => {
  if (req.user.id === target.id && SELF_DESTRUCTIVE_STATUSES.has(status)) {
    res.status(403).json({
      error: 'Cannot perform this action on your own admin account',
    });
    return false;
  }
  if (target.role === 'admin' && SELF_DESTRUCTIVE_STATUSES.has(status)) {
    const activeAdminCount = await prisma.user.count({
      where: { role: 'admin', status: 'active', deletedAt: null },
    });
    if (activeAdminCount <= 1) {
      res.status(403).json({
        error: 'Cannot leave the platform without an active admin',
      });
      return false;
    }
  }
  return true;
};

const setUserStatus = (action, actionType, status) =>
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const ok = await guardAdminInvariant(req, res, user, status);
      if (!ok) return;
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { status },
      });
      await recordAuditLog({
        userId: req.user.id,
        userName: adminFullName(req.user),
        role: 'admin',
        action,
        actionType,
        resource: 'user',
        resourceId: user.id,
        targetEntity: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ user: { id: updated.id, status: updated.status } });
    } catch (err) {
      next(err);
    }
  };

router.post(
  '/users/:id/suspend',
  [safeId('id')],
  validate,
  setUserStatus('admin_user_suspend', 'User Suspended', 'suspended')
);
router.post(
  '/users/:id/reactivate',
  [safeId('id')],
  validate,
  setUserStatus('admin_user_reactivate', 'User Reactivated', 'active')
);
router.post(
  '/users/:id/deactivate',
  [safeId('id')],
  validate,
  setUserStatus('admin_user_deactivate', 'User Deactivated', 'deactivated')
);

router.post('/users/:id/verify-domain', [safeId('id')], validate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { domainVerified: true },
    });
    await recordAuditLog({
      userId: req.user.id,
      userName: adminFullName(req.user),
      role: 'admin',
      action: 'admin_verify_domain',
      actionType: 'Domain Verified',
      resource: 'user',
      resourceId: user.id,
      targetEntity: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ user: { id: updated.id, domainVerified: true } });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/hard-delete', [safeId('id')], validate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // C-02: an admin cannot brick the platform by purging their own account...
    if (req.user.id === user.id) {
      return res.status(403).json({
        error: 'Cannot perform this action on your own admin account',
      });
    }
    // ...and the last remaining active admin can't be hard-deleted by anyone.
    if (user.role === 'admin') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'admin', status: 'active', deletedAt: null },
      });
      if (activeAdminCount <= 1) {
        return res.status(403).json({
          error: 'Cannot leave the platform without an active admin',
        });
      }
    }

    await prisma.$transaction([
      prisma.message.updateMany({ where: { OR: [{ senderId: user.id }, { recipientId: user.id }] }, data: { deletedAt: new Date() } }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          status: 'deactivated',
          email: `deleted-${user.id}@deleted.invalid`,
          firstName: 'Deleted',
          lastName: 'User',
          fullName: 'Deleted User',
          passwordHash: '',
          institution: null,
          bio: null,
          city: null,
          country: null,
          expertiseTags: [],
          interestTags: [],
          portfolioSummary: null,
          portfolioLinks: [],
          preferredContactMethod: null,
          preferredContactValue: null,
          avatar: null,
          verifyToken: null,
          refreshToken: null,
        },
      }),
    ]);

    await recordAuditLog({
      userId: req.user.id,
      userName: adminFullName(req.user),
      role: 'admin',
      action: 'admin_user_hard_delete',
      actionType: 'User Hard Deleted',
      resource: 'user',
      resourceId: user.id,
      targetEntity: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'User permanently anonymized' });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalPosts, activePosts, partnerFound, scheduled, totalMessages, totalMeetings] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.post.count({ where: { status: 'active', deletedAt: null } }),
      prisma.post.count({ where: { status: 'partner_found' } }),
      prisma.post.count({ where: { status: 'meeting_scheduled' } }),
      prisma.message.count({ where: { deletedAt: null } }),
      prisma.meetingRequest.count(),
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
      partnerFound,
      meetingsScheduled: scheduled,
      totalMessages,
      totalMeetings,
      matchRate: totalPosts ? Math.round((partnerFound / totalPosts) * 1000) / 10 : 0,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count.role })),
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('userId').optional().isUUID(),
    safeQueryString('action', 100),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('result').optional().isIn(['success', 'failure', 'warning']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 100, userId, action, from, to, result } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {
        ...(userId && { userId }),
        ...(action && { action: { contains: action, mode: 'insensitive' } }),
        ...(result && { resultStatus: result }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: { user: { select: { id: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/audit-logs/export',
  [
    query('userId').optional().isUUID(),
    safeQueryString('action', 100),
    query('result').optional().isIn(['success', 'failure', 'warning']),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
  try {
    const where = {};
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.action) where.action = { contains: req.query.action, mode: 'insensitive' };
    if (req.query.result) where.resultStatus = req.query.result;
    if (req.query.from || req.query.to) {
      where.createdAt = {
        ...(req.query.from && { gte: new Date(req.query.from) }),
        ...(req.query.to && { lte: new Date(req.query.to) }),
      };
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`
    );

    const cols = [
      'id',
      'createdAt',
      'userId',
      'userName',
      'role',
      'actionType',
      'resource',
      'resourceId',
      'targetEntity',
      'resultStatus',
      'ipPreview',
      'hash',
      'prevHash',
    ];
    res.write(cols.join(',') + '\n');

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const PAGE = 500;
    let cursor;
    while (true) {
      const batch = await prisma.auditLog.findMany({
        where,
        take: PAGE,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'asc' },
      });
      if (batch.length === 0) break;
      for (const log of batch) {
        res.write(
          cols
            .map((c) =>
              c === 'createdAt' && log[c]
                ? escape(new Date(log[c]).toISOString())
                : escape(log[c])
            )
            .join(',') + '\n'
        );
      }
      cursor = batch[batch.length - 1].id;
      if (batch.length < PAGE) break;
    }

    await recordAuditLog({
      userId: req.user.id,
      userName: adminFullName(req.user),
      role: 'admin',
      action: 'admin_audit_export',
      actionType: 'Audit Log CSV Exported',
      resource: 'audit_log',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.end();
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs/verify-chain', async (req, res, next) => {
  try {
    const result = await verifyAuditChain();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
