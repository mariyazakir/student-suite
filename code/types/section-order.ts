/**
 * Section Order Types
 * 
 * Defines the order of sections in the resume.
 */

export type SectionKey = 
  | 'personalInfo'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages';

/**
 * Default section order
 */
export const defaultSectionOrder: SectionKey[] = [
  'personalInfo',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'languages',
];
