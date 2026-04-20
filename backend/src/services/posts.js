const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const listPosts = async ({ role, page = 1, limit = 20, domain, status, stage, search }) => {
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(role !== 'admin' && { status: 'active' }),
    ...(domain && { domain: { contains: domain, mode: 'insensitive' } }),
    ...(status && { status }),
    ...(stage && { projectStage: stage }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { expertiseNeeded: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, institution: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, pages: Math.ceil(total / limit) };
};

const getPost = async (id) => {
  const post = await prisma.post.findUnique({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, role: true, institution: true, bio: true } },
    },
  });
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  return post;
};

const createPost = async (authorId, data) => {
  const expiresAt = data.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  return prisma.post.create({
    data: { ...data, authorId, expiresAt },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
};

const updatePost = async (id, userId, role, data) => {
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
  return prisma.post.update({ where: { id }, data });
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
  return prisma.post.update({ where: { id }, data: { deletedAt: new Date(), status: 'expired' } });
};

const markClosed = async (id, userId) => {
  const post = await prisma.post.findUnique({ where: { id, deletedAt: null } });
  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  if (post.authorId !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return prisma.post.update({ where: { id }, data: { status: 'partner_found' } });
};

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, markClosed };
