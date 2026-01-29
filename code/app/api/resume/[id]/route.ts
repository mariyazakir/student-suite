/**
 * Resume Detail API Routes
 * 
 * GET /api/resume/[id] - Get resume details
 * PUT /api/resume/[id] - Update resume metadata
 * DELETE /api/resume/[id] - Delete resume
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, parseJSONBody } from '@/lib/api/middleware';
import {
  getResumeById,
  updateResumeMetadata,
  deleteResume,
} from '@/lib/models/resume';
import { NotFoundError } from '@/lib/api/errors';

/**
 * GET /api/resume/[id]
 * Get resume details with current version
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = await requireAuth(request);
    const resumeId = params.id;

    const resume = await getResumeById(resumeId, userId);

    if (!resume) {
      throw new NotFoundError('Resume', resumeId);
    }

    // Get current version data
    let currentVersion = null;
    if (resume.currentVersionId) {
      const version = resume.versions[0];
      if (version) {
        currentVersion = {
          id: version.id,
          versionNumber: version.versionNumber,
          data: version.data,
          metadata: version.metadata,
          atsScore: version.atsScore,
          recruiterScore: version.recruiterScore,
          scores: version.scores,
          createdAt: version.createdAt.toISOString(),
        };
      }
    }

    return NextResponse.json({
      id: resume.id,
      title: resume.title,
      currentVersionId: resume.currentVersionId,
      jobDescription: resume.jobDescription,
      currentVersion: currentVersion,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  }
);

/**
 * PUT /api/resume/[id]
 * Update resume metadata (title, job description)
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = await requireAuth(request);
    const resumeId = params.id;
    const body = await parseJSONBody<{
      title?: string;
      jobDescription?: string;
    }>(request);

    const updated = await updateResumeMetadata(resumeId, userId, body);

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      currentVersionId: updated.currentVersionId,
      jobDescription: updated.jobDescription,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }
);

/**
 * DELETE /api/resume/[id]
 * Delete resume and all versions
 */
export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = await requireAuth(request);
    const resumeId = params.id;

    await deleteResume(resumeId, userId);

    return NextResponse.json({ success: true });
  }
);
