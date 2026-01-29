/**
 * ATS Scoring API
 * 
 * POST /api/scoring/ats
 * Calculate ATS score for resume against job description
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuthContext, parseJSONBody } from '@/lib/api/middleware';
import { atsScorer } from '@/services/ai';
import { isMockMode, getMockResponse } from '@/services/ai/mocks';
import type { ResumeData, ParsedJobDescription } from '@/types';
import { buildRateLimitHeaders, checkRateLimit, getRateLimitConfig } from '@/lib/api/rate-limit';

/**
 * POST /api/scoring/ats
 * Calculate ATS score
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const isBuildPhase =
    process.env.VERCEL_ENV === 'production' &&
    process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuildPhase) {
    return NextResponse.json({ message: 'Skipping AI during build' }, { status: 200 });
  }

  const { recordUsageEvent } = await import('@/lib/usage/usage');

  const authContext = await requireAuthContext(request);
  const rateLimit = checkRateLimit(
    `scoring:ats:${authContext.sub}`,
    getRateLimitConfig('scoring:ats', authContext.tier)
  );
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please wait and try again.' } },
      { status: 429, headers: rateLimitHeaders }
    );
  }
  const body = await parseJSONBody<{
    resumeData: ResumeData;
    jobDescription: ParsedJobDescription;
  }>(request);

  if (!body.resumeData || !body.jobDescription) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Resume data and job description are required' } },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  // Use mock response if in mock mode
  if (isMockMode()) {
    const mockResponse = getMockResponse('calculateATSScore', body);
    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ats_score',
      metadata: { mock: true },
    });
    return NextResponse.json({ score: mockResponse }, { headers: rateLimitHeaders });
  }

  try {
    const score = await atsScorer.calculateATSScore(
      body.resumeData,
      body.jobDescription
    );

    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ats_score',
    });

    return NextResponse.json({ score }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('[API] ATS scoring error:', error);
    const mockResponse = getMockResponse('calculateATSScore', body);
    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ats_score',
      metadata: { mock: true },
    });
    return NextResponse.json({
      score: mockResponse,
      notice: 'AI is in mock mode. Add GOOGLE_API_KEY to enable real responses.',
    }, { headers: rateLimitHeaders });
  }
});
