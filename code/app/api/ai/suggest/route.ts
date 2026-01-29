import { NextResponse } from 'next/server';
import type { ResumeData } from '@/types';

interface SuggestRequestBody {
  resumeData: ResumeData;
  jobDescription?: string;
}

const buildSuggestions = (resumeData: ResumeData) => {
  const suggestions: string[] = [];

  if (!resumeData.personalInfo.summary || resumeData.personalInfo.summary.trim().length < 60) {
    suggestions.push('Expand your summary to 2–4 lines with keywords and impact.');
  }
  if (!resumeData.personalInfo.email) {
    suggestions.push('Add a professional email address.');
  }
  if (!resumeData.personalInfo.phone) {
    suggestions.push('Add a phone number for easy contact.');
  }
  if (resumeData.experience.length === 0) {
    suggestions.push('Add at least one experience entry with 2–3 bullet points.');
  }
  if (resumeData.experience.some((exp) => exp.achievements.every((a) => !a.trim()))) {
    suggestions.push('Add impact-focused bullets under experience entries.');
  }
  if (resumeData.skills.technical.length + resumeData.skills.soft.length === 0) {
    suggestions.push('Add a skills section with tools and technologies.');
  }
  if (resumeData.education.length === 0) {
    suggestions.push('Add at least one education entry.');
  }

  if (!suggestions.length) {
    suggestions.push('Your resume looks solid. Consider tailoring keywords to the job.');
  }

  return suggestions;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestRequestBody;
    if (!body?.resumeData) {
      return NextResponse.json({ error: 'Resume data is required.' }, { status: 400 });
    }

    return NextResponse.json({
      summary: 'Focus on completeness and quantified impact.',
      suggestions: buildSuggestions(body.resumeData),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
