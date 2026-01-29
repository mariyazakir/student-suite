/**
 * Resume Version Detail API Routes
 * 
 * GET /api/resume/[id]/versions/[versionId] - Get specific version
 * POST /api/resume/[id]/versions/[versionId]/restore - Restore version
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth } from '@/lib/api/middleware';
import {
  getResumeVersion,
  restoreResumeVersion,
} from '@/lib/models/resume';
import { NotFoundError } from '@/lib/api/errors';

/**
 * GET /api/resume/[id]/versions/[versionId]
 * Get specific version details
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string; versionId: string } }
  ) => {
    const userId = await requireAuth(request);
    const { id: resumeId, versionId } = params;

    const version = await getResumeVersion(versionId, userId);

    if (!version || version.resumeId !== resumeId) {
      throw new NotFoundError('Resume version', versionId);
    }

    return NextResponse.json({
      id: version.id,
      resumeId: version.resumeId,
      versionNumber: version.versionNumber,
      data: version.data,
      metadata: version.metadata,
      atsScore: version.atsScore,
      recruiterScore: version.recruiterScore,
      scores: version.scores,
      createdAt: version.createdAt.toISOString(),
    });
  }
);

/**
 * POST /api/resume/[id]/versions/[versionId]/restore
 * Restore a previous version (creates new version from old data)
 */
export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string; versionId: string } }
  ) => {
    const userId = await requireAuth(request);
    const { id: resumeId, versionId } = params;

    const newVersion = await restoreResumeVersion(resumeId, versionId, userId);

    return NextResponse.json(
      {
        id: newVersion.id,
        resumeId: newVersion.resumeId,
        versionNumber: newVersion.versionNumber,
        data: newVersion.data,
        metadata: newVersion.metadata,
        createdAt: newVersion.createdAt.toISOString(),
        restored: true,
      },
      { status: 201 }
    );
  }
);
