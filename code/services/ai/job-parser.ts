/**
 * Job Description Parser Service
 * 
 * Parses job descriptions and extracts structured data:
 * - Job title, company, location
 * - Required and preferred skills
 * - Keywords and phrases
 * - Experience level
 */

import { AIServiceBase, AI_SYSTEM_PROMPT } from './base';
import { buildJobDescriptionParsePrompt } from './prompts';
import type { ParsedJobDescription } from '@/types';

const JOB_PARSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    company: { type: 'string' },
    requiredSkills: {
      type: 'array',
      items: { type: 'string' },
    },
    preferredSkills: {
      type: 'array',
      items: { type: 'string' },
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
    },
    experienceLevel: {
      type: 'string',
      enum: ['entry', 'mid', 'senior', 'executive'],
    },
    location: { type: 'string' },
    responsibilities: {
      type: 'array',
      items: { type: 'string' },
    },
    qualifications: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['title', 'requiredSkills', 'preferredSkills', 'keywords'],
  additionalProperties: false,
};

export class JobDescriptionParser extends AIServiceBase {
  /**
   * Parse job description and extract structured data
   */
  /**
   * Parse job description and extract structured data
   * 
   * @param jobDescription - Raw job description text
   * @returns Parsed job description with structured data
   */
  async parseJobDescription(jobDescription: string): Promise<ParsedJobDescription> {
    const systemPrompt = `${AI_SYSTEM_PROMPT}

You are extracting structured data from a job description for resume optimization. Be thorough and comprehensive in your extraction.`;

    const userPrompt = buildJobDescriptionParsePrompt(jobDescription);

    const result = await this.callAI<{
      title: string;
      company?: string;
      requiredSkills: string[];
      preferredSkills: string[];
      keywords: string[];
      experienceLevel?: string;
      location?: string;
      responsibilities?: string[];
      qualifications?: string[];
    }>(systemPrompt, userPrompt, JOB_PARSE_SCHEMA);

    return {
      title: result.title,
      company: result.company,
      requiredSkills: result.requiredSkills,
      preferredSkills: result.preferredSkills,
      keywords: result.keywords,
      experienceLevel: result.experienceLevel as 'entry' | 'mid' | 'senior' | undefined,
      location: result.location,
    };
  }

  /**
   * Extract keywords from job description (lightweight version)
   */
  async extractKeywords(jobDescription: string): Promise<string[]> {
    const parsed = await this.parseJobDescription(jobDescription);
    return [
      ...parsed.requiredSkills,
      ...parsed.preferredSkills,
      ...parsed.keywords,
    ];
  }
}

// Singleton instance
export const jobDescriptionParser = new JobDescriptionParser();
