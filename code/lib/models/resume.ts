/**
 * Resume Model
 * 
 * Business logic layer for resume operations.
 * Handles resume CRUD, versioning, and data transformations.
 */

import prisma from '@/lib/db/prisma';
import { validateResumeData, safeValidateResumeData } from '@/lib/validation/resume-schema';
import type { ResumeData, VersionMetadata } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new resume with initial version
 */
export async function createResume(
  userId: string,
  title: string,
  data: ResumeData,
  changeSummary?: string
) {
  // Validate resume data
  const validatedData = validateResumeData(data);

  // Create resume and initial version in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create resume
    const resume = await tx.resume.create({
      data: {
        id: uuidv4(),
        userId,
        title,
      },
    });

    // Create initial version
    const version = await tx.resumeVersion.create({
      data: {
        id: uuidv4(),
        resumeId: resume.id,
        versionNumber: 1,
        data: validatedData as any, // Prisma JSON type
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: userId,
          changeSummary: changeSummary || 'Initial version',
          aiOptimized: false,
        } as any,
      },
    });

    // Update resume with current version
    await tx.resume.update({
      where: { id: resume.id },
      data: { currentVersionId: version.id },
    });

    return { resume, version };
  });

  return result;
}

/**
 * Get resume by ID with current version
 */
export async function getResumeById(resumeId: string, userId: string) {
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId, // Ensure user owns the resume
    },
  });

  if (!resume) {
    return null;
  }

  // Get current version if exists
  let currentVersion = null;
  if (resume.currentVersionId) {
    currentVersion = await prisma.resumeVersion.findUnique({
      where: { id: resume.currentVersionId },
    });
  }

  return {
    ...resume,
    versions: currentVersion ? [currentVersion] : [],
  };
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      currentVersionId: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

/**
 * Update resume metadata (title, job description)
 */
export async function updateResumeMetadata(
  resumeId: string,
  userId: string,
  updates: {
    title?: string;
    jobDescription?: string;
  }
) {
  // Verify ownership
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new Error('Resume not found or access denied');
  }

  return prisma.resume.update({
    where: { id: resumeId },
    data: updates,
  });
}

/**
 * Create a new version of a resume
 */
export async function createResumeVersion(
  resumeId: string,
  userId: string,
  data: ResumeData,
  metadata: Partial<VersionMetadata>
) {
  // Validate data
  const validatedData = validateResumeData(data);

  // Verify ownership
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
  });

  if (!resume) {
    throw new Error('Resume not found or access denied');
  }

  // Get next version number
  const nextVersionNumber = resume.versions[0]?.versionNumber
    ? resume.versions[0].versionNumber + 1
    : 1;

  // Create new version
  const version = await prisma.$transaction(async (tx) => {
    const newVersion = await tx.resumeVersion.create({
      data: {
        id: uuidv4(),
        resumeId,
        versionNumber: nextVersionNumber,
        data: validatedData as any,
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: userId,
          changeSummary: metadata.changeSummary || `Version ${nextVersionNumber}`,
          aiOptimized: metadata.aiOptimized || false,
          jobDescriptionId: metadata.jobDescriptionId,
        } as any,
      },
    });

    // Update resume current version
    await tx.resume.update({
      where: { id: resumeId },
      data: { currentVersionId: newVersion.id },
    });

    return newVersion;
  });

  return version;
}

/**
 * Get resume version by ID
 */
export async function getResumeVersion(versionId: string, userId: string) {
  const version = await prisma.resumeVersion.findFirst({
    where: {
      id: versionId,
      resume: {
        userId, // Verify ownership through resume
      },
    },
    include: {
      resume: true,
    },
  });

  return version;
}

/**
 * Get all versions for a resume
 */
export async function getResumeVersions(resumeId: string, userId: string) {
  // Verify ownership
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new Error('Resume not found or access denied');
  }

  return prisma.resumeVersion.findMany({
    where: { resumeId },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      createdAt: true,
      metadata: true,
      atsScore: true,
      recruiterScore: true,
    },
  });
}

/**
 * Delete a resume and all its versions
 */
export async function deleteResume(resumeId: string, userId: string) {
  // Verify ownership
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new Error('Resume not found or access denied');
  }

  // Cascade delete will handle versions
  await prisma.resume.delete({
    where: { id: resumeId },
  });

  return { success: true };
}

/**
 * Restore a previous version (creates new version from old data)
 */
export async function restoreResumeVersion(
  resumeId: string,
  versionId: string,
  userId: string
) {
  // Get the version to restore
  const versionToRestore = await getResumeVersion(versionId, userId);

  if (!versionToRestore) {
    throw new Error('Version not found or access denied');
  }

  // Validate the old data
  const validatedData = safeValidateResumeData(versionToRestore.data);
  if (!validatedData.success || !validatedData.data) {
    throw new Error('Invalid resume data in version');
  }

  // Create new version from old data
  return createResumeVersion(resumeId, userId, validatedData.data, {
    changeSummary: `Restored from version ${versionToRestore.versionNumber}`,
    aiOptimized: false,
  });
}
