/**
 * Accessibility Settings Types
 * 
 * Defines types for accessibility preferences that persist per resume.
 */

export type FontSize = 'small' | 'medium' | 'large';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: FontSize;
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'medium',
};
