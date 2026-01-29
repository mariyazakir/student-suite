/**
 * AI Job Description Parser API
 * 
 * POST /api/ai/parse-job
 * Parse job description and extract structured data
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuthContext, parseJSONBody } from '@/lib/api/middleware';
import { jobDescriptionParser } from '@/services/ai';
import { isMockMode, getMockResponse } from '@/services/ai/mocks';
import { buildRateLimitHeaders, checkRateLimit, getRateLimitConfig } from '@/lib/api/rate-limit';
import { recordUsageEvent } from '@/lib/usage/usage';

/**
 * POST /api/ai/parse-job
 * Parse job description and extract keywords, skills, etc.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const authContext = await requireAuthContext(request);
  const rateLimit = checkRateLimit(
    `ai:parse-job:${authContext.sub}`,
    getRateLimitConfig('ai:parse-job', authContext.tier)
  );
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please wait and try again.' } },
      { status: 429, headers: rateLimitHeaders }
    );
  }
  const body = await parseJSONBody<{ jobDescription: string }>(request);

  if (!body.jobDescription || typeof body.jobDescription !== 'string') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Job description is required' } },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  // Use mock response if in mock mode
  if (isMockMode()) {
    const mockResponse = getMockResponse('parseJobDescription', body);
    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ai_parse_job',
      metadata: { length: body.jobDescription.length, mock: true },
    });
    return NextResponse.json({ parsedData: mockResponse }, { headers: rateLimitHeaders });
  }

  try {
    const parsedData = await jobDescriptionParser.parseJobDescription(
      body.jobDescription
    );

    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ai_parse_job',
      metadata: { length: body.jobDescription.length },
    });

    return NextResponse.json({ parsedData }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('[API] Job parsing error:', error);
    const mockResponse = getMockResponse('parseJobDescription', body);
    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ai_parse_job',
      metadata: { length: body.jobDescription.length, mock: true },
    });
    return NextResponse.json({
      parsedData: mockResponse,
      notice: 'AI is in mock mode. Add GOOGLE_API_KEY to enable real responses.',
    }, { headers: rateLimitHeaders });
  }
});
