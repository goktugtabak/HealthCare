const cron = require('node-cron');
const prisma = require('../lib/prisma');
const logger = require('../middleware/logger');
const { expireDuePosts } = require('../services/posts');
const { recordAuditLog } = require('../services/audit');

// FR-15: auto-expire posts on schedule (hourly).
// NFR-10: 72h hard-delete sweep for accounts in pending_deletion.
// DELETION_TTL_MS env var allows shortened TTL for tests/demo.
const DELETION_TTL_MS = parseInt(process.env.DELETION_TTL_MS, 10) || 72 * 60 * 60 * 1000;

const sweepDeletions = async () => {
  const cutoff = new Date(Date.now() - DELETION_TTL_MS);
  const due = await prisma.user.findMany({
    where: {
      status: 'pending_deletion',
      deletionRequestedAt: { lte: cutoff },
      deletedAt: null,
    },
    select: { id: true, email: true, fullName: true },
  });
  for (const u of due) {
    await prisma.$transaction([
      prisma.message.updateMany({
        where: { OR: [{ senderId: u.id }, { recipientId: u.id }] },
        data: { deletedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: u.id },
        data: {
          deletedAt: new Date(),
          status: 'deactivated',
          email: `deleted-${u.id}@deleted.invalid`,
          firstName: 'Deleted',
          lastName: 'User',
          fullName: 'Deleted User',
          passwordHash: '',
          institution: null,
          bio: null,
          city: null,
          country: null,
          expertiseTags: [],
          interestTags: [],
          portfolioSummary: null,
          portfolioLinks: [],
          preferredContactMethod: null,
          preferredContactValue: null,
          avatar: null,
          verifyToken: null,
          refreshToken: null,
        },
      }),
    ]);
    await recordAuditLog({
      userId: u.id,
      action: 'auto_hard_delete',
      actionType: 'Auto Hard Delete (72h)',
      resource: 'user',
      resourceId: u.id,
      targetEntity: u.email,
    });
    logger.info(`Auto-purged user ${u.id} after deletion grace period.`);
  }
  return due.length;
};

const start = () => {
  // Hourly auto-expire sweep
  cron.schedule('0 * * * *', async () => {
    try {
      const expired = await expireDuePosts();
      if (expired > 0) logger.info(`Auto-expired ${expired} posts.`);
    } catch (err) {
      logger.error(`Auto-expire sweep failed: ${err.message}`);
    }
  });

  // Hourly hard-delete sweep
  cron.schedule('15 * * * *', async () => {
    try {
      const deleted = await sweepDeletions();
      if (deleted > 0) logger.info(`Auto-purged ${deleted} accounts after deletion grace period.`);
    } catch (err) {
      logger.error(`Hard-delete sweep failed: ${err.message}`);
    }
  });

  // Run once on boot so demo / restarts don't wait an hour
  expireDuePosts().catch((err) => logger.error(`Boot expire failed: ${err.message}`));
  sweepDeletions().catch((err) => logger.error(`Boot purge failed: ${err.message}`));

  logger.info('Cron sweeps scheduled (hourly auto-expire + hard-delete).');
};

module.exports = { start, sweepDeletions };
