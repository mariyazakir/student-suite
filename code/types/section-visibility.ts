/**
 * Section Visibility Types
 * 
 * Defines which sections are visible in the resume preview and exports.
 */

export interface SectionVisibility {
  personalInfo: boolean;  // Always true (required)
  summary: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
  certifications: boolean;
  achievements: boolean;
  languages: boolean;
}

/**
 * Default visibility state (all sections visible)
 */
export const defaultSectionVisibility: SectionVisibility = {
  personalInfo: true,  // Always visible
  summary: true,
  experience: true,
  education: true,
  skills: true,
  projects: true,
  certifications: true,
  achievements: true,
  languages: true,
};
