/**
 * AI Resume Improvement API
 * 
 * POST /api/ai/improve
 * Improve a specific resume section using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuthContext, parseJSONBody } from '@/lib/api/middleware';
import { resumeImprover } from '@/services/ai';
import { isMockMode, getMockResponse } from '@/services/ai/mocks';
import type { ParsedJobDescription, ExperienceItem } from '@/types';
import { buildRateLimitHeaders, checkRateLimit, getRateLimitConfig } from '@/lib/api/rate-limit';
import { recordUsageEvent } from '@/lib/usage/usage';

const parseYearMonth = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === 'present' || trimmed === 'current') {
    return new Date();
  }
  const match = trimmed.match(/^(\d{4})(?:[-/](\d{1,2}))?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) - 1 : 0;
  return new Date(year, month, 1);
};

const buildExperienceHighlights = (experience: ExperienceItem[]) => {
  if (!experience.length) {
    return {
      totalYears: 0,
      keyRoles: [],
      keyAchievements: [],
      industries: [],
    };
  }

  const keyRoles = Array.from(
    new Set(experience.map((item) => item.position).filter(Boolean))
  );
  const keyAchievements = experience
    .flatMap((item) => item.achievements || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  const totalYears = experience.reduce((total, item) => {
    const start = parseYearMonth(item.startDate);
    const end = parseYearMonth(item.endDate) || new Date();
    if (!start) return total;
    const diffMs = Math.max(end.getTime() - start.getTime(), 0);
    return total + diffMs / (1000 * 60 * 60 * 24 * 365);
  }, 0);

  return {
    totalYears: Math.max(0, Math.round(totalYears * 10) / 10),
    keyRoles,
    keyAchievements,
    industries: [],
  };
};

/**
 * POST /api/ai/improve
 * Improve a specific section of a resume
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const authContext = await requireAuthContext(request);
  const rateLimit = checkRateLimit(
    `ai:improve:${authContext.sub}`,
    getRateLimitConfig('ai:improve', authContext.tier)
  );
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please wait and try again.' } },
      { status: 429, headers: rateLimitHeaders }
    );
  }
  const body = await parseJSONBody<{
    section: 'experience' | 'summary' | 'skills';
    currentContent: any;
    jobDescription?: ParsedJobDescription;
  }>(request);

  if (!body.section || !body.currentContent) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Section and currentContent are required' } },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  // Use mock response if in mock mode
  if (isMockMode()) {
    // Map section to correct mock response key
    const mockKeyMap: Record<string, string> = {
      experience: 'improveExperience',
      summary: 'improveSummary',
      skills: 'optimizeSkills',
    };
    const mockKey = mockKeyMap[body.section] || `improve${body.section.charAt(0).toUpperCase() + body.section.slice(1)}`;
    
    try {
      const mockResponse = getMockResponse(mockKey, body);
      console.log('Mock mode - returning response for section:', body.section, 'key:', mockKey);
      await recordUsageEvent({
        userId: authContext.sub,
        action: 'ai_improve',
        metadata: { section: body.section, mock: true },
      });
      return NextResponse.json({
        improvedContent: mockResponse,
        reasoning: mockResponse.reasoning,
        keywords: mockResponse.keywords || [],
      }, { headers: rateLimitHeaders });
    } catch (error) {
      console.error('Error getting mock response:', error);
      return NextResponse.json(
        { error: { code: 'MOCK_ERROR', message: `Failed to get mock response: ${error instanceof Error ? error.message : 'Unknown error'}` } },
        { status: 500, headers: rateLimitHeaders }
      );
    }
  }

  console.log('[API] AI Improve Request:', {
    section: body.section,
    hasExperience: !!body.currentContent?.experience,
    hasSkills: !!body.currentContent?.skills,
    experienceCount: body.currentContent?.experience?.length || 0,
    skillsCount: (body.currentContent?.skills?.technical?.length || 0) + (body.currentContent?.skills?.soft?.length || 0),
  });

  let result;

  try {
    switch (body.section) {
      case 'experience':
        if (!body.currentContent.company || !body.currentContent.position) {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Invalid experience data' } },
            { status: 400, headers: rateLimitHeaders }
          );
        }
        result = await resumeImprover.improveExperience(
          body.currentContent,
          body.jobDescription
        );
        break;

      case 'summary':
        // Extract experience and skills data for context
        const experienceData = body.currentContent.experience || [];
        const skillsData = body.currentContent.skills || { technical: [], soft: [] };
        const experienceHighlights = body.currentContent.experienceHighlights
          || buildExperienceHighlights(experienceData);
        result = await resumeImprover.improveSummary(
          body.currentContent.summary,
          experienceHighlights,
          body.jobDescription,
          experienceData,
          skillsData
        );
        break;

      case 'skills':
        if (!body.jobDescription) {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Job description required for skills optimization' } },
            { status: 400, headers: rateLimitHeaders }
          );
        }
        result = await resumeImprover.optimizeSkills(
          body.currentContent,
          body.jobDescription
        );
        break;

      default:
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid section type' } },
          { status: 400, headers: rateLimitHeaders }
        );
    }

    if (!result) {
      console.error('[API] AI service returned empty result');
      throw new Error('AI service returned empty result');
    }

    const hasSummary = 'improvedSummary' in result && !!result.improvedSummary;
    const hasAchievements = 'improvedAchievements' in result && !!result.improvedAchievements;
    const keywords = 'keywords' in result ? result.keywords : [];
    console.log('[API] AI improvement successful:', {
      hasImprovedContent: hasSummary || hasAchievements,
      keywordsCount: keywords.length || 0,
    });

    await recordUsageEvent({
      userId: authContext.sub,
      action: 'ai_improve',
      metadata: { section: body.section },
    });

    return NextResponse.json({
      improvedContent: result,
      reasoning: result.reasoning,
      keywords,
    }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('[API] AI improvement error:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    const mockKeyMap: Record<string, string> = {
      experience: 'improveExperience',
      summary: 'improveSummary',
      skills: 'optimizeSkills',
    };
    const mockKey = mockKeyMap[body.section] || `improve${body.section.charAt(0).toUpperCase() + body.section.slice(1)}`;
    try {
      const mockResponse = getMockResponse(mockKey, body);
      await recordUsageEvent({
        userId: authContext.sub,
        action: 'ai_improve',
        metadata: { section: body.section, mock: true },
      });
      return NextResponse.json({
        improvedContent: mockResponse,
        reasoning: mockResponse.reasoning,
        keywords: mockResponse.keywords || [],
        notice: 'AI is in mock mode. Add GOOGLE_API_KEY to enable real responses.',
      }, { headers: rateLimitHeaders });
    } catch (mockError) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return NextResponse.json(
        { error: { code: 'AI_ERROR', message: errorMessage } },
        { status: 500, headers: rateLimitHeaders }
      );
    }
  }
});
