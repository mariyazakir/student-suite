/**
 * Project Section Improvement Service
 * 
 * AI-powered improvement for project descriptions.
 * Optimizes projects for ATS and job-specific requirements.
 */

import { AIServiceBase, AI_SYSTEM_PROMPT } from './base';
import { buildProjectsPrompt } from './prompts';
import type { ParsedJobDescription, Project } from '@/types';

const PROJECT_IMPROVEMENT_SCHEMA = {
  type: 'object',
  properties: {
    improvedDescription: { type: 'string' },
    improvedAchievements: {
      type: 'array',
      items: { type: 'string' },
    },
    optimizedTechnologies: {
      type: 'array',
      items: { type: 'string' },
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
    },
    reasoning: { type: 'string' },
  },
  required: ['improvedDescription', 'improvedAchievements', 'optimizedTechnologies', 'keywords', 'reasoning'],
  additionalProperties: false,
};

export class ProjectImprover extends AIServiceBase {
  /**
   * Improve project description and achievements
   */
  async improveProject(
    project: Project,
    jobDescription?: ParsedJobDescription
  ): Promise<{
    improvedDescription: string;
    improvedAchievements: string[];
    optimizedTechnologies: string[];
    keywords: string[];
    reasoning: string;
  }> {
    const systemPrompt = `${AI_SYSTEM_PROMPT}

You are an expert at optimizing project descriptions for resumes, focusing on technical impact and ATS keyword matching.`;

    const userPrompt = buildProjectsPrompt(
      {
        name: project.projectName,
        description: project.description,
        technologies: project.technologiesUsed
          ? project.technologiesUsed.split(',').map((tech) => tech.trim()).filter(Boolean)
          : [],
        url: project.projectLink,
        achievements: [],
      },
      jobDescription
    );

    const result = await this.callAI<{
      improvedDescription: string;
      improvedAchievements: string[];
      optimizedTechnologies: string[];
      keywords: string[];
      reasoning: string;
    }>(systemPrompt, userPrompt, PROJECT_IMPROVEMENT_SCHEMA);

    return result;
  }
}

// Singleton instance
export const projectImprover = new ProjectImprover();
