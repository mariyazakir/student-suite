/**
 * Accessibility Settings Storage
 * 
 * Manages persistence of accessibility preferences per resume.
 */

import type { AccessibilitySettings } from '@/types/accessibility-settings';
import { defaultAccessibilitySettings } from '@/types/accessibility-settings';

const STORAGE_KEY_PREFIX = 'resume-accessibility-';

/**
 * Get accessibility settings for a resume
 */
export function getAccessibilitySettings(resumeId: string | null): AccessibilitySettings {
  if (typeof window === 'undefined' || !resumeId) {
    return defaultAccessibilitySettings;
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${resumeId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        highContrast: parsed.highContrast ?? defaultAccessibilitySettings.highContrast,
        fontSize: parsed.fontSize ?? defaultAccessibilitySettings.fontSize,
      };
    }
  } catch (error) {
    console.error('Error loading accessibility settings:', error);
  }

  return defaultAccessibilitySettings;
}

/**
 * Save accessibility settings for a resume
 */
export function saveAccessibilitySettings(
  resumeId: string | null,
  settings: AccessibilitySettings
): void {
  if (typeof window === 'undefined' || !resumeId) {
    return;
  }

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${resumeId}`, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving accessibility settings:', error);
  }
}

/**
 * Clear accessibility settings for a resume (cleanup)
 */
export function clearAccessibilitySettings(resumeId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${resumeId}`);
  } catch (error) {
    console.error('Error clearing accessibility settings:', error);
  }
}
