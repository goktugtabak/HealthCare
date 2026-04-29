const express = require('express');
const { body, param, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireVerified } = require('../middleware/auth');
const writeLimit = require('../middleware/writeLimit');
const { recordAuditLog } = require('../services/audit');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { recipientId: req.user.id }],
        deletedAt: null,
      },
      include: {
        post: { select: { id: true, title: true, confidentiality: true } },
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/thread/:postId/:userId',
  authenticate,
  [param('postId').isString().trim().notEmpty(), param('userId').isString().trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { postId, userId } = req.params;
      const messages = await prisma.message.findMany({
        where: {
          postId,
          deletedAt: null,
          OR: [
            { senderId: req.user.id, recipientId: userId },
            { senderId: userId, recipientId: req.user.id },
          ],
        },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'asc' },
      });

      await prisma.message.updateMany({
        where: { postId, senderId: userId, recipientId: req.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ messages });
    } catch (err) {
      next(err);
    }
  }
);

const ndaSatisfied = async ({ userId, postId, meetingRequestId }) => {
  // FR-31: NDA acceptance is universal for any meeting-context thread.
  // Accept either (a) explicit NDAAcceptance row tied to a meeting
  // request between the two parties OR (b) any prior message with
  // ndaAcceptedAt for this post/user pair.
  if (meetingRequestId) {
    const acc = await prisma.nDAAcceptance.findFirst({
      where: { userId, meetingRequestId },
    });
    if (acc) return true;
  }
  // H-07: declined / cancelled meetings should not satisfy the NDA gate
  // even though they may have ndaAcceptedAt set from before the rejection.
  const meetingByPair = await prisma.meetingRequest.findFirst({
    where: {
      postId,
      OR: [{ requestorId: userId }, { recipientId: userId }],
      ndaAcceptedAt: { not: null },
      status: { notIn: ['declined', 'cancelled'] },
    },
  });
  if (meetingByPair) return true;
  const prior = await prisma.message.findFirst({
    where: { postId, senderId: userId, ndaAcceptedAt: { not: null } },
  });
  return !!prior;
};

router.post(
  '/',
  authenticate,
  writeLimit,
  requireVerified,
  [
    body('postId').isString().trim().notEmpty().withMessage('Valid post ID required'),
    body('recipientId').isString().trim().notEmpty().withMessage('Valid recipient ID required'),
    body('content').trim().isLength({ min: 1, max: 2000 }),
    body('meetingRequestId').optional().isString().trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { postId, recipientId, content, meetingRequestId } = req.body;

      const post = await prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const ok = await ndaSatisfied({ userId: req.user.id, postId, meetingRequestId });
      if (!ok) {
        return res.status(403).json({
          error: 'NDA acceptance required before messaging',
          requiresNda: true,
        });
      }

      const message = await prisma.message.create({
        data: { postId, senderId: req.user.id, recipientId, content, meetingRequestId: meetingRequestId || null },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
          recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'message_received',
          title: 'New message',
          body: `${message.sender.firstName} sent you a message about "${post.title}"`,
          relatedEntityType: 'message',
          relatedEntityId: message.id,
        },
      });

      await recordAuditLog({
        userId: req.user.id,
        action: 'message_send',
        actionType: 'Message Sent',
        resource: 'message',
        resourceId: message.id,
        targetEntity: post.title,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/accept-nda',
  authenticate,
  requireVerified,
  [param('id').isString().trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const message = await prisma.message.findUnique({
        where: { id: req.params.id },
        include: { post: true },
      });

      if (!message) return res.status(404).json({ error: 'Message not found' });
      if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await prisma.message.update({
        where: { id: req.params.id },
        data: { ndaAcceptedAt: new Date() },
      });

      res.json({ message: 'NDA accepted', data: updated });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
