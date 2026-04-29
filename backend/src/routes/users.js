const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { recordAuditLog } = require('../services/audit');
const emailService = require('../services/email');
const { sanitiseUserText } = require('../middleware/sanitizers');

const USER_TEXT_FIELDS = new Set([
  'firstName',
  'lastName',
  'institution',
  'bio',
  'portfolioSummary',
]);

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  fullName: true,
  role: true,
  institution: true,
  bio: true,
  city: true,
  country: true,
  expertiseTags: true,
  interestTags: true,
  portfolioSummary: true,
  portfolioLinks: true,
  preferredContactMethod: true,
  preferredContactValue: true,
  notifyInApp: true,
  notifyEmail: true,
  status: true,
  emailVerified: true,
  domainVerified: true,
  onboardingCompleted: true,
  profileCompleteness: true,
  avatar: true,
  verifiedAt: true,
  createdAt: true,
  deletionRequestedAt: true,
  lastActiveAt: true,
};

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PUBLIC_USER_FIELDS,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/me',
  authenticate,
  [
    body('firstName').optional().isString().trim().isLength({ min: 1, max: 100 }).matches(/^[^\x00]*$/),
    body('lastName').optional().isString().trim().isLength({ min: 1, max: 100 }).matches(/^[^\x00]*$/),
    body('institution').optional().isString().trim().isLength({ max: 200 }).matches(/^[^\x00]*$/),
    body('bio').optional().isString().isLength({ max: 2000 }).matches(/^[^\x00]*$/),
    body('city').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('country').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('expertiseTags').optional().isArray({ max: 50 }).withMessage('Up to 50 expertise tags'),
    body('expertiseTags.*').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('interestTags').optional().isArray({ max: 50 }),
    body('interestTags.*').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('portfolioSummary').optional().isString().isLength({ max: 2000 }).matches(/^[^\x00]*$/),
    body('portfolioLinks').optional().isArray({ max: 20 }),
    body('portfolioLinks.*')
      .optional()
      .isURL({
        protocols: ['http', 'https'],
        require_protocol: true,
        require_host: true,
        require_valid_protocol: true,
      })
      .isLength({ max: 500 }),
    body('preferredContactMethod').optional().isIn(['email', 'phone', 'linkedin', 'other']),
    body('preferredContactValue').optional().isString().trim().isLength({ max: 200 }).matches(/^[^\x00]*$/),
    body('notifyInApp').optional().isBoolean(),
    body('notifyEmail').optional().isBoolean(),
    body('avatar').optional().isString().isLength({ max: 2000 }),
    body('onboardingCompleted').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const fields = [
        'firstName',
        'lastName',
        'institution',
        'bio',
        'city',
        'country',
        'expertiseTags',
        'interestTags',
        'portfolioSummary',
        'portfolioLinks',
        'preferredContactMethod',
        'preferredContactValue',
        'notifyInApp',
        'notifyEmail',
        'avatar',
        'onboardingCompleted',
      ];
      const data = {};
      for (const f of fields) {
        if (req.body[f] === undefined) continue;
        data[f] = USER_TEXT_FIELDS.has(f) ? sanitiseUserText(req.body[f]) : req.body[f];
      }
      if (data.firstName || data.lastName) {
        const merged = await prisma.user.findUnique({ where: { id: req.user.id }, select: { firstName: true, lastName: true } });
        data.fullName = sanitiseUserText(
          `${data.firstName || merged.firstName} ${data.lastName || merged.lastName}`.trim()
        );
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data,
        select: PUBLIC_USER_FIELDS,
      });

      await recordAuditLog({
        userId: req.user.id,
        userName: updated.fullName,
        role: req.user.role,
        action: 'profile_update',
        actionType: 'Profile Updated',
        resource: 'user',
        resourceId: req.user.id,
        targetEntity: req.user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/me/request-deletion', authenticate, async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { status: 'pending_deletion', deletionRequestedAt: new Date() },
    });
    await recordAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      role: req.user.role,
      action: 'deletion_request',
      actionType: 'Account Deletion Requested',
      resource: 'user',
      resourceId: req.user.id,
      targetEntity: req.user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    emailService.sendAccountDeletionScheduledEmail(req.user.id).catch(() => {});
    res.json({ id: updated.id, status: updated.status, deletionRequestedAt: updated.deletionRequestedAt });
  } catch (err) {
    next(err);
  }
});

router.post('/me/cancel-deletion', authenticate, async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { status: 'active', deletionRequestedAt: null },
    });
    await recordAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      role: req.user.role,
      action: 'deletion_cancel',
      actionType: 'Account Deletion Cancelled',
      resource: 'user',
      resourceId: req.user.id,
      targetEntity: req.user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    next(err);
  }
});

router.get('/me/export', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { ...PUBLIC_USER_FIELDS, refreshToken: false, passwordHash: false },
    });
    const [posts, sentMeetings, receivedMeetings, messages, notifications] = await Promise.all([
      prisma.post.findMany({ where: { authorId: req.user.id }, include: { statusHistory: true } }),
      prisma.meetingRequest.findMany({ where: { requestorId: req.user.id } }),
      prisma.meetingRequest.findMany({ where: { recipientId: req.user.id } }),
      prisma.message.findMany({ where: { OR: [{ senderId: req.user.id }, { recipientId: req.user.id }] } }),
      prisma.notification.findMany({ where: { userId: req.user.id } }),
    ]);
    const dump = {
      exportedAt: new Date().toISOString(),
      user,
      posts,
      meetings: { sent: sentMeetings, received: receivedMeetings },
      messages,
      notifications,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="health-ai-export-${req.user.id}-${new Date().toISOString().slice(0, 10)}.json"`
    );
    await recordAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      role: req.user.role,
      action: 'data_export',
      actionType: 'Data Export Downloaded',
      resource: 'user',
      resourceId: req.user.id,
      targetEntity: req.user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json(dump);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
