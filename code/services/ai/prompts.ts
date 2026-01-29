/**
 * AI Prompt Templates
 * 
 * Centralized prompt templates for all AI operations.
 * All prompts are designed to be job-specific and non-generic.
 */

import type { ParsedJobDescription, ResumeData } from '@/types';

/**
 * Base system prompt for all AI operations
 */
export const BASE_SYSTEM_PROMPT = `You are an expert resume writer and ATS optimization specialist with deep knowledge of applicant tracking systems and recruiter preferences.

CORE PRINCIPLES:
1. NEVER generate generic, filler text - Always contextualize based on actual experience
2. ALWAYS quantify achievements with specific numbers, percentages, dollar amounts, or timeframes
3. ALWAYS optimize for ATS keyword matching while maintaining natural language flow
4. ALWAYS provide detailed reasoning for every change made
5. NEVER fabricate experience, achievements, or qualifications
6. ALWAYS use industry-standard terminology matching the job description
7. ALWAYS focus on IMPACT and RESULTS, not just responsibilities or tasks
8. ALWAYS tailor content specifically to the provided job description
9. ALWAYS use action verbs (Led, Increased, Reduced, Built, Optimized, etc.)
10. ALWAYS avoid clichés like "team player", "hardworking", "detail-oriented", "results-driven"`;

/**
 * Experience Section Improvement Prompt
 * 
 * Input: Experience entry + Job description
 * Output: Improved achievements with keywords and reasoning
 */
export function buildExperiencePrompt(
  experience: {
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  },
  jobDescription?: ParsedJobDescription
): string {
  const jobContext = jobDescription
    ? `
JOB DESCRIPTION CONTEXT:
- Target Role: ${jobDescription.title}
- Company: ${jobDescription.company || 'Not specified'}
- Required Skills: ${jobDescription.requiredSkills.join(', ')}
- Preferred Skills: ${jobDescription.preferredSkills.join(', ')}
- Key Keywords: ${jobDescription.keywords.slice(0, 10).join(', ')}
- Experience Level: ${jobDescription.experienceLevel || 'Not specified'}
- Location: ${jobDescription.location || 'Not specified'}

ANALYSIS REQUIRED:
1. Identify which achievements align with job requirements
2. Determine which keywords from job description are missing
3. Find opportunities to quantify existing achievements
4. Match industry terminology from job description`
    : '';

  return `TASK: Transform the following work experience entry into ATS-optimized, impact-focused achievements.

CURRENT EXPERIENCE ENTRY:
Company: ${experience.company}
Position: ${experience.position}
Location: ${experience.location}
Duration: ${experience.startDate} to ${experience.endDate}
Current Achievement Bullets:
${experience.achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}${jobContext}

TRANSFORMATION REQUIREMENTS:
1. CRITICAL: Start every bullet with a strong action verb (Led, Architected, Increased, Reduced, Optimized, Built, Implemented, etc.)
2. CRITICAL: Include quantifiable metrics in every bullet (numbers, percentages, dollar amounts, timeframes, team sizes, user counts, etc.)
3. CRITICAL: Incorporate 2-3 relevant keywords from the job description naturally into each bullet
4. Focus on BUSINESS IMPACT and TECHNICAL ACHIEVEMENTS, not daily tasks
5. Use exact terminology from job description (e.g., if JD says "React.js", use "React.js" not "React")
6. Each bullet should demonstrate a specific accomplishment, not a responsibility
7. Prioritize achievements that match job requirements
8. Keep each bullet concise (1-2 lines maximum)
9. Avoid generic phrases: "responsible for", "worked on", "helped with", "assisted in"
10. Show progression and impact over time

OUTPUT REQUIREMENTS:
- Generate 3-5 improved achievement bullets
- Each bullet must include at least one quantifiable metric
- Each bullet must incorporate relevant keywords naturally
- Provide reasoning explaining how each bullet improves ATS compatibility and demonstrates value`;
}

