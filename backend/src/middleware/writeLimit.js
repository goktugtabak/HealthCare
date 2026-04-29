const rateLimit = require('express-rate-limit');

// H-05 / H-06: per-user write rate limit. Mounted AFTER `authenticate` so
// req.user is populated; falls back to req.ip for the unlikely case where
// authenticate hasn't run yet. Capped at 30 writes/hour per user — enough
// for normal use, far below the spam volume the QA audit produced.
const writeLimit = rateLimit({
  windowMs: parseInt(process.env.WRITE_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: parseInt(process.env.WRITE_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many write operations. Try again in an hour.' },
});

module.exports = writeLimit;
