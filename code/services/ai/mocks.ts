/**
 * Mock AI Responses
 * 
 * Pre-defined mock responses for frontend development and testing.
 * These responses match the structure of actual AI service responses.
 */

import type {
  ParsedJobDescription,
  ATSScoreDetails,
} from '@/types';

/**
 * Mock job description parser response
 */
export const mockParsedJobDescription: ParsedJobDescription = {
  title: 'Senior Full-Stack Software Engineer',
  company: 'Tech Innovations Inc.',
  requiredSkills: [
    'React',
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'AWS',
    'RESTful APIs',
    'Git',
    '5+ years experience',
  ],
  preferredSkills: [
    'Next.js',
    'GraphQL',
    'Docker',
    'Kubernetes',
    'Microservices',
    'CI/CD',
    'Test-driven development',
  ],
  keywords: [
    'full-stack',
    'software engineering',
    'web development',
    'scalable applications',
    'cloud infrastructure',
    'agile methodology',
    'code review',
    'mentoring',
  ],
  experienceLevel: 'senior',
  location: 'San Francisco, CA (Remote)',
};

/**
 * Mock experience improvement response
 */
export const mockExperienceImprovement = {
  improvedAchievements: [
    'Led development of React-based dashboard that increased user engagement by 45% and reduced page load time by 60%',
    'Architected and implemented microservices using Node.js and TypeScript, serving 2M+ API requests daily with 99.9% uptime',
    'Optimized PostgreSQL database queries resulting in 50% reduction in query execution time and $20K monthly infrastructure cost savings',
    'Mentored team of 5 junior developers, improving code quality by 30% through code reviews and pair programming sessions',
    'Implemented CI/CD pipelines using AWS and Docker, reducing deployment time from 4 hours to 15 minutes',
  ],
  keywords: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'microservices', 'CI/CD', 'mentoring'],
  reasoning: 'Transformed generic task descriptions into quantified achievements with specific metrics. Incorporated all required keywords from job description naturally. Each bullet starts with a strong action verb and demonstrates measurable business impact. Added technical depth (microservices, database optimization) and leadership (mentoring) to match senior-level expectations.',
};

/**
 * Mock summary improvement response
 */
export const mockSummaryImprovement = {
  improvedSummary: 'Senior Full-Stack Software Engineer with 7+ years of experience building scalable web applications using React, TypeScript, and Node.js. Led development of microservices architecture serving 2M+ daily requests with 99.9% uptime, resulting in $20K monthly cost savings. Expert in cloud infrastructure (AWS), database optimization (PostgreSQL), and CI/CD pipelines, with proven track record of mentoring teams and delivering high-impact products.',
  keywords: ['Senior Full-Stack', 'React', 'TypeScript', 'Node.js', 'microservices', 'AWS', 'PostgreSQL', 'CI/CD'],
  reasoning: 'Created job-specific summary incorporating exact job title, all required technologies, and quantifiable achievements. Matched senior-level tone and included leadership experience. Keywords naturally integrated throughout, avoiding generic phrases. Summary demonstrates both technical depth and business impact.',
};

/**
 * Mock skills optimization response
 */
export const mockSkillsOptimization = {
  optimizedTechnical: [
    'React',
    'TypeScript',
    'Node.js',
    'Next.js',
    'PostgreSQL',
    'AWS',
    'RESTful APIs',
    'GraphQL',
    'Docker',
    'Kubernetes',
    'Microservices',
    'CI/CD',
    'Git',
    'JavaScript',
    'ES6+',
  ],
  optimizedSoft: [
    'Technical Leadership',
    'Mentoring',
    'Code Review',
    'Agile Methodology',
    'Problem Solving',
    'Cross-functional Collaboration',
  ],
  missingSkills: ['Kubernetes', 'GraphQL'],
  reasoning: 'Prioritized all required skills from job description at the top of the list. Added preferred skills (Next.js, GraphQL, Docker, Kubernetes) that match job requirements. Used exact terminology from job description (e.g., "React" not "ReactJS", "PostgreSQL" not "Postgres"). Added industry-standard variations (JavaScript + ES6+). Removed outdated skills and added missing critical skills. Soft skills aligned with senior-level expectations.',
};

