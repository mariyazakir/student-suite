/**
 * Custom Section Titles Types
 * 
 * Allows users to customize section header titles.
 */

export type SectionKey = 
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages';

/**
 * Default section titles
 */
export const defaultSectionTitles: Record<SectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
};

export interface SectionTitles {
  summary?: string;
  experience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certifications?: string;
  achievements?: string;
  languages?: string;
}
