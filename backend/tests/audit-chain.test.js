require('./setup');
const { sha256, computeNextHash } = require('../src/services/audit');
const { sweepExpiredAuditLogs } = require('../src/jobs/sweeps');
const prisma = require('../src/lib/prisma');

describe('audit hash chain primitives', () => {
  test('sha256 is deterministic', () => {
    expect(sha256('hello')).toBe(sha256('hello'));
    expect(sha256('hello')).not.toBe(sha256('hello!'));
    expect(sha256('hello')).toMatch(/^[a-f0-9]{64}$/);
  });

  test('computeNextHash chains properly', () => {
    const a = computeNextHash('', { action: 'login', ts: '2026-04-29T00:00:00Z' });
    const b = computeNextHash(a, { action: 'logout', ts: '2026-04-29T00:00:01Z' });
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(b).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
  });

  test('mutating the payload breaks the chain', () => {
    const a = computeNextHash('', { action: 'login', ts: 't' });
    const a2 = computeNextHash('', { action: 'LOGIN', ts: 't' });
    expect(a).not.toBe(a2);
  });

  test('mutating prevHash breaks the chain', () => {
    const a = computeNextHash('aaaa', { action: 'x', ts: '1' });
    const b = computeNextHash('bbbb', { action: 'x', ts: '1' });
    expect(a).not.toBe(b);
  });
});

describe('FR-53 audit retention sweep', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deletes rows past retentionUntil', async () => {
    await prisma.auditLog.create({
      data: {
        action: 'jest_retention_test',
        actionType: 'Jest Retention Test',
        resource: 'test',
        resultStatus: 'success',
        retentionUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
    const deleted = await sweepExpiredAuditLogs();
    expect(deleted).toBeGreaterThan(0);
  });
});
