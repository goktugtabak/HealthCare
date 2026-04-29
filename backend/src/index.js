const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const meetingRoutes = require('./routes/meetings');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const sweeps = require('./jobs/sweeps');

// Hard-fail in production if JWT_SECRET is missing or weak.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be set to a value of at least 32 characters in production.');
    process.exit(1);
  }
  if (
    process.env.JWT_SECRET.startsWith('change-this') ||
    process.env.JWT_SECRET.includes('your-super-secret')
  ) {
    console.error('FATAL: JWT_SECRET still uses a default placeholder. Generate a strong secret.');
    process.exit(1);
  }
  // L-03: ALLOW_UNVERIFIED bypasses email verification and is for dev only.
  // Refuse to boot if it leaks into a production deploy.
  if (process.env.ALLOW_UNVERIFIED === 'true') {
    console.error('FATAL: ALLOW_UNVERIFIED must not be true in production.');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// C-01: only trust X-Forwarded-For when an actual reverse proxy (Caddy) sits
// in front. In dev/test there is no proxy, so trusting XFF would let any
// caller spoof req.ip and bypass the rate limiters. Caddy in production
// rewrites XFF to the real client IP — that's the only place req.ip should
// follow the header.
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// M-03: explicit CSP in production. Helmet's default is permissive in
// some directives (e.g. it allows inline scripts when CSP is not set).
// We deny script inline, restrict frame-ancestors, and lock everything
// down to same-origin unless a directive specifically loosens it.
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      }
    : false,
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:8080,http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// C-01: keyGenerator uses req.ip (which respects `trust proxy`) so attackers
// cannot bypass limits by spoofing X-Forwarded-For. Without an explicit key
// generator, express-rate-limit falls back to req.ip but a hand-rolled key
// makes the intent explicit and resistant to future changes.
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// NFR-07: dedicated brute-force limiter on auth endpoints.
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many login/registration attempts. Try again in 15 minutes.' },
});
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`HEALTH AI API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    sweeps.start();
  });
}

module.exports = app;
