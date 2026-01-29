/**
 * Sections Panel Component
 * 
 * Button that opens a dialog/dropdown with drag & drop reordering, visibility toggles, and custom titles.
 * Controls section order, visibility, and custom titles.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { SectionVisibility } from '@/types/section-visibility';
import type { SectionKey as SectionOrderKey } from '@/types/section-order';
import { defaultSectionOrder } from '@/types/section-order';
import type { SectionTitles } from '@/types/section-titles';
import { defaultSectionTitles } from '@/types/section-titles';

interface SectionsPanelProps {
  sectionVisibility: SectionVisibility;
  sectionOrder?: SectionOrderKey[];
  sectionTitles?: SectionTitles;
  onVisibilityChange: (visibility: SectionVisibility) => void;
  onOrderChange: (order: SectionOrderKey[]) => void;
  onTitlesChange: (titles: SectionTitles) => void;
}

const sectionLabels: Record<SectionOrderKey, string> = {
  personalInfo: 'Personal Info',
  summary: 'Professional Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
};

export default function SectionsPanel({
  sectionVisibility,
  sectionOrder = defaultSectionOrder,
  sectionTitles = {},
  onVisibilityChange,
  onOrderChange,
  onTitlesChange,
}: SectionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<SectionOrderKey | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Handle Escape key to close dropdown and restore focus
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    // Focus trap: Tab and Shift+Tab
    const handleTab = (e: KeyboardEvent) => {
      if (!isOpen || !dropdownRef.current) return;

      if (e.key === 'Tab') {
        const focusableElements = dropdownRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    // Handle keyboard navigation within dropdown (Arrow keys)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !dropdownRef.current) return;

      const focusableElements = dropdownRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const currentIndex = Array.from(focusableElements).findIndex(
        (el) => el === document.activeElement
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        focusableElements[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        focusableElements[prevIndex]?.focus();
      }
    };

    if (isOpen) {
      // Store current focus element for restoration
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first focusable element when dropdown opens
      setTimeout(() => {
        const firstElement = dropdownRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstElement?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = (section: keyof SectionVisibility) => {
    // Personal Info is always visible
    if (section === 'personalInfo') return;
    
    const updated = {
      ...sectionVisibility,
      [section]: !sectionVisibility[section],
    };
    onVisibilityChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sectionOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    onOrderChange(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTitleEdit = (section: SectionOrderKey) => {
    const titlesMap = sectionTitles as Record<SectionOrderKey, string | undefined>;
    const currentTitle = titlesMap[section] || defaultSectionTitles[section as keyof typeof defaultSectionTitles] || sectionLabels[section];
    setEditTitleValue(currentTitle);
    setEditingTitle(section);
  };

  const handleTitleSave = (section: SectionOrderKey) => {
    if (editTitleValue.trim()) {
      const newTitles = {
        ...sectionTitles,
        [section]: editTitleValue.trim(),
      };
      onTitlesChange(newTitles);
    }
    setEditingTitle(null);
    setEditTitleValue('');
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setEditTitleValue('');
  };

  const getSectionTitle = (section: SectionOrderKey): string => {
    if (section === 'personalInfo') return sectionLabels[section];
    return sectionTitles[section] || defaultSectionTitles[section as keyof typeof defaultSectionTitles] || sectionLabels[section];
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-between touch-target focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs sm:text-sm font-semibold text-gray-900">Sections</span>
        </div>
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Dialog */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="menu"
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto w-full sm:w-auto"
        >
          <div className="p-2 sm:p-3 md:p-4">
            <h3 id="sections-panel-title" className="sr-only">
              Section Management
            </h3>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Manage Sections</h3>
              <button
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsOpen(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {sectionOrder.map((sectionKey, index) => {
                const isPersonalInfo = sectionKey === 'personalInfo';
                const isDragging = draggedIndex === index;
                const isEditing = editingTitle === sectionKey;
                const sectionTitle = getSectionTitle(sectionKey);

                return (
                  <div
                    key={sectionKey}
                    draggable={!isPersonalInfo}
                    onDragStart={() => !isPersonalInfo && handleDragStart(index)}
                    onDragOver={(e) => !isPersonalInfo && handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1.5 sm:gap-2 group ${
                      isPersonalInfo ? 'opacity-60' : 'cursor-move hover:bg-gray-50'
                    } ${
                      isDragging ? 'opacity-50' : ''
                    } p-1.5 sm:p-2 rounded transition-colors touch-target`}
                  >
                    {/* Drag Handle */}
                    {!isPersonalInfo && (
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    )}

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={sectionVisibility[sectionKey]}
                      onChange={() => handleToggle(sectionKey)}
                      disabled={isPersonalInfo}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 focus:ring-2 flex-shrink-0"
                    />

                    {/* Title */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={() => handleTitleSave(sectionKey)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTitleSave(sectionKey);
                            } else if (e.key === 'Escape') {
                              handleTitleCancel();
                            }
                          }}
                          className="flex-1 text-xs sm:text-sm text-gray-700 px-1.5 sm:px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <span className="text-xs sm:text-sm text-gray-700 flex-1 truncate">{sectionTitle}</span>
                        {!isPersonalInfo && (
                          <button
                            onClick={() => handleTitleEdit(sectionKey)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity flex-shrink-0"
                            title="Edit title"
                            aria-label="Edit section title"
                          >
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {isPersonalInfo && (
                      <span className="text-xs text-gray-400 ml-auto">(Required)</span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
              Drag to reorder • Click ✏️ to rename
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
