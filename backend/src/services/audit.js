const crypto = require('crypto');
const prisma = require('../lib/prisma');
const logger = require('../middleware/logger');

// FR-53: tamper-resistant audit chain with 24-month retention.
const RETENTION_MS = 24 * 30 * 24 * 60 * 60 * 1000;

const sha256 = (input) => crypto.createHash('sha256').update(String(input)).digest('hex');

const ipPreview = (ip) => {
  if (!ip) return '';
  const v4 = ip.replace(/^::ffff:/, '');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) {
    return v4.split('.').slice(0, 3).join('.') + '.***';
  }
  const segs = v4.split(':');
  if (segs.length > 1) {
    segs[segs.length - 1] = '***';
    return segs.join(':');
  }
  return '***';
};

const computeNextHash = (prevHash, payload) =>
  sha256((prevHash || '') + JSON.stringify(payload));

const recordAuditLog = async ({
  userId,
  userName,
  role,
  action,
  actionType,
  resource,
  resourceId,
  targetEntity,
  resultStatus = 'success',
  details,
  ip,
  userAgent,
}) => {
  try {
    const last = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    });
    const prevHash = last?.hash || '';
    const ts = new Date();
    const payload = {
      userId: userId || null,
      action,
      actionType: actionType || action,
      resource,
      resourceId: resourceId || null,
      targetEntity: targetEntity || null,
      resultStatus,
      ts: ts.toISOString(),
    };
    const hash = computeNextHash(prevHash, payload);

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || null,
        role: role || null,
        action,
        actionType: actionType || action,
        resource,
        resourceId: resourceId || null,
        targetEntity: targetEntity || null,
        resultStatus,
        details: details || undefined,
        ip: ip || null,
        ipPreview: ipPreview(ip),
        userAgent: userAgent || null,
        hash,
        prevHash,
        retentionUntil: new Date(ts.getTime() + RETENTION_MS),
        createdAt: ts,
      },
    });
  } catch (err) {
    logger.error(`Audit log write failed: ${err.message}`);
  }
};

const verifyAuditChain = async () => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      hash: true,
      prevHash: true,
      action: true,
      actionType: true,
      resource: true,
      resourceId: true,
      targetEntity: true,
      resultStatus: true,
      userId: true,
      createdAt: true,
    },
  });
  let prev = '';
  for (const log of logs) {
    if ((log.prevHash || '') !== prev) {
      return { valid: false, brokenAt: log.id, reason: 'prevHash mismatch' };
    }
    const expected = computeNextHash(prev, {
      userId: log.userId || null,
      action: log.action,
      actionType: log.actionType || log.action,
      resource: log.resource,
      resourceId: log.resourceId || null,
      targetEntity: log.targetEntity || null,
      resultStatus: log.resultStatus,
      ts: log.createdAt.toISOString(),
    });
    if (log.hash !== expected) {
      return { valid: false, brokenAt: log.id, reason: 'hash mismatch' };
    }
    prev = log.hash;
  }
  return { valid: true, count: logs.length };
};

module.exports = { recordAuditLog, sha256, ipPreview, computeNextHash, verifyAuditChain };
