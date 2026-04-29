const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// NFR-06: 30-minute sliding inactivity timeout. Frontend AppShell
// already handles client-side; backend enforces server-side too.
const INACTIVITY_TIMEOUT_MS =
  parseInt(process.env.INACTIVITY_TIMEOUT_MS, 10) || 30 * 60 * 1000;

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        fullName: true,
        verifiedAt: true,
        emailVerified: true,
        domainVerified: true,
        status: true,
        lastActiveAt: true,
        onboardingCompleted: true,
      },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status !== 'active') {
      return res.status(403).json({ error: `Account ${user.status}` });
    }

    if (
      user.lastActiveAt &&
      Date.now() - new Date(user.lastActiveAt).getTime() > INACTIVITY_TIMEOUT_MS
    ) {
      return res
        .status(401)
        .json({ error: 'Session expired due to inactivity', code: 'INACTIVITY_TIMEOUT' });
    }

    // sliding window: bump lastActiveAt fire-and-forget
    prisma.user
      .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      .catch(() => {});

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireVerified = (req, res, next) => {
  if (process.env.ALLOW_UNVERIFIED === 'true') return next();
  if (!req.user.verifiedAt && !req.user.emailVerified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireVerified, requireRole };
