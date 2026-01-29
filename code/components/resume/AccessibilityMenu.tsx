/**
 * Accessibility Menu Component
 * 
 * Provides accessibility controls: High Contrast Mode and Font Size selector.
 * Fully keyboard accessible and screen-reader friendly.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { AccessibilitySettings, FontSize } from '@/types/accessibility-settings';
import { getAccessibilitySettings, saveAccessibilitySettings } from '@/lib/storage/accessibility-storage';

interface AccessibilityMenuProps {
  resumeId: string | null;
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

export default function AccessibilityMenu({
  resumeId,
  onSettingsChange,
}: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    getAccessibilitySettings(resumeId)
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Load settings when resume changes
  useEffect(() => {
    const loaded = getAccessibilitySettings(resumeId);
    setSettings(loaded);
    applySettings(loaded);
  }, [resumeId]);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High Contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Font Size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${newSettings.fontSize}`);
  };

  // Update settings and persist
  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveAccessibilitySettings(resumeId, newSettings);
    applySettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation, focus trap, and focus management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Close on Escape and restore focus
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
        return;
      }

      // Focus trap: Tab and Shift+Tab
      if (event.key === 'Tab' && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="menuitem"], [role="switch"], [role="radio"], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
        return;
      }

      // Arrow key navigation for menu items
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const items = menuRef.current?.querySelectorAll<HTMLElement>(
          'button, [role="menuitem"], [role="switch"], [role="radio"]'
        );
        if (!items || items.length === 0) return;

        const currentIndex = Array.from(items).findIndex(
          (item) => item === document.activeElement
        );

        let nextIndex: number;
        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }

        items[nextIndex]?.focus();
      }
    };

    if (isOpen) {
      // Store current focus element for restoration
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first focusable element when menu opens
      setTimeout(() => {
        const firstElement = menuRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [role="menuitem"], [role="switch"], [role="radio"], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstElement?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Accessibility options"
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors touch-target"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="hidden sm:inline">Accessibility</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-menu-title"
          className="absolute top-full right-0 mt-2 w-56 sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
            <h3 id="accessibility-menu-title" className="sr-only">
              Accessibility Options
            </h3>
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="high-contrast-toggle"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                High Contrast Mode
              </label>
              <button
                id="high-contrast-toggle"
                role="switch"
                aria-checked={settings.highContrast}
                aria-label={`High contrast mode ${settings.highContrast ? 'on' : 'off'}`}
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateSettings({ highContrast: !settings.highContrast });
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                  settings.highContrast ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size Selector */}
            <div>
              <label
                htmlFor="font-size-select"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
              >
                Font Size
              </label>
              <div
                role="radiogroup"
                aria-label="Font size options"
                className="flex gap-1.5 sm:gap-2"
              >
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    id={size.value === 'medium' ? 'font-size-select' : undefined}
                    role="radio"
                    aria-checked={settings.fontSize === size.value}
                    aria-label={`Font size: ${size.label}`}
                    onClick={() => updateSettings({ fontSize: size.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateSettings({ fontSize: size.value });
                      }
                    }}
                    className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                      settings.fontSize === size.value
                        ? 'bg-gray-600 text-white border-gray-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
