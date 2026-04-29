const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const emailService = require('./email');
const { recordAuditLog } = require('./audit');
const { sanitiseUserText } = require('../middleware/sanitizers');
const { calculateProfileCompleteness } = require('./users');

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

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastActiveAt: new Date() },
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

const refreshAccessToken = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, refreshToken, deletedAt: null },
  });
  if (!user) {
    const err = new Error('Refresh token revoked');
    err.status = 401;
    throw err;
  }

  // M-01: rotate the refresh token on every successful refresh. The old
  // token is replaced in the user record, so a stolen-and-replayed token
  // fails the second time it's presented.
  const accessToken = signToken(user.id, user.role);
  const nextRefreshToken = signRefreshToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: nextRefreshToken },
  });
  return { accessToken, refreshToken: nextRefreshToken };
};

const logout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

module.exports = {
  register,
  login,
  verifyEmail,
  refreshAccessToken,
  logout,
  EDU_EMAIL_RE,
};
