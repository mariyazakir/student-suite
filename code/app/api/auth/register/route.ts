import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, parseJSONBody } from '@/lib/api/middleware';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { signAuthToken, type SubscriptionTier } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await parseJSONBody<{
    email: string;
    name: string;
    password: string;
  }>(request);
  const { email, name, password } = registerSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { code: 'USER_EXISTS', message: 'A user with this email already exists.' } },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      name,
      passwordHash,
    },
  });

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