/**
 * Professional Summary Improvement Prompt
 * 
 * Input: Current summary + Experience highlights + Job description
 * Output: Optimized summary with keywords and reasoning
 */
export function buildSummaryPrompt(
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
): string {
  const jobContext = jobDescription
    ? `
TARGET JOB CONTEXT:
- Role: ${jobDescription.title}
- Required Skills: ${jobDescription.requiredSkills.join(', ')}
- Key Keywords: ${jobDescription.keywords.slice(0, 8).join(', ')}
- Experience Level Expected: ${jobDescription.experienceLevel || 'Not specified'}
- Company Type: ${jobDescription.company || 'Not specified'}

SUMMARY OPTIMIZATION GOALS:
1. Naturally incorporate top 5 keywords from job description
2. Match experience level tone (${jobDescription.experienceLevel || 'mid'}-level)
3. Highlight achievements that align with job requirements
4. Demonstrate value proposition for this specific role`
    : '';

  // Build detailed experience context
  const experienceContext = experienceData && experienceData.length > 0
    ? `
DETAILED EXPERIENCE ENTRIES:
${experienceData.map((exp, idx) => `
${idx + 1}. ${exp.position} at ${exp.company}${exp.location ? ` (${exp.location})` : ''}
   Duration: ${exp.startDate} to ${exp.endDate}
   Key Achievements:
${exp.achievements && exp.achievements.length > 0
  ? exp.achievements.map((a: string) => `   - ${a}`).join('\n')
  : '   - No achievements listed'}
`).join('\n')}`
    : '';

  // Build skills context
  const skillsContext = skillsData
    ? `
TECHNICAL SKILLS:
${skillsData.technical && skillsData.technical.length > 0
  ? skillsData.technical.join(', ')
  : 'None listed'}

SOFT SKILLS:
${skillsData.soft && skillsData.soft.length > 0
  ? skillsData.soft.join(', ')
  : 'None listed'}`
    : '';

  return `TASK: Create or optimize a professional summary that is ATS-friendly and compelling to recruiters.

CURRENT SUMMARY (if exists):
${currentSummary || 'None - create new summary'}

EXPERIENCE HIGHLIGHTS:
- Total Years of Experience: ${experienceHighlights.totalYears} years
- Key Roles: ${experienceHighlights.keyRoles.join(', ')}
- Notable Achievements: ${experienceHighlights.keyAchievements.slice(0, 3).join('; ')}
- Industries: ${experienceHighlights.industries.join(', ')}${experienceContext}${skillsContext}${jobContext}

SUMMARY REQUIREMENTS:
1. Length: 2-4 sentences (50-100 words maximum)
2. First sentence: Years of experience + core expertise areas (from technical skills) + key value proposition
3. Middle sentences: Quantifiable achievements from experience entries that match job requirements
4. Final sentence: What you bring to this specific role/company
5. MUST incorporate 3-5 keywords from job description naturally
6. MUST include at least one quantifiable achievement from the experience entries provided
7. MUST mention 2-3 key technical skills from the skills section naturally
8. Match tone to experience level (entry/mid/senior/executive)
9. NO generic phrases: "hardworking", "team player", "detail-oriented", "results-driven", "proven track record"
10. Focus on SPECIFIC value, not generic qualities
11. Use industry-standard terminology from job description
12. Reference specific achievements from the detailed experience entries provided
13. Highlight technical skills that align with the job requirements

OUTPUT REQUIREMENTS:
- Professional summary (2-4 sentences)
- List of keywords incorporated
- Detailed reasoning explaining keyword placement and value proposition`;
}

/**
 * Skills Section Optimization Prompt
 * 
 * Input: Current skills + Job description
 * Output: Optimized skills with missing skills identified
 */
