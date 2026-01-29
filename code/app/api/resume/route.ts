/**
 * Resume API Routes
 * 
 * GET /api/resume - List all resumes for user
 * POST /api/resume - Create new resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, parseJSONBody } from '@/lib/api/middleware';
import { createResume, getUserResumes } from '@/lib/models/resume';
import { validateResumeData } from '@/lib/validation/resume-schema';
import type { ResumeData } from '@/types';

/**
 * GET /api/resume
 * List all resumes for authenticated user
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await requireAuth(request);
  
  const resumes = await getUserResumes(userId);
  
  return NextResponse.json({
    resumes: resumes.map((r) => ({
      id: r.id,
      title: r.title,
      currentVersionId: r.currentVersionId,
      updatedAt: r.updatedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

/**
 * POST /api/resume
 * Create a new resume with initial version
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await requireAuth(request);
  const body = await parseJSONBody<{
    title: string;
    data: ResumeData;
    changeSummary?: string;
  }>(request);

  // Validate input
  if (!body.title || !body.data) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Title and data are required' } },
      { status: 400 }
    );
  }

  // Validate resume data
  const validatedData = validateResumeData(body.data);

  // Create resume
  const { resume, version } = await createResume(
    userId,
    body.title,
    validatedData,
    body.changeSummary
  );

  return NextResponse.json(
    {
      id: resume.id,
      title: resume.title,
      currentVersionId: version.id,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    },
    { status: 201 }
  );
});
