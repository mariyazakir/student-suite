import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export type UsageAction =
  | 'ai_improve'
  | 'ai_parse_job'
  | 'ai_improve_project'
  | 'ats_score';

export async function recordUsageEvent({
  userId,
  action,
  metadata,
}: {
  userId: string;
  action: UsageAction;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.usageEvent.create({
      data: {
        userId,
        action,
        metadata: metadata ?? {},
      },
    });
  } catch (error) {
    console.error('Failed to record usage event', error);
  }
}
