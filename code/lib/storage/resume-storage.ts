/**
 * Resume Storage Utilities
 * 
 * Handles localStorage operations for multi-resume management.
 * Stores resumes with metadata (id, name, template, data, lastUpdated).
 */

import type { ResumeData } from '@/types';
import type { TemplateType } from '@/components/resume/templates';
import type { SectionVisibility } from '@/types/section-visibility';
import { defaultSectionVisibility } from '@/types/section-visibility';
import type { SectionKey as SectionOrderKey } from '@/types/section-order';
import { defaultSectionOrder } from '@/types/section-order';
import type { SectionTitles } from '@/types/section-titles';

export interface SavedResume {
  id: string;
  name: string;
  template: TemplateType;
  data: ResumeData;
  sectionVisibility?: SectionVisibility; // Optional for backward compatibility
  sectionOrder?: SectionOrderKey[]; // Optional for backward compatibility
  sectionTitles?: SectionTitles; // Optional for backward compatibility
  lastUpdated: string; // ISO timestamp
}

const STORAGE_KEY = 'resumes';
const LAST_OPENED_KEY = 'lastOpenedResumeId';

/**
 * Get all saved resumes from localStorage
 */
export function getAllResumes(): SavedResume[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const resumes = JSON.parse(stored) as SavedResume[];
    return Array.isArray(resumes) ? resumes : [];
  } catch (error) {
    console.error('Error loading resumes from localStorage:', error);
    return [];
  }
}

/**
 * Save a resume to localStorage
 */
export function saveResume(resume: SavedResume): void {
  if (typeof window === 'undefined') return;
  
  try {
    const resumes = getAllResumes();
    const existingIndex = resumes.findIndex(r => r.id === resume.id);
    
    if (existingIndex >= 0) {
      // Update existing resume
      resumes[existingIndex] = {
        ...resume,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // Add new resume
      resumes.push({
        ...resume,
        lastUpdated: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
  } catch (error) {
    console.error('Error saving resume to localStorage:', error);
    throw new Error('Failed to save resume');
  }
}

/**
 * Get a specific resume by ID
 */
export function getResumeById(id: string): SavedResume | null {
  const resumes = getAllResumes();
  return resumes.find(r => r.id === id) || null;
}

/**
 * Delete a resume by ID
 */
export function deleteResume(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const resumes = getAllResumes();
    const filtered = resumes.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Clear last opened if it was the deleted resume
    const lastOpened = getLastOpenedResumeId();
    if (lastOpened === id) {
      clearLastOpenedResumeId();
    }
  } catch (error) {
    console.error('Error deleting resume from localStorage:', error);
    throw new Error('Failed to delete resume');
  }
}

/**
 * Get the last opened resume ID
 */
export function getLastOpenedResumeId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(LAST_OPENED_KEY);
  } catch (error) {
    console.error('Error getting last opened resume ID:', error);
    return null;
  }
}

/**
 * Set the last opened resume ID
 */
export function setLastOpenedResumeId(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LAST_OPENED_KEY, id);
  } catch (error) {
    console.error('Error setting last opened resume ID:', error);
  }
}

/**
 * Clear the last opened resume ID
 */
export function clearLastOpenedResumeId(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(LAST_OPENED_KEY);
  } catch (error) {
    console.error('Error clearing last opened resume ID:', error);
  }
}

/**
 * Get the last opened resume
 */
export function getLastOpenedResume(): SavedResume | null {
  const lastOpenedId = getLastOpenedResumeId();
  if (!lastOpenedId) return null;
  
  return getResumeById(lastOpenedId);
}

/**
 * Create a new resume with default data
 */
export function createNewResume(name: string = 'Untitled Resume'): SavedResume {
  const defaultResumeData: ResumeData = {
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      portfolio: '',
      summary: '',
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
    },
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
  };

  return {
    id: crypto.randomUUID(),
    name,
    template: 'minimal',
    data: defaultResumeData,
    sectionVisibility: defaultSectionVisibility,
    sectionOrder: defaultSectionOrder,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Duplicate a resume
 */
export function duplicateResume(resume: SavedResume, newName?: string): SavedResume {
  return {
    ...resume,
    id: crypto.randomUUID(),
    name: newName || `${resume.name} (Copy)`,
    lastUpdated: new Date().toISOString(),
  };
}
