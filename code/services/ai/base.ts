/**
 * AI Service Base
 *
 * Base class and utilities for AI service implementations.
 * Uses Gemini API for AI responses.
 */

import type { ParsedJobDescription } from '@/types';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 20000);

/**
 * Base AI service class
 */
export abstract class AIServiceBase {
  protected modelName: string;

  constructor(modelName: string = GEMINI_MODEL) {
    this.modelName = modelName;
  }

  /**
   * Call Gemini API with structured output
   */
  protected async callAI<T>(
    systemPrompt: string,
    userPrompt: string,
    _responseSchema?: any
  ): Promise<T> {
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured.');
    }

    const modelsToTry = [
      this.modelName,
      'gemini-1.5-flash-001',
      'gemini-1.5-flash',
      'gemini-1.5-pro-001',
      'gemini-1.5-pro',
    ];

    try {
      let lastError: Error | null = null;

      for (const model of modelsToTry) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2000,
                responseMimeType: 'application/json',
              },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorPayload = await response.json();
            errorDetail = JSON.stringify(errorPayload);
          } catch {
            try {
              errorDetail = await response.text();
            } catch {
              errorDetail = '';
            }
          }
          const detailSuffix = errorDetail ? ` - ${errorDetail}` : '';
          lastError = new Error(`Gemini API error: ${response.status} ${response.statusText}${detailSuffix}`);
          if (response.status === 404) {
            continue;
          }
          throw lastError;
        }

        const payload = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          lastError = new Error('No response from Gemini.');
          continue;
        }

        try {
          return JSON.parse(content) as T;
        } catch (parseError) {
          throw new Error(
            `Invalid JSON response from Gemini: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
          );
        }
      }

      throw lastError || new Error(`Gemini API error: model not found (${modelsToTry.join(', ')})`);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Gemini API timed out after ${GEMINI_TIMEOUT_MS}ms.`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error: ${String(error)}`);
    }
  }

  /**
   * Extract text from resume data for keyword matching
   */
  protected extractResumeText(resumeData: any): string {
    const parts: string[] = [];

    // Personal info
    if (resumeData.personalInfo?.summary) {
      parts.push(resumeData.personalInfo.summary);
    }

    // Experience
    if (resumeData.experience) {
      resumeData.experience.forEach((exp: any) => {
        parts.push(`${exp.position} at ${exp.company}`);
        if (exp.achievements) {
          parts.push(...exp.achievements);
        }
      });
    }

    // Skills
    if (resumeData.skills?.technical) {
      parts.push(...resumeData.skills.technical);
    }

    // Education
    if (resumeData.education) {
      resumeData.education.forEach((edu: any) => {
        parts.push(`${edu.degree} in ${edu.field}`);
      });
    }

    return parts.join(' ');
  }
}

/**
 * System prompt for all AI operations
 */
export const AI_SYSTEM_PROMPT = `
You are an expert resume writer and ATS optimization specialist.

CORE RULES:
1. NEVER generate generic, filler text
2. ALWAYS quantify achievements with numbers, percentages, or metrics
3. ALWAYS optimize for ATS keyword matching
4. ALWAYS provide reasoning for changes
5. NEVER fabricate experience or achievements
6. ALWAYS use industry-standard terminology
7. ALWAYS focus on impact and results, not just responsibilities
8. ALWAYS tailor content to the specific job description provided
`;
