const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client to avoid connection-pool exhaustion under
// nodemon hot-reload and per-request instantiation.
const prisma = global.__prisma || new PrismaClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;
