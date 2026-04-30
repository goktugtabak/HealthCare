// Jest setup: enforce a stable test database URL and JWT secret.
// Run `docker compose up -d db` before `npm test`.

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://healthai_user:healthai_password@localhost:5434/healthai_db';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'jest-test-secret-32-char-minimum-jest-test-secret-32-char-minimum';
process.env.ALLOW_UNVERIFIED = process.env.ALLOW_UNVERIFIED || 'true';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '1000';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '50';
