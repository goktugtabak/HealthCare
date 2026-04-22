const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVerified } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  institution: true,
  bio: true,
  verifiedAt: true,
  createdAt: true,
};

const mapUser = (user) => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  role: user.role === 'doctor' ? 'healthcare' : user.role,
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName, city, country, bio, institution, preferredContact,
            interestTags, expertiseTags, portfolioSummary, portfolioLinks } = req.body;

    const data = {};
    if (bio !== undefined) data.bio = bio;
    if (institution !== undefined) data.institution = institution;

    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      data.firstName = parts[0] ?? '';
      data.lastName = parts.slice(1).join(' ') || parts[0];
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: USER_SELECT,
    });
    res.json({ user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/me/onboarding', authenticate, async (req, res, next) => {
  try {
    const { institution, bio } = req.body;

    const data = {};
    if (institution !== undefined) data.institution = institution;
    if (bio !== undefined) data.bio = bio;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: USER_SELECT,
    });
    res.json({ user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
