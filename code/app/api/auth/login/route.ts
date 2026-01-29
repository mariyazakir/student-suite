export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, parseJSONBody } from '@/lib/api/middleware';
import prisma from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signAuthToken, type SubscriptionTier } from '@/lib/auth/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await parseJSONBody<{ email: string; password: string }>(request);
  const { email, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    tier: user.subscriptionTier as SubscriptionTier,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.subscriptionTier,
    },
  });
});
