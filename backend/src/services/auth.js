const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const emailService = require('./email');
const { recordAuditLog, ipPreview } = require('./audit');
const { sanitiseUserText } = require('../middleware/sanitizers');
const { calculateProfileCompleteness } = require('./users');

// N6: refresh-token TTL must match the JWT refresh token's expiry so the
// Session row and the signed token agree on when to stop being valid.
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// N6: parse a user-agent string into a short device label like "Chrome on
// Windows". Cheap regex on the bits we care about — no ua-parser-js dep.
const parseDevice = (userAgent) => {
  if (!userAgent) return null;
  const ua = String(userAgent);
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome|Chromium/i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';
  else if (/PostmanRuntime/i.test(ua)) browser = 'Postman';
  else if (/curl\//i.test(ua)) browser = 'curl';
  else if (/node-fetch|axios|supertest|JestRunner/i.test(ua)) browser = 'Test runner';

  let os = 'device';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${browser} on ${os}`;
};

const SALT_ROUNDS = 10;
// H-03: bcrypt the candidate password against this fixed dummy hash on the
// "unknown email" branch so login response time matches the real-but-wrong
// password branch, denying timing-based email enumeration.
const DUMMY_HASH = '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

// FR-01: Accept .edu, .edu.tr, .edu.au, .edu.<cc> two- or three-letter
// country codes. Personal providers stay rejected.
const EDU_EMAIL_RE = /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,3})?$/i;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

const signRefreshToken = (userId) =>
  // M-01: include a jti so two refresh tokens minted in the same second
  // for the same user are still distinct strings — required for rotation
  // (otherwise the new token equals the old one and the rotation is a no-op).
  jwt.sign({ userId, jti: uuidv4() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const ALLOWED_REGISTER_ROLES = ['engineer', 'healthcare'];

const register = async ({
  email,
  password,
  firstName,
  lastName,
  role,
  institution,
  city,
  country,
}) => {
  if (!EDU_EMAIL_RE.test(email)) {
    const err = new Error('Only institutional .edu / .edu.tr email addresses are accepted');
    err.status = 400;
    throw err;
  }
  if (role && !ALLOWED_REGISTER_ROLES.includes(role)) {
    const err = new Error('Role must be engineer or healthcare');
    err.status = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = uuidv4();

  const cleanFirst = sanitiseUserText(firstName);
  const cleanLast = sanitiseUserText(lastName);
  const userRole = role || 'engineer';
  const data = {
    email,
    passwordHash,
    firstName: cleanFirst,
    lastName: cleanLast,
    fullName: sanitiseUserText(`${cleanFirst} ${cleanLast}`.trim()),
    role: userRole,
    institution: sanitiseUserText(institution || null),
    city: city || null,
    country: country || null,
    verifyToken,
  };
  // FR-46: seed the profileCompleteness with the same formula admin views
  // and the user's profile UI use. A bare-minimum registration scores 25
  // (just the "has identity" baseline); fields filled in onboarding bump it.
  data.profileCompleteness = calculateProfileCompleteness(data);
  const user = await prisma.user.create({
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      city: true,
      country: true,
      institution: true,
    },
  });

  await emailService.sendVerificationEmail(email, firstName, verifyToken);

  return user;
};

const login = async ({ email, password, ip, userAgent }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt) {
    // H-03: equalise response time so attackers can't distinguish "no user"
    // from "user exists, wrong password" by comparing latencies.
    await comparePassword(password, DUMMY_HASH);
    await recordAuditLog({
      action: 'login',
      actionType: 'Login',
      resource: 'user',
      resourceId: null,
      targetEntity: email,
      resultStatus: 'failure',
      ip,
      userAgent,
      details: { reason: 'unknown_email' },
    });
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (user.status !== 'active') {
    await recordAuditLog({
      userId: user.id,
      userName: user.fullName,
      role: user.role,
      action: 'login',
      actionType: 'Login',
      resource: 'user',
      resourceId: user.id,
      targetEntity: user.email,
      resultStatus: 'failure',
      ip,
      userAgent,
      details: { reason: `account_${user.status}` },
    });
    const err = new Error(`Account ${user.status}`);
    err.status = 403;
    throw err;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    await recordAuditLog({
      userId: user.id,
      userName: user.fullName,
      role: user.role,
      action: 'login',
      actionType: 'Login',
      resource: 'user',
      resourceId: user.id,
      targetEntity: user.email,
      resultStatus: 'failure',
      ip,
      userAgent,
      details: { reason: 'bad_password' },
    });
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const accessToken = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  // N6: Session row replaces the single-string User.refreshToken. Each
  // device gets its own row; rotation/revoke is per-row so other devices
  // stay alive when one logs out.
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      device: parseDevice(userAgent),
      ipAddress: ipPreview(ip) || null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  await recordAuditLog({
    userId: user.id,
    userName: user.fullName,
    role: user.role,
    action: 'login',
    actionType: 'Login',
    resource: 'user',
    resourceId: user.id,
    targetEntity: user.email,
    resultStatus: 'success',
    ip,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      verifiedAt: user.verifiedAt,
      emailVerified: user.emailVerified,
      domainVerified: user.domainVerified,
      onboardingCompleted: user.onboardingCompleted,
    },
  };
};

const verifyEmail = async (token) => {
  const user = await prisma.user.findUnique({ where: { verifyToken: token } });
  if (!user) {
    const err = new Error('Invalid or expired verification token');
    err.status = 400;
    throw err;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { verifiedAt: new Date(), emailVerified: true, verifyToken: null },
  });

  await recordAuditLog({
    userId: user.id,
    userName: user.fullName,
    role: user.role,
    action: 'verify_email',
    actionType: 'Email Verified',
    resource: 'user',
    resourceId: user.id,
    targetEntity: user.email,
  });

  return { message: 'Email verified successfully' };
};

const refreshAccessToken = async (refreshToken, { ip, userAgent } = {}) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  // N6: lookup by Session row instead of User.refreshToken. The session
  // must be live (not revoked, not past expiry) and its user must not be
  // soft-deleted.
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    session.userId !== payload.userId ||
    !session.user ||
    session.user.deletedAt
  ) {
    const err = new Error('Refresh token revoked');
    err.status = 401;
    throw err;
  }

  // M-01: rotate the refresh token on every successful refresh. With the
  // Session table the rotation is scoped to this row only — other devices
  // keep their tokens. The old token is replaced so a replay fails.
  const accessToken = signToken(session.user.id, session.user.role);
  const nextRefreshToken = signRefreshToken(session.user.id);
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: nextRefreshToken,
      ipAddress: ipPreview(ip) || session.ipAddress,
      device: parseDevice(userAgent) || session.device,
    },
  });
  return { accessToken, refreshToken: nextRefreshToken };
};

const logout = async (userId, refreshToken) => {
  // N6: revoke ONLY the device's own session — other devices stay alive.
  // If the client didn't send a refreshToken in the body (older clients),
  // fall back to revoking all of the user's active sessions to preserve
  // the old "log everyone out" semantics rather than silently failing.
  if (refreshToken) {
    await prisma.session.updateMany({
      where: { userId, refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return;
  }
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

module.exports = {
  register,
  login,
  verifyEmail,
  refreshAccessToken,
  logout,
  parseDevice,
  EDU_EMAIL_RE,
};
