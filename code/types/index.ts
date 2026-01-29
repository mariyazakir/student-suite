/**
 * TypeScript Type Definitions
 * Core types for the Resume Builder SaaS
 * 
 * This file exports all type definitions used throughout the application.
 * Types are based on Phase 1 architecture.
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
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface Language {
  id: string;
  language: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Fluent' | 'Native';
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface Certification {
  id: string;
  certificateName: string;
  issuer: string;
  year: string;
  credentialLink?: string;
}

export interface Project {
  id: string;
  projectName: string;
  description: string;
  technologiesUsed: string;
  projectLink?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: any[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  year: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: Skills;
  certifications?: Certification[];
  projects?: Project[];
  achievements?: Achievement[];
  languages?: Language[];
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

// ==================== API Error Types ====================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
