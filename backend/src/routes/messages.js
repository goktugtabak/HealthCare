const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVerified } = require('../middleware/auth');
const emailService = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

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

router.get('/thread/:postId/:userId', authenticate, async (req, res, next) => {
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
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.message.updateMany({
      where: { postId, senderId: userId, recipientId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireVerified,
  [
    body('postId').isUUID().withMessage('Valid post ID required'),
    body('recipientId').isUUID().withMessage('Valid recipient ID required'),
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content required (max 2000 chars)'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { postId, recipientId, content } = req.body;

      const post = await prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
      if (!post) return res.status(404).json({ error: 'Post not found' });

      if (post.confidentiality === 'private') {
        const existingNda = await prisma.message.findFirst({
          where: { postId, senderId: req.user.id, ndaAcceptedAt: { not: null } },
        });
        if (!existingNda) {
          return res.status(403).json({ error: 'NDA acceptance required for private posts', requiresNda: true });
        }
      }

      const message = await prisma.message.create({
        data: { postId, senderId: req.user.id, recipientId, content },
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
          data: { postId, messageId: message.id },
        },
      });

      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/accept-nda', authenticate, requireVerified, async (req, res, next) => {
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
});

router.post(
  '/meeting-request',
  authenticate,
  requireVerified,
  [
    body('postId').isUUID(),
    body('recipientId').isUUID(),
    body('proposedTimes').isArray({ min: 1 }).withMessage('At least one proposed time required'),
    body('proposedTimes.*').isISO8601(),
    body('externalUrl').optional().isURL(),
    body('notes').optional().isString().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { postId, recipientId, proposedTimes, externalUrl, notes } = req.body;

      const meetingRequest = await prisma.meetingRequest.create({
        data: {
          postId,
          requestorId: req.user.id,
          recipientId,
          proposedTimes,
          externalUrl,
          notes,
        },
        include: {
          requestor: { select: { id: true, firstName: true, lastName: true } },
          post: { select: { id: true, title: true } },
        },
      });

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'meeting_requested',
          title: 'Meeting request',
          body: `${meetingRequest.requestor.firstName} requested a meeting about "${meetingRequest.post.title}"`,
          data: { meetingRequestId: meetingRequest.id, postId },
        },
      });

      res.status(201).json(meetingRequest);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
