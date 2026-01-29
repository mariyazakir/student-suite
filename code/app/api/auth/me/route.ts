export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuthContext } from '@/lib/api/middleware';
import prisma from '@/lib/db/prisma';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const authContext = await requireAuthContext(request);
  const user = await prisma.user.findUnique({ where: { id: authContext.sub } });

  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found.' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.subscriptionTier,
      createdAt: user.createdAt,
    },
  });
});