export function buildSkillsPrompt(
  currentSkills: {
    technical: string[];
    soft: string[];
  },
  jobDescription: ParsedJobDescription
): string {
  return `TASK: Optimize the skills section for maximum ATS keyword matching and job alignment.

CURRENT SKILLS:
Technical Skills: ${currentSkills.technical.join(', ') || 'None listed'}
Soft Skills: ${currentSkills.soft.join(', ') || 'None listed'}

TARGET JOB REQUIREMENTS:
- Job Title: ${jobDescription.title}
- Required Skills (MUST-HAVE): ${jobDescription.requiredSkills.join(', ')}
- Preferred Skills (NICE-TO-HAVE): ${jobDescription.preferredSkills.join(', ')}
- Additional Keywords: ${jobDescription.keywords.slice(0, 15).join(', ')}

OPTIMIZATION REQUIREMENTS:
1. CRITICAL: Include ALL required skills from job description (use exact terminology)
2. CRITICAL: Include as many preferred skills as possible
3. Use exact terminology from job description (e.g., "React.js" not "React", "Node.js" not "Node")
4. Add industry-standard variations (e.g., "JavaScript" AND "ES6+", "Python" AND "Python 3.x")
5. Prioritize skills that match job requirements (list them first)
6. Group related skills logically (frameworks together, languages together, tools together)
7. Remove outdated or irrelevant skills that don't match job
8. Add missing critical skills from job description
9. Keep technical and soft skills separate
10. Limit to 15-20 technical skills and 5-8 soft skills for optimal ATS parsing

OUTPUT REQUIREMENTS:
- Optimized technical skills list (prioritized and matched to job)
- Optimized soft skills list (matched to job requirements)
- List of missing critical skills from job description
- Detailed reasoning explaining prioritization and keyword alignment`;
}

/**
 * Projects Section Improvement Prompt
 * 
 * Input: Project details + Job description
 * Output: Improved project description with keywords
 */
export function buildProjectsPrompt(
  project: {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    achievements: string[];
  },
  jobDescription?: ParsedJobDescription
): string {
  const jobContext = jobDescription
    ? `
JOB DESCRIPTION CONTEXT:
- Target Role: ${jobDescription.title}
- Required Technologies: ${jobDescription.requiredSkills.join(', ')}
- Key Keywords: ${jobDescription.keywords.slice(0, 10).join(', ')}`
    : '';

  return `TASK: Enhance the project description to be more impactful and ATS-optimized.

CURRENT PROJECT:
Name: ${project.name}
Description: ${project.description}
Technologies Used: ${project.technologies.join(', ')}
URL: ${project.url || 'Not provided'}
Current Achievements: ${project.achievements.join('; ') || 'None listed'}${jobContext}

ENHANCEMENT REQUIREMENTS:
1. CRITICAL: Quantify project impact (users served, performance improvements, scale, etc.)
2. CRITICAL: Start achievement bullets with action verbs
3. CRITICAL: Incorporate relevant technologies and keywords from job description
4. Highlight technical challenges solved
5. Demonstrate real-world impact and results
6. Match technologies to job requirements
7. Show complexity and scale of project
8. Avoid generic descriptions - be specific about what was built and why it matters
9. Each achievement should demonstrate a specific technical or business outcome
10. Use industry-standard terminology

OUTPUT REQUIREMENTS:
- Enhanced project description (1-2 sentences)
- Improved achievement bullets (3-5 bullets with metrics)
- Updated technologies list (aligned with job description)
- Keywords incorporated
- Detailed reasoning explaining improvements`;
}

/**
 * Job Description Parsing Prompt
 * 
 * Input: Raw job description text
 * Output: Structured parsed data
 */