/**
 * Mock project improvement response
 */
export const mockProjectImprovement = {
  improvedDescription: 'E-commerce platform built with React and Node.js, handling 100K+ daily transactions with real-time inventory management and payment processing integration.',
  improvedAchievements: [
    'Architected React-based frontend with TypeScript, reducing bundle size by 40% and improving page load time by 55%',
    'Developed RESTful APIs using Node.js and PostgreSQL, processing 100K+ daily transactions with 99.95% uptime',
    'Implemented real-time inventory management system reducing stock discrepancies by 90%',
    'Integrated Stripe payment processing handling $5M+ in monthly transactions',
    'Optimized database queries reducing API response time from 500ms to 150ms',
  ],
  optimizedTechnologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'RESTful APIs', 'AWS', 'Stripe API'],
  keywords: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'RESTful APIs', 'e-commerce', 'real-time', 'scalable'],
  reasoning: 'Enhanced project description with quantifiable scale metrics (100K+ transactions). Transformed generic achievements into specific technical accomplishments with measurable impact. Incorporated all relevant technologies from job description. Each achievement demonstrates technical depth and business value. Added performance metrics and scale indicators throughout.',
};

/**
 * Mock ATS score response
 */
export const mockATSScore: ATSScoreDetails = {
  overallScore: 78,
  keywordMatch: {
    score: 32,
    matched: [
      'React',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'AWS',
      'RESTful APIs',
      'Git',
      'Microservices',
      'CI/CD',
    ],
    missing: [
      'Next.js',
      'GraphQL',
      'Docker',
      'Kubernetes',
      '5+ years experience',
    ],
    explanation: 'Resume matches 8 out of 8 required skills (100% match). However, missing 3 preferred skills (Next.js, GraphQL, Docker) and some keywords. Strong keyword density in experience section. Recommendation: Add missing preferred skills to skills section and incorporate them into experience bullets.',
  },
  formatCompliance: {
    score: 28,
    issues: [
      'Consider adding more section headers for better ATS parsing',
      'Ensure consistent date formatting throughout',
    ],
    explanation: 'Resume follows ATS-friendly format with standard sections. No complex tables or graphics detected. Proper use of section headers. Minor improvements needed in date formatting consistency.',
  },
  contentQuality: {
    score: 18,
    strengths: [
      'Strong use of action verbs in achievement bullets',
      'Good quantification in experience section',
      'Technical depth demonstrated',
    ],
    weaknesses: [
      'Some achievements lack specific metrics',
      'Could add more industry-specific terminology',
      'Summary could be more job-specific',
    ],
    explanation: 'Resume demonstrates good content quality with quantified achievements and action verbs. 70% of achievement bullets include metrics. Strong technical terminology usage. Areas for improvement: Add more specific metrics to remaining bullets, incorporate more job-specific keywords, enhance summary with job alignment.',
  },
  recommendations: [
    'Add missing preferred skills (Next.js, GraphQL, Docker) to skills section',
    'Incorporate missing keywords into experience achievement bullets naturally',
    'Add specific metrics to 3 achievement bullets that currently lack quantification',
    'Enhance summary to include more job-specific keywords and value proposition',
    'Ensure all dates follow consistent YYYY-MM format',
    'Consider adding a projects section to showcase relevant work',
  ],
};

/**
 * Get mock response by service type
 */
export function getMockResponse(serviceType: string, input?: any): any {
  switch (serviceType) {
    case 'parseJobDescription':
      return mockParsedJobDescription;
    
    case 'improveExperience':
    case 'ImproveExperience':
      return mockExperienceImprovement;
    
    case 'improveSummary':
    case 'ImproveSummary':
      return mockSummaryImprovement;
    
    case 'optimizeSkills':
    case 'ImproveSkills':
      return mockSkillsOptimization;
    
    case 'improveProject':
    case 'ImproveProject':
      return mockProjectImprovement;
    
    case 'calculateATSScore':
      return mockATSScore;
    
    default:
      throw new Error(`Unknown service type: ${serviceType}`);
  }
}

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return true;
}
