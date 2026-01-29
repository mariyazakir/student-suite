/**
 * Resume Improvement Service
 * 
 * AI-powered content improvement for resume sections.
 * Provides section-specific improvements with reasoning.
 */

import { AIServiceBase, AI_SYSTEM_PROMPT } from './base';
import { buildExperiencePrompt, buildSummaryPrompt, buildSkillsPrompt } from './prompts';
import type { ResumeData, ParsedJobDescription, AIImprovement } from '@/types';

const IMPROVEMENT_SCHEMA = {
  type: 'object',
  properties: {
    improvedContent: {
      type: 'object',
      description: 'The improved section content',
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: 'Keywords extracted or added',
    },
    reasoning: {
      type: 'string',
      description: 'Explanation of improvements',
    },
  },
  required: ['improvedContent', 'reasoning', 'keywords'],
  additionalProperties: false,
};

export class ResumeImprover extends AIServiceBase {
  /**
   * Improve experience section entry
   */
  /**
   * Improve experience section entry
   * 
   * @param experience - Experience entry to improve
   * @param jobDescription - Optional job description for context
   * @returns Improved achievements with keywords and reasoning
   */
  async improveExperience(
    experience: {
      company: string;
      position: string;
      location: string;
      startDate: string;
      endDate: string;
      achievements: string[];
    },
    jobDescription?: ParsedJobDescription
  ): Promise<{
    improvedAchievements: string[];
    keywords: string[];
    reasoning: string;
  }> {
    const systemPrompt = `${AI_SYSTEM_PROMPT}

You are an expert resume writer specializing in ATS-optimized, quantified achievements.`;

    const userPrompt = buildExperiencePrompt(experience, jobDescription);

    const result = await this.callAI<{
      improvedAchievements: string[];
      keywords: string[];
      reasoning: string;
    }>(systemPrompt, userPrompt, {
      type: 'object',
      properties: {
        improvedAchievements: {
          type: 'array',
          items: { type: 'string' },
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
        },
        reasoning: { type: 'string' },
      },
      required: ['improvedAchievements', 'keywords', 'reasoning'],
    });

    return result;
  }

  /**
   * Improve professional summary
   */
  /**
   * Improve professional summary
   * 
   * @param currentSummary - Current summary text (optional)
   * @param experienceHighlights - Experience highlights for context
   * @param jobDescription - Optional job description for optimization
   * @param experienceData - Full experience entries for detailed context
   * @param skillsData - Full skills data for context
   * @returns Improved summary with keywords and reasoning
   */
  async improveSummary(
    currentSummary: string | undefined,
    experienceHighlights: {
      totalYears: number;
      keyRoles: string[];
      keyAchievements: string[];
      industries: string[];
    },
    jobDescription?: ParsedJobDescription,
    experienceData?: any[],
    skillsData?: { technical: string[]; soft: string[] }
  ): Promise<{
    improvedSummary: string;
    keywords: string[];
    reasoning: string;
  }> {
    const systemPrompt = `${AI_SYSTEM_PROMPT}

You are an expert resume writer creating ATS-optimized professional summaries.`;

    const userPrompt = buildSummaryPrompt(
      currentSummary, 
      experienceHighlights, 
      jobDescription,
      experienceData,
      skillsData
    );

    const result = await this.callAI<{
      improvedSummary: string;
      keywords: string[];
      reasoning: string;
    }>(systemPrompt, userPrompt, {
      type: 'object',
      properties: {
        improvedSummary: { type: 'string' },
        keywords: {
          type: 'array',
          items: { type: 'string' },
        },
        reasoning: { type: 'string' },
      },
      required: ['improvedSummary', 'keywords', 'reasoning'],
    });

    return result;
  }

  /**
   * Optimize skills section
   */
  /**
   * Optimize skills section
   * 
   * @param currentSkills - Current skills to optimize
   * @param jobDescription - Job description for matching
   * @returns Optimized skills with missing skills identified
   */
  async optimizeSkills(
    currentSkills: {
      technical: string[];
      soft: string[];
    },
    jobDescription: ParsedJobDescription
  ): Promise<{
    optimizedTechnical: string[];
    optimizedSoft: string[];
    missingSkills: string[];
    reasoning: string;
  }> {
    const systemPrompt = `${AI_SYSTEM_PROMPT}

You are optimizing a resume skills section for ATS keyword matching.`;

    const userPrompt = buildSkillsPrompt(currentSkills, jobDescription);

    const result = await this.callAI<{
      optimizedTechnical: string[];
      optimizedSoft: string[];
      missingSkills: string[];
      reasoning: string;
    }>(systemPrompt, userPrompt, {
      type: 'object',
      properties: {
        optimizedTechnical: {
          type: 'array',
          items: { type: 'string' },
        },
        optimizedSoft: {
          type: 'array',
          items: { type: 'string' },
        },
        missingSkills: {
          type: 'array',
          items: { type: 'string' },
        },
        reasoning: { type: 'string' },
      },
      required: ['optimizedTechnical', 'optimizedSoft', 'missingSkills', 'reasoning'],
    });

    return result;
  }
}

// Singleton instance
export const resumeImprover = new ResumeImprover();
