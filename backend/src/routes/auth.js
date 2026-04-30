const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authService = require('../services/auth');
const { authenticate } = require('../middleware/auth');
const { recordAuditLog } = require('../services/audit');
const { safeId } = require('../middleware/sanitizers');
const prisma = require('../lib/prisma');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Honeypot: hidden field that real users never fill. Bots sweep
// every input. Any non-empty value rejects the request silently.
const honeypotCheck = (req, res, next) => {
  if (req.body.honeypot) {
    return res.status(400).json({ error: 'Bot submission rejected' });
  }
  next();
};

router.post(
  '/register',
  honeypotCheck,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().isLength({ max: 100 }).matches(/^[^\x00]*$/).withMessage('First name required'),
    body('lastName').trim().notEmpty().isLength({ max: 100 }).matches(/^[^\x00]*$/).withMessage('Last name required'),
    body('role')
      .optional()
      .isIn(['engineer', 'healthcare'])
      .withMessage('Role must be engineer or healthcare'),
    body('honeypot').optional().isEmpty(),
    body('institution').optional().isString().trim().isLength({ max: 200 }).matches(/^[^\x00]*$/),
    body('city').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
    body('country').optional().isString().trim().isLength({ max: 100 }).matches(/^[^\x00]*$/),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await authService.register(req.body);
      await recordAuditLog({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        action: 'register',
        actionType: 'Account Created',
        resource: 'user',
        resourceId: user.id,
        targetEntity: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(201).json({
        message: 'Registration successful. Check your email to verify.',
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  honeypotCheck,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('honeypot').optional().isEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await authService.login({
        ...req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const result = await authService.refreshAccessToken(refreshToken, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authService.logout(req.user.id, req.body?.refreshToken);
    await recordAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      role: req.user.role,
      action: 'logout',
      actionType: 'Logout',
      resource: 'user',
      resourceId: req.user.id,
      targetEntity: req.user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// N6: list active sessions for "your devices" UI. Refresh token is never
// returned — listing endpoints must not be a way to harvest live tokens.
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        device: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// N6: revoke a single session. Must belong to req.user.id (404 hides
// existence of other users' rows).
router.delete(
  '/sessions/:id',
  authenticate,
  [safeId('id')],
  validate,
  async (req, res, next) => {
    try {
      const session = await prisma.session.findUnique({
        where: { id: req.params.id },
      });
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: 'Session not found' });
      }
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      await recordAuditLog({
        userId: req.user.id,
        userName: req.user.fullName,
        role: req.user.role,
        action: 'session_revoke',
        actionType: 'Session Revoked',
        resource: 'session',
        resourceId: session.id,
        targetEntity: session.device || session.ipAddress || 'session',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ message: 'Session revoked' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
