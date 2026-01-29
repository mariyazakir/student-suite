/**
 * Prisma Client Singleton
 * 
 * Creates a single instance of Prisma Client for the application.
 * Prevents multiple instances in development (hot reload) and production.
 * 
 * Usage:
 *   import prisma from '@/lib/db/prisma';
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
