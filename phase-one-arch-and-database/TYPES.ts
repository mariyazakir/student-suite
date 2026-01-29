/**
 * TypeScript Type Definitions
 * Core types for the Resume Builder SaaS
 */

// ==================== Resume Data Types ====================

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  portfolio?: string;
  summary?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string; // YYYY-MM
  endDate: string | 'Present';
  achievements: string[]; // Quantified bullets
  keywords?: string[]; // Extracted keywords
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  graduationDate: string; // YYYY-MM
  gpa?: string;
  honors?: string[];
}

export interface Language {
  language: string;
  proficiency: string; // Native, Fluent, Conversational, Basic
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages?: Language[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // YYYY-MM
  expiryDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  achievements: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  items: any[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: Skills;
  certifications?: Certification[];
  projects?: Project[];
  customSections?: CustomSection[];
}

// ==================== Version Metadata ====================

export interface VersionMetadata {
  createdAt: string;
  createdBy: string;
  changeSummary?: string;
  aiOptimized: boolean;
  jobDescriptionId?: string;
}

// ==================== Scoring Types ====================

export interface KeywordMatch {
  score: number;
  matched: string[];
  missing: string[];
  explanation: string;
}

export interface FormatCompliance {
  score: number;
  issues: string[];
  explanation: string;
}

export interface ContentQuality {
  score: number;
  strengths: string[];
  weaknesses: string[];
  explanation: string;
}

export interface ATSScoreDetails {
  overallScore: number; // 0-100
  keywordMatch: KeywordMatch;
  formatCompliance: FormatCompliance;
  contentQuality: ContentQuality;
  recommendations: string[];
}

export interface ImpactScore {
  score: number;
  explanation: string;
  examples: string[];
}

export interface RecruiterScoreDetails {
  overallScore: number; // 0-100
  impact: ImpactScore;
  clarity: {
    score: number;
    explanation: string;
  };
  relevance: {
    score: number;
    explanation: string;
  };
  professionalism: {
    score: number;
    explanation: string;
  };
  recommendations: string[];
}

// ==================== Job Description Types ====================

export interface ParsedJobDescription {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  experienceLevel?: string;
  location?: string;
}

// ==================== AI Improvement Types ====================

export interface AIImprovement {
  section: string;
  originalContent: string;
  improvedContent: string;
  reasoning: string;
}

export interface AISectionPrompt {
  section: string;
  currentContent: any;
  jobDescription?: ParsedJobDescription;
  instructions: string;
}

// ==================== API Response Types ====================

export interface ResumeResponse {
  id: string;
  userId: string;
  title: string;
  currentVersionId?: string;
  jobDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersionResponse {
  id: string;
  resumeId: string;
  versionNumber: number;
  data: ResumeData;
  metadata: VersionMetadata;
  atsScore?: number;
  recruiterScore?: number;
  scores?: {
    ats?: ATSScoreDetails;
    recruiter?: RecruiterScoreDetails;
  };
  createdAt: string;
}

// ==================== Export Types ====================

export interface ExportOptions {
  format: 'pdf' | 'docx';
  includeScores?: boolean;
  template?: 'modern' | 'classic' | 'ats-optimized';
}

// ==================== Validation Schemas (Zod) ====================

import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.string().min(1),
  linkedIn: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  summary: z.string().optional(),
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string().min(1),
  position: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.union([z.literal('Present'), z.string().regex(/^\d{4}-\d{2}$/)]),
  achievements: z.array(z.string()).min(1),
  keywords: z.array(z.string()).optional(),
});

export const ResumeDataSchema = z.object({
  personalInfo: PersonalInfoSchema,
  experience: z.array(ExperienceItemSchema),
  education: z.array(z.object({
    id: z.string(),
    institution: z.string().min(1),
    degree: z.string().min(1),
    field: z.string().min(1),
    location: z.string().min(1),
    graduationDate: z.string().regex(/^\d{4}-\d{2}$/),
    gpa: z.string().optional(),
    honors: z.array(z.string()).optional(),
  })),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    languages: z.array(z.object({
      language: z.string(),
      proficiency: z.string(),
    })).optional(),
  }),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    issuer: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}$/),
    expiryDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  })).optional(),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().min(1),
    technologies: z.array(z.string()),
    url: z.string().url().optional(),
    achievements: z.array(z.string()),
  })).optional(),
  customSections: z.array(z.any()).optional(),
});
