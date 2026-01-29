/**
 * Resume Data Validation Schemas
 * 
 * Uses Zod for runtime validation of resume data.
 * Ensures data integrity before database storage.
 */

import { z } from 'zod';
import type { ResumeData } from '@/types';

// Personal Info Schema
export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  location: z.string().min(1, 'Location is required'),
  linkedIn: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  portfolio: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
  summary: z.string().optional(),
});

// Experience Item Schema
export const ExperienceItemSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
  endDate: z.union([
    z.literal('Present'),
    z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
  ]),
  achievements: z.array(z.string()).min(1, 'At least one achievement is required'),
  keywords: z.array(z.string()).optional(),
});

// Education Item Schema
export const EducationItemSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution name is required'),
  startYear: z.string().regex(/^\d{4}$/, 'Start year must be YYYY'),
  endYear: z.string().regex(/^\d{4}$/, 'End year must be YYYY'),
  description: z.string().min(1, 'Description is required'),
});

// Skills Schema
export const SkillsSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  languages: z.array(
    z.object({
      language: z.string(),
      proficiency: z.string(),
    })
  ).optional(),
});

// Certification Schema
export const CertificationSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  certificateName: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  year: z.string().regex(/^\d{4}$/, 'Year must be in YYYY format'),
  credentialLink: z.string().url('Invalid URL').optional(),
});

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  projectName: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  technologiesUsed: z.string().min(1, 'Technologies used are required'),
  projectLink: z.string().url('Invalid URL').optional(),
});

// Custom Section Schema
export const CustomSectionSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  title: z.string().min(1, 'Section title is required'),
  items: z.array(z.any()),
});

// Complete Resume Data Schema
export const ResumeDataSchema: z.ZodType<ResumeData> = z.object({
  personalInfo: PersonalInfoSchema,
  experience: z.array(ExperienceItemSchema),
  education: z.array(EducationItemSchema),
  skills: SkillsSchema,
  certifications: z.array(CertificationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  customSections: z.array(CustomSectionSchema).optional(),
});

/**
 * Validates resume data against schema
 * @param data - Resume data to validate
 * @returns Validated resume data or throws ZodError
 */
export function validateResumeData(data: unknown): ResumeData {
  return ResumeDataSchema.parse(data);
}

/**
 * Safely validates resume data and returns result
 * @param data - Resume data to validate
 * @returns Validation result with success flag
 */
export function safeValidateResumeData(data: unknown): {
  success: boolean;
  data?: ResumeData;
  errors?: z.ZodError;
} {
  const result = ResumeDataSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
