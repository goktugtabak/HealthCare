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
      // N6: same orphan-token risk as the admin hard-delete path — wipe
      // sessions in the same transaction so anonymisation is total.
      prisma.session.deleteMany({ where: { userId: u.id } }),
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

// N6: drop sessions that are past expiry, plus revoked-and-aged-out rows.
// 30-day grace on revoked sessions keeps audit trail useful for "where was
// I logged in?" investigations without growing forever.
const sweepExpiredSessions = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { lt: thirtyDaysAgo } },
      ],
    },
  });
  if (result.count > 0) {
    logger.info(`Session sweep: deleted ${result.count} expired/revoked sessions.`);
  }
  return result.count;
};

// FR-53: every audit row is written with a retentionUntil 24 months out.
// Without this sweep the column is decoration; with it, the chain only
// retains the most recent 24 months of activity. The chain still verifies
// after a sweep — see the note in services/audit.js verifyAuditChain.
const sweepExpiredAuditLogs = async () => {
  const result = await prisma.auditLog.deleteMany({
    where: {
      retentionUntil: { lt: new Date() },
    },
  });
  if (result.count > 0) {
    logger.info(`Audit retention sweep: deleted ${result.count} expired audit log entries.`);
  }
  return result.count;
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

  // Daily 03:00 audit retention sweep — drops rows past their retentionUntil.
  cron.schedule('0 3 * * *', async () => {
    try {
      await sweepExpiredAuditLogs();
    } catch (err) {
      logger.error(`Audit retention sweep failed: ${err.message}`);
    }
  });

  // N6: daily 03:30 session sweep — staggered after the audit sweep so the
  // two heavy delete passes don't run at the same time.
  cron.schedule('30 3 * * *', async () => {
    try {
      await sweepExpiredSessions();
    } catch (err) {
      logger.error(`Session sweep failed: ${err.message}`);
    }
  });

  // Run once on boot so demo / restarts don't wait an hour
  expireDuePosts().catch((err) => logger.error(`Boot expire failed: ${err.message}`));
  sweepDeletions().catch((err) => logger.error(`Boot purge failed: ${err.message}`));
  sweepExpiredAuditLogs().catch((err) => logger.error(`Boot audit sweep failed: ${err.message}`));
  sweepExpiredSessions().catch((err) => logger.error(`Boot session sweep failed: ${err.message}`));

  logger.info('Cron sweeps scheduled (hourly auto-expire + hard-delete + daily audit retention + daily session sweep).');
};

module.exports = { start, sweepDeletions, sweepExpiredAuditLogs, sweepExpiredSessions };
