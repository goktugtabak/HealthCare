const prisma = require('../lib/prisma');
const { recordAuditLog } = require('./audit');

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      role: true,
      institution: true,
      city: true,
      country: true,
      avatar: true,
    },
  },
  statusHistory: { orderBy: { changedAt: 'desc' } },
  _count: { select: { messages: true, meetingRequests: true } },
};

const listPosts = async ({
  role,
  page = 1,
  limit = 20,
  domain,
  status,
  stage,
  city,
  country,
  ownerId,
  search,
  includeAll = false,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(!includeAll && role !== 'admin' && { status: { in: ['active', 'meeting_scheduled', 'partner_found'] } }),
    ...(domain && {
      OR: [
        { workingDomain: { contains: domain, mode: 'insensitive' } },
        { domain: { contains: domain, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status }),
    ...(stage && { projectStage: stage }),
    ...(city && { city: { equals: city, mode: 'insensitive' } }),
    ...(country && { country: { equals: country, mode: 'insensitive' } }),
    ...(ownerId && { authorId: ownerId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { shortExplanation: { contains: search, mode: 'insensitive' } },
        { workingDomain: { contains: search, mode: 'insensitive' } },
        { highLevelIdea: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: POST_INCLUDE,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, pages: Math.ceil(total / limit) };
};

const getPost = async (id) => {
  const post = await prisma.post.findUnique({
    where: { id, deletedAt: null },
    include: POST_INCLUDE,
  });
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  return post;
};

const buildCreateData = (authorId, ownerRole, body) => ({
  authorId,
  ownerRole,
  title: body.title,
  workingDomain: body.workingDomain || body.domain,
  shortExplanation: body.shortExplanation || body.description || '',
  description: body.description || body.shortExplanation || null,
  domain: body.domain || body.workingDomain || null,
  requiredExpertise: Array.isArray(body.requiredExpertise) ? body.requiredExpertise : [],
  matchTags: Array.isArray(body.matchTags) ? body.matchTags : Array.isArray(body.tags) ? body.tags : [],
  projectStage: body.projectStage || 'ideation',
  status: body.status || (body.publish ? 'active' : 'draft'),
  confidentiality: body.confidentiality || body.confidentialityLevel || 'public',
  collaborationType: body.collaborationType || null,
  commitmentLevel: body.commitmentLevel || null,
  highLevelIdea: body.highLevelIdea || null,
  notesPreview: body.notesPreview || null,
  country: body.country || null,
  city: body.city || null,
  expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
  autoClose: !!body.autoClose,
});

const createPost = async (authorId, ownerRole, body) => {
  const data = buildCreateData(authorId, ownerRole, body);
  const post = await prisma.post.create({
    data: {
      ...data,
      statusHistory: {
        create: {
          status: data.status,
          changedBy: authorId,
          reason: 'Post created',
        },
      },
    },
    include: POST_INCLUDE,
  });
  return post;
};

const updatePost = async (id, userId, role, body) => {
  const post = await prisma.post.findUnique({ where: { id, deletedAt: null } });
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  if (post.authorId !== userId && role !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const editable = [
    'title',
    'workingDomain',
    'shortExplanation',
    'requiredExpertise',
    'matchTags',
    'projectStage',
    'collaborationType',
    'commitmentLevel',
    'highLevelIdea',
    'notesPreview',
    'country',
    'city',
    'autoClose',
  ];
  const data = {};
  for (const k of editable) if (body[k] !== undefined) data[k] = body[k];
  if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  if (body.confidentiality !== undefined) data.confidentiality = body.confidentiality;
  if (body.confidentialityLevel !== undefined) data.confidentiality = body.confidentialityLevel;

  return prisma.post.update({
    where: { id },
    data,
    include: POST_INCLUDE,
  });
};

const VALID_STATUS_TRANSITIONS = {
  draft: ['active', 'expired', 'removed'],
  active: ['draft', 'meeting_scheduled', 'partner_found', 'expired', 'removed'],
  meeting_scheduled: ['active', 'partner_found', 'expired', 'removed'],
  partner_found: ['active', 'expired', 'removed'],
  expired: ['active', 'removed'],
  removed: [],
};

const transitionStatus = async ({ id, userId, role, status, reason, ip, userAgent }) => {
  const post = await prisma.post.findUnique({ where: { id, deletedAt: null } });
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  if (post.authorId !== userId && role !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const allowed = VALID_STATUS_TRANSITIONS[post.status] || [];
  if (!allowed.includes(status)) {
    const err = new Error(`Cannot transition from ${post.status} to ${status}`);
    err.status = 400;
    throw err;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          changedBy: userId,
          reason: reason || `Status changed to ${status}`,
        },
      },
    },
    include: POST_INCLUDE,
  });

  await recordAuditLog({
    userId,
    role,
    action: 'post_status_change',
    actionType: `Post Status: ${status}`,
    resource: 'post',
    resourceId: id,
    targetEntity: post.title,
    details: { from: post.status, to: status, reason: reason || null },
    ip,
    userAgent,
  });

  return updated;
};

const deletePost = async (id, userId, role) => {
  const post = await prisma.post.findUnique({ where: { id, deletedAt: null } });
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  if (post.authorId !== userId && role !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const removed = await prisma.post.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'removed',
      statusHistory: {
        create: { status: 'removed', changedBy: userId, reason: 'Post removed' },
      },
    },
  });
  return removed;
};

const markClosed = async (id, userId) => {
  return transitionStatus({
    id,
    userId,
    role: undefined,
    status: 'partner_found',
    reason: 'Marked Partner Found',
  });
};

const expireDuePosts = async () => {
  const now = new Date();
  const due = await prisma.post.findMany({
    where: {
      deletedAt: null,
      expiryDate: { lt: now },
      status: { in: ['draft', 'active', 'meeting_scheduled'] },
    },
    select: { id: true, title: true, authorId: true, status: true },
  });
  for (const p of due) {
    await prisma.post.update({
      where: { id: p.id },
      data: {
        status: 'expired',
        statusHistory: {
          create: {
            status: 'expired',
            changedBy: p.authorId,
            reason: 'Auto-expired by sweep',
          },
        },
      },
    });
    await recordAuditLog({
      userId: p.authorId,
      action: 'post_status_change',
      actionType: 'Post Auto-Expired',
      resource: 'post',
      resourceId: p.id,
      targetEntity: p.title,
      details: { from: p.status, to: 'expired', reason: 'auto_expiry' },
    });
  }
  return due.length;
};

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  transitionStatus,
  deletePost,
  markClosed,
  expireDuePosts,
};
