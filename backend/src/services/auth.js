const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const emailService = require('./email');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const EDU_EMAIL_RE = /^[^\s@]+@[^\s@]+\.edu$/i;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const register = async ({ email, password, firstName, lastName, role, institution }) => {
  if (!EDU_EMAIL_RE.test(email)) {
    const err = new Error('Only .edu email addresses are accepted');
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

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || 'engineer',
      institution,
      verifyToken,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  await emailService.sendVerificationEmail(email, firstName, verifyToken);

  return user;
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
  });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const accessToken = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  const roleForClient = user.role === 'doctor' ? 'healthcare' : user.role;

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      role: roleForClient,
      verifiedAt: user.verifiedAt,
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
    data: { verifiedAt: new Date(), verifyToken: null },
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

  const accessToken = signToken(user.id, user.role);
  return { accessToken };
};

module.exports = { register, login, verifyEmail, refreshAccessToken };