export function buildJobDescriptionParsePrompt(jobDescription: string): string {
  return `TASK: Extract structured, actionable data from the following job description for resume optimization.

JOB DESCRIPTION:
${jobDescription}

EXTRACTION REQUIREMENTS:
1. Job Title: Extract the exact job title (e.g., "Senior Software Engineer", "Product Manager")
2. Company Name: Extract company name if mentioned
3. Required Skills: Extract ALL must-have skills, technologies, and qualifications (be comprehensive)
4. Preferred Skills: Extract nice-to-have skills and qualifications
5. Keywords: Extract important keywords, phrases, and terminology used throughout the description
6. Experience Level: Determine level (entry/mid/senior/executive) based on requirements
7. Location: Extract location (city, state, remote, hybrid, etc.)
8. Responsibilities: Extract key responsibilities and duties
9. Qualifications: Extract education, certification, and experience requirements
10. Industry Terms: Extract industry-specific terminology and jargon

ANALYSIS GUIDELINES:
- Be thorough - extract ALL relevant skills and keywords
- Distinguish between required (must-have) and preferred (nice-to-have)
- Identify both technical and soft skills
- Note specific technology versions (e.g., "React 18", "Python 3.9")
- Extract methodologies, frameworks, and tools mentioned
- Identify quantifiable requirements (e.g., "5+ years", "team of 10+")
- Note industry-specific terms and acronyms

OUTPUT REQUIREMENTS:
- Structured JSON with all extracted fields
- Comprehensive skill lists (don't miss any)
- All keywords and phrases that could improve ATS matching`;
}

/**
 * ATS Scoring Prompt
 * 
 * Input: Resume data + Job description
 * Output: ATS score breakdown with recommendations
 */
export function buildATSScoringPrompt(
  resumeData: ResumeData,
  jobDescription: ParsedJobDescription
): string {
  // Extract resume text for analysis
  const resumeText = [
    resumeData.personalInfo.summary || '',
    ...resumeData.experience.flatMap(exp => [
      exp.position,
      exp.company,
      ...exp.achievements
    ]),
    ...resumeData.skills.technical,
    ...resumeData.skills.soft,
    ...(resumeData.projects || []).flatMap(proj => [
      proj.projectName,
      proj.description,
      proj.technologiesUsed,
    ])
  ].filter(Boolean).join(' ');

  return `TASK: Analyze resume for ATS compatibility and provide detailed scoring breakdown.

RESUME CONTENT SUMMARY:
- Summary: ${resumeData.personalInfo.summary?.substring(0, 200) || 'None'}
- Experience Entries: ${resumeData.experience.length}
- Technical Skills: ${resumeData.skills.technical.length}
- Projects: ${resumeData.projects?.length || 0}

TARGET JOB DESCRIPTION:
- Title: ${jobDescription.title}
- Required Skills: ${jobDescription.requiredSkills.join(', ')}
- Preferred Skills: ${jobDescription.preferredSkills.join(', ')}
- Keywords: ${jobDescription.keywords.join(', ')}

SCORING CRITERIA (Total: 100 points):

1. KEYWORD MATCHING (40 points):
   - Required skills match: 20 points (score: matched required skills / total required skills * 20)
   - Preferred skills match: 10 points (score: matched preferred skills / total preferred skills * 10)
   - Keyword density: 10 points (score: relevant keywords found / total keywords * 10)
   
2. FORMAT COMPLIANCE (30 points):
   - ATS-friendly formatting: 15 points (no complex tables, standard fonts, proper structure)
   - Section completeness: 10 points (all standard sections present)
   - Readability: 5 points (clear section headers, proper spacing)
   
3. CONTENT QUALITY (30 points):
   - Quantified achievements: 15 points (score: achievements with metrics / total achievements * 15)
   - Action verb usage: 10 points (score: bullets starting with action verbs / total bullets * 10)
   - Generic phrase avoidance: 5 points (penalty for generic phrases)

ANALYSIS REQUIREMENTS:
1. Count exact keyword matches (case-insensitive, but prefer exact terminology)
2. Identify missing critical keywords
3. Count quantified achievements (those with numbers, percentages, metrics)
4. Count action verb usage
5. Check for generic phrases
6. Assess format compliance
7. Provide specific recommendations for improvement

OUTPUT REQUIREMENTS:
- Overall ATS score (0-100)
- Detailed breakdown by category
- Missing keywords list
- Specific recommendations with examples
- Expected score improvement if recommendations are followed`;
}