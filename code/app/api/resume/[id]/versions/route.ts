/**
 * Resume Versions API Routes
 * 
 * GET /api/resume/[id]/versions - List all versions
 * POST /api/resume/[id]/versions - Create new version
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, parseJSONBody } from '@/lib/api/middleware';
import {
  getResumeVersions,
  createResumeVersion,
} from '@/lib/models/resume';
import { validateResumeData } from '@/lib/validation/resume-schema';
import type { ResumeData, VersionMetadata } from '@/types';

/**
 * GET /api/resume/[id]/versions
 * List all versions of a resume
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = await requireAuth(request);
    const resumeId = params.id;

    const versions = await getResumeVersions(resumeId, userId);

    return NextResponse.json({
      versions: versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        createdAt: v.createdAt.toISOString(),
        changeSummary: (v.metadata as any)?.changeSummary,
        aiOptimized: (v.metadata as any)?.aiOptimized || false,
        atsScore: v.atsScore,
        recruiterScore: v.recruiterScore,
      })),
    });
  }
);

/**
 * POST /api/resume/[id]/versions
 * Create a new version from current data
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = await requireAuth(request);
    const resumeId = params.id;
    const body = await parseJSONBody<{
      data: ResumeData;
      changeSummary?: string;
      aiOptimized?: boolean;
      jobDescriptionId?: string;
    }>(request);

    // Validate resume data
    const validatedData = validateResumeData(body.data);

    // Create metadata
    const metadata: Partial<VersionMetadata> = {
      changeSummary: body.changeSummary,
      aiOptimized: body.aiOptimized || false,
      jobDescriptionId: body.jobDescriptionId,
    };

    // Create new version
    const version = await createResumeVersion(
      resumeId,
      userId,
      validatedData,
      metadata
    );

    return NextResponse.json(
      {
        id: version.id,
        resumeId: version.resumeId,
        versionNumber: version.versionNumber,
        data: version.data,
        metadata: version.metadata,
        createdAt: version.createdAt.toISOString(),
      },
      { status: 201 }
    );
  }
);
