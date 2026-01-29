/**
 * AI Service Input/Output Contracts
 * 
 * Type-safe contracts defining inputs and outputs for all AI services.
 * Ensures consistency and makes it easy to understand what each service expects/returns.
 */

import type {
  ResumeData,
  ParsedJobDescription,
  ATSScoreDetails,
  ExperienceItem,
  Project,
} from '@/types';

/**
 * Job Description Parser Contract
 */
export interface JobDescriptionParserContract {
  input: {
    jobDescription: string; // Raw job description text
  };
  output: ParsedJobDescription; // Structured parsed data
}

/**
 * Experience Improvement Contract
 */
export interface ExperienceImprovementContract {
  input: {
    experience: {
      company: string;
      position: string;
      location: string;
      startDate: string; // YYYY-MM
      endDate: string | 'Present'; // YYYY-MM or 'Present'
      achievements: string[]; // Current achievement bullets
    };
    jobDescription?: ParsedJobDescription; // Optional for context
  };
  output: {
    improvedAchievements: string[]; // 3-5 improved bullets
    keywords: string[]; // Keywords incorporated
    reasoning: string; // Explanation of improvements
  };
}

/**
 * Summary Improvement Contract
 */
export interface SummaryImprovementContract {
  input: {
    currentSummary?: string; // Current summary text (optional)
    experienceHighlights: {
      totalYears: number;
      keyRoles: string[];
      keyAchievements: string[];
      industries: string[];
    };
    jobDescription?: ParsedJobDescription; // Optional for optimization
  };
  output: {
    improvedSummary: string; // 2-4 sentence summary
    keywords: string[]; // Keywords incorporated
    reasoning: string; // Explanation of improvements
  };
}

/**
 * Skills Optimization Contract
 */
export interface SkillsOptimizationContract {
  input: {
    currentSkills: {
      technical: string[];
      soft: string[];
    };
    jobDescription: ParsedJobDescription; // Required for matching
  };
  output: {
    optimizedTechnical: string[]; // Prioritized technical skills
    optimizedSoft: string[]; // Prioritized soft skills
    missingSkills: string[]; // Missing critical skills
    reasoning: string; // Explanation of optimization
  };
}

/**
 * Project Improvement Contract
 */
export interface ProjectImprovementContract {
  input: {
    project: Project;
    jobDescription?: ParsedJobDescription; // Optional for context
  };
  output: {
    improvedDescription: string; // Enhanced project description
    improvedAchievements: string[]; // 3-5 improved achievement bullets
    optimizedTechnologies: string[]; // Technologies aligned with job
    keywords: string[]; // Keywords incorporated
    reasoning: string; // Explanation of improvements
  };
}

/**
 * ATS Scoring Contract
 */
export interface ATSScoringContract {
  input: {
    resumeData: ResumeData; // Complete resume data
    jobDescription: ParsedJobDescription; // Job to match against
  };
  output: ATSScoreDetails; // Detailed score breakdown
}

/**
 * Helper function to validate contract input
 */
export function validateContractInput<T>(
  input: unknown,
  validator: (input: unknown) => input is T
): T {
  if (!validator(input)) {
    throw new Error('Invalid contract input');
  }
  return input;
}

/**
 * Helper function to validate contract output
 */
export function validateContractOutput<T>(
  output: unknown,
  validator: (output: unknown) => output is T
): T {
  if (!validator(output)) {
    throw new Error('Invalid contract output');
  }
  return output;
}
