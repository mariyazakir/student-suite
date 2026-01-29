/**
 * ATS Scoring Service
 * 
 * AI-powered ATS compatibility scoring.
 * Analyzes resume against job description and provides detailed scoring.
 */

import { AIServiceBase, AI_SYSTEM_PROMPT } from './base';
import { buildATSScoringPrompt } from './prompts';
import type { ResumeData, ParsedJobDescription, ATSScoreDetails } from '@/types';

const ATS_SCORING_SCHEMA = {
  type: 'object',
  properties: {
    overallScore: {
      type: 'number',
      minimum: 0,
      maximum: 100,
    },
    keywordMatch: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        matched: { type: 'array', items: { type: 'string' } },
        missing: { type: 'array', items: { type: 'string' } },
        explanation: { type: 'string' },
      },
      required: ['score', 'matched', 'missing', 'explanation'],
    },
    formatCompliance: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        explanation: { type: 'string' },
      },
      required: ['score', 'issues', 'explanation'],
    },
    contentQuality: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        explanation: { type: 'string' },
      },
      required: ['score', 'strengths', 'weaknesses', 'explanation'],
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['overallScore', 'keywordMatch', 'formatCompliance', 'contentQuality', 'recommendations'],
  additionalProperties: false,
};

export class ATSScorer extends AIServiceBase {
  /**
   * Calculate ATS score for resume against job description
   * 
   * @param resumeData - Resume data to score
   * @param jobDescription - Job description to match against
   * @returns Detailed ATS score breakdown
   */
  async calculateATSScore(
    resumeData: ResumeData,
    jobDescription: ParsedJobDescription
  ): Promise<ATSScoreDetails> {
    const systemPrompt = `${AI_SYSTEM_PROMPT}

You are an ATS (Applicant Tracking System) scoring specialist. You analyze resumes for compatibility with ATS systems and job requirements.`;

    const userPrompt = buildATSScoringPrompt(resumeData, jobDescription);

    const result = await this.callAI<ATSScoreDetails>(
      systemPrompt,
      userPrompt,
      ATS_SCORING_SCHEMA
    );

    return result;
  }
}

// Singleton instance
export const atsScorer = new ATSScorer();
