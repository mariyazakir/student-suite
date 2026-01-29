import type { ResumeData } from '@/types';

interface ChatRequestBody {
  message: string;
  resumeData?: ResumeData;
  jobDescription?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const makeResponse = (reply: string, suggestions: string[]) => ({
  reply,
  suggestions,
});

const getPredefinedResponse = (message: string, resumeData?: ResumeData) => {
  const text = message.toLowerCase();

  if (text.includes('full stack') || text.includes('fullstack')) {
    return makeResponse(
      'For full-stack roles, focus on a balanced frontend + backend skill set.',
      [
        'Frontend: React/Next.js, TypeScript, state management, testing.',
        'Backend: Node.js, REST APIs, authentication, databases (PostgreSQL).',
        'DevOps: Docker, CI/CD, cloud basics (AWS/GCP/Azure).',
        'Architecture: system design, performance, scalability basics.',
      ]
    );
  }

  if (text.includes('ethical') || text.includes('cyber') || text.includes('security')) {
    return makeResponse(
      'For cybersecurity roles, projects should show hands-on security work and measurable outcomes.',
      [
        'Web app pentest lab (OWASP Top 10) with write-ups.',
        'CTF write-ups showing methods, tools, and outcomes.',
        'Vulnerability scanner or log analysis pipeline.',
        'SIEM/SOC lab with alert triage and incident response notes.',
      ]
    );
  }

  if (text.includes('summary')) {
    return makeResponse(
      'A strong summary should be 2–4 lines and include keywords + measurable impact.',
      [
        'State your role and years of experience.',
        'Add 2–3 key skills that match the job.',
        'Include one quantified achievement.',
      ]
    );
  }

  if (text.includes('experience') || text.includes('bullet')) {
    return makeResponse(
      'Experience bullets should highlight impact, not just tasks.',
      [
        'Start each bullet with an action verb.',
        'Add numbers: %, $, time saved, users impacted.',
        'Focus on outcomes and business impact.',
      ]
    );
  }

  if (text.includes('ats')) {
    return makeResponse(
      'ATS optimization is about clear structure and keyword alignment.',
      [
        'Use standard headings (Experience, Education, Skills).',
        'Mirror job description keywords naturally.',
        'Keep formatting simple—no tables or graphics.',
      ]
    );
  }

  if (text.includes('project')) {
    return makeResponse(
      'Projects should show scope, tech stack, and measurable impact.',
      [
        'Add 2–3 bullet outcomes with numbers.',
        'List the core technologies used.',
        'Explain the problem and your specific role.',
      ]
    );
  }

  const suggestions: string[] = [];
  if (resumeData) {
    if (!resumeData.personalInfo.summary || resumeData.personalInfo.summary.trim().length < 60) {
      suggestions.push('Expand your summary to 2–4 lines with keywords and impact.');
    }
    if (resumeData.experience.length === 0) {
      suggestions.push('Add at least one experience entry with 2–3 bullets.');
    }
    if (resumeData.skills.technical.length + resumeData.skills.soft.length === 0) {
      suggestions.push('Add a skills section with relevant tools and technologies.');
    }
  }

  return makeResponse(
    'Here are a few practical improvements you can make.',
    suggestions.length
      ? suggestions
      : [
          'Add quantified achievements to experience.',
          'Tailor skills to the job description.',
          'Keep formatting clean and ATS-friendly.',
        ]
  );
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message: string;
      resumeData?: any;
      jobDescription?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!body?.message?.trim()) {
      return Response.json({ error: 'Message is required.' }, { status: 400 });
    }

    return Response.json(getPredefinedResponse(body.message, body.resumeData));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
