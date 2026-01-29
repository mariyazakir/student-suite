/**
 * AI Project Improvement API
 * 
 * POST /api/ai/improve-project
 * Improve a project section using AI
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuthContext, parseJSONBody } from '@/lib/api/middleware';
import { projectImprover } from '@/services/ai';
import { isMockMode, getMockResponse } from '@/services/ai/mocks';
import type { ParsedJobDescription, Project } from '@/types';
import { buildRateLimitHeaders, checkRateLimit, getRateLimitConfig } from '@/lib/api/rate-limit';
import { recordUsageEvent } from '@/lib/usage/usage';

/**
 * POST /api/ai/improve-project
 * Improve a project section
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const isBuildPhase =
    process.env.VERCEL_ENV === 'production' &&
    process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildPhase) {
    return NextResponse.json(
      { message: 'Skipping AI during build' },
      { status: 200 }
    );
  }

  const authContext = await requireAuthContext(request);
  const rateLimit = checkRateLimit(
    `ai:improve-project:${authContext.sub}`,
    getRateLimitConfig('ai:improve-project', authContext.tier)
  );
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please wait and try again.' } },
      { status: 429, headers: rateLimitHeaders }
    );
  }
  const body = await parseJSONBody<{
    project: Project;
    jobDescription?: ParsedJobDescription;
  }>(request);

  if (!body.project || !body.project.projectName || !body.project.description) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Project name and description are required' } },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  // Use mock response if in mock mode (no Prisma / recordUsageEvent)
  if (isMockMode()) {
    const mockResponse = getMockResponse('improveProject', body);
    return NextResponse.json(mockResponse, { headers: rateLimitHeaders });
  }

  try {
    const result = await projectImprover.improveProject(
      body.project,
      body.jobDescription
    );

    if (!isMockMode()) {
      await recordUsageEvent({
        userId: authContext.sub,
        action: 'ai_improve_project',
      });
    }

    return NextResponse.json({
      improvedDescription: result.improvedDescription,
      improvedAchievements: result.improvedAchievements,
      optimizedTechnologies: result.optimizedTechnologies,
      keywords: result.keywords,
      reasoning: result.reasoning,
    }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('[API] Project improvement error:', error);
    const mockResponse = getMockResponse('improveProject', body);
    if (!isMockMode()) {
      await recordUsageEvent({
        userId: authContext.sub,
        action: 'ai_improve_project',
        metadata: { mock: true },
      });
    }
    return NextResponse.json({
      ...mockResponse,
      notice: 'AI is in mock mode. Add GOOGLE_API_KEY to enable real responses.',
    }, { headers: rateLimitHeaders });
  }
});
