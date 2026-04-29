const express = require('express');
const { body, param, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireVerified } = require('../middleware/auth');
const writeLimit = require('../middleware/writeLimit');
const { recordAuditLog } = require('../services/audit');
const emailService = require('../services/email');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const MEETING_INCLUDE = {
  post: { select: { id: true, title: true, status: true, confidentiality: true, ownerRole: true, authorId: true } },
  requestor: { select: { id: true, firstName: true, lastName: true, fullName: true, role: true, avatar: true } },
  recipient: { select: { id: true, firstName: true, lastName: true, fullName: true, role: true, avatar: true } },
  ndaAcceptance: true,
};

const fullName = (u) => u?.fullName || [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || '';

router.get('/', authenticate, async (req, res, next) => {
  try {
    const meetings = await prisma.meetingRequest.findMany({
      where: {
        OR: [{ requestorId: req.user.id }, { recipientId: req.user.id }],
      },
      include: MEETING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ meetings });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, [param('id').isString().trim().notEmpty()], validate, async (req, res, next) => {
  try {
    const meeting = await prisma.meetingRequest.findUnique({
      where: { id: req.params.id },
      include: MEETING_INCLUDE,
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    if (meeting.requestorId !== req.user.id && meeting.recipientId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(meeting);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  writeLimit,
  requireVerified,
  [
    body('postId').isString().trim().notEmpty(),
    // FR-31: NDA acceptance is mandatory for ALL meeting requests,
    // not just confidential posts.
    body('ndaAccepted').isBoolean().custom((v) => v === true).withMessage('NDA acceptance is required'),
    body('introductoryMessage').isString().trim().isLength({ min: 1, max: 2000 }),
    body('proposedSlots').optional().isArray(),
    body('proposedSlots.*').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { postId, introductoryMessage, ndaAccepted, proposedSlots } = req.body;
      const post = await prisma.post.findUnique({ where: { id: postId, deletedAt: null } });
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (!['active', 'meeting_scheduled'].includes(post.status)) {
        return res.status(400).json({ error: 'Post not accepting requests' });
      }
      if (post.authorId === req.user.id) {
        return res.status(400).json({ error: 'Cannot request a meeting on your own post' });
      }

      const meeting = await prisma.meetingRequest.create({
        data: {
          postId,
          requestorId: req.user.id,
          recipientId: post.authorId,
          requesterRole: req.user.role,
          introductoryMessage,
          ndaAccepted: true,
          ndaAcceptedAt: new Date(),
          proposedSlots: Array.isArray(proposedSlots) ? proposedSlots : [],
          status: 'pending',
          ndaAcceptance: {
            create: {
              userId: req.user.id,
              ipAddress: req.ip,
            },
          },
        },
        include: MEETING_INCLUDE,
      });

      await prisma.notification.create({
        data: {
          userId: meeting.recipientId,
          type: 'meeting_requested',
          title: 'New collaboration request',
          body: `${fullName(meeting.requestor)} sent a first-contact request for "${meeting.post.title}".`,
          relatedEntityType: 'meeting_request',
          relatedEntityId: meeting.id,
        },
      });

      await recordAuditLog({
        userId: req.user.id,
        userName: fullName(req.user),
        role: req.user.role,
        action: 'meeting_request_send',
        actionType: 'Meeting Request Sent',
        resource: 'meeting_request',
        resourceId: meeting.id,
        targetEntity: meeting.post.title,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      emailService
        .sendMeetingRequestEmail(meeting.recipientId, fullName(meeting.requestor), meeting.post.title)
        .catch(() => {});
      emailService
        .sendNdaAcceptedEmail(meeting.recipientId, fullName(meeting.requestor), meeting.post.title)
        .catch(() => {});

      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/accept',
  authenticate,
  writeLimit,
  requireVerified,
  [param('id').isString().trim().notEmpty(), body('selectedSlot').optional().isString()],
  validate,
  async (req, res, next) => {
    try {
      const m = await prisma.meetingRequest.findUnique({
        where: { id: req.params.id },
        include: MEETING_INCLUDE,
      });
      if (!m) return res.status(404).json({ error: 'Meeting not found' });
      if (m.recipientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the post owner can accept' });
      }
      if (!['pending', 'accepted'].includes(m.status)) {
        return res.status(400).json({ error: `Cannot accept from ${m.status}` });
      }

      const selectedSlot = req.body.selectedSlot ? new Date(req.body.selectedSlot) : null;
      const newStatus = selectedSlot ? 'scheduled' : 'accepted';

      const updated = await prisma.meetingRequest.update({
        where: { id: m.id },
        data: { status: newStatus, selectedSlot, agreedTime: selectedSlot },
        include: MEETING_INCLUDE,
      });

      if (selectedSlot) {
        await prisma.post.update({
          where: { id: m.postId },
          data: {
            status: 'meeting_scheduled',
            statusHistory: {
              create: {
                status: 'meeting_scheduled',
                changedBy: req.user.id,
                reason: `Meeting accepted with ${fullName(m.requestor)}`,
              },
            },
          },
        });
      }

      await prisma.notification.create({
        data: {
          userId: m.requestorId,
          type: 'meeting_accepted',
          title: selectedSlot ? 'Meeting scheduled' : 'Meeting accepted',
          body: `${fullName(m.recipient)} ${selectedSlot ? 'scheduled' : 'accepted'} the meeting for "${m.post.title}".`,
          relatedEntityType: 'meeting_request',
          relatedEntityId: m.id,
        },
      });

      await recordAuditLog({
        userId: req.user.id,
        userName: fullName(req.user),
        role: req.user.role,
        action: 'meeting_request_accept',
        actionType: selectedSlot ? 'Meeting Scheduled' : 'Meeting Accepted',
        resource: 'meeting_request',
        resourceId: m.id,
        targetEntity: m.post.title,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      emailService
        .sendMeetingAcceptedEmail(m.requestorId, fullName(m.recipient), m.post.title, selectedSlot)
        .catch(() => {});

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/decline',
  authenticate,
  writeLimit,
  requireVerified,
  [param('id').isString().trim().notEmpty(), body('reason').optional().isString().trim().isLength({ max: 500 })],
  validate,
  async (req, res, next) => {
    try {
      const m = await prisma.meetingRequest.findUnique({
        where: { id: req.params.id },
        include: MEETING_INCLUDE,
      });
      if (!m) return res.status(404).json({ error: 'Meeting not found' });
      if (m.recipientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the post owner can decline' });
      }
      if (m.status === 'declined' || m.status === 'cancelled') {
        return res.status(400).json({ error: `Already ${m.status}` });
      }

      const updated = await prisma.meetingRequest.update({
        where: { id: m.id },
        data: { status: 'declined', notes: req.body.reason || null },
        include: MEETING_INCLUDE,
      });

      await prisma.notification.create({
        data: {
          userId: m.requestorId,
          type: 'meeting_declined',
          title: 'Request declined',
          body: `${fullName(m.recipient)} declined your collaboration request for "${m.post.title}".`,
          relatedEntityType: 'meeting_request',
          relatedEntityId: m.id,
        },
      });

      await recordAuditLog({
        userId: req.user.id,
        userName: fullName(req.user),
        role: req.user.role,
        action: 'meeting_request_decline',
        actionType: 'Meeting Declined',
        resource: 'meeting_request',
        resourceId: m.id,
        targetEntity: m.post.title,
        details: { reason: req.body.reason || null },
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      emailService
        .sendMeetingDeclinedEmail(m.requestorId, fullName(m.recipient), m.post.title, req.body.reason)
        .catch(() => {});

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/cancel',
  authenticate,
  writeLimit,
  requireVerified,
  [param('id').isString().trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const m = await prisma.meetingRequest.findUnique({
        where: { id: req.params.id },
        include: MEETING_INCLUDE,
      });
      if (!m) return res.status(404).json({ error: 'Meeting not found' });
      if (m.requestorId !== req.user.id && m.recipientId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (m.status === 'cancelled') return res.json(m);

      const updated = await prisma.meetingRequest.update({
        where: { id: m.id },
        data: { status: 'cancelled' },
        include: MEETING_INCLUDE,
      });

      const otherId = m.requestorId === req.user.id ? m.recipientId : m.requestorId;
      await prisma.notification.create({
        data: {
          userId: otherId,
          type: 'meeting_cancelled',
          title: 'Request cancelled',
          body: `${fullName(req.user)} cancelled the meeting request for "${m.post.title}".`,
          relatedEntityType: 'meeting_request',
          relatedEntityId: m.id,
        },
      });

      await recordAuditLog({
        userId: req.user.id,
        userName: fullName(req.user),
        role: req.user.role,
        action: 'meeting_request_cancel',
        actionType: 'Meeting Cancelled',
        resource: 'meeting_request',
        resourceId: m.id,
        targetEntity: m.post.title,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
