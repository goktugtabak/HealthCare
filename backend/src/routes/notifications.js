const express = require('express');
const { param, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { safeId } = require('../middleware/sanitizers');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/read',
  authenticate,
  [safeId('id')],
  validate,
  async (req, res, next) => {
    try {
      const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
      if (!n || n.userId !== req.user.id) return res.status(404).json({ error: 'Notification not found' });
      const updated = await prisma.notification.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
