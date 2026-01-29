/**
 * Resume Manager Component
 * 
 * Dropdown UI for managing multiple resumes (create, save, load, delete, rename).
 * Displays saved resumes and allows switching between them.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getAllResumes, 
  saveResume, 
  deleteResume, 
  getResumeById,
  duplicateResume,
  type SavedResume 
} from '@/lib/storage/resume-storage';
import type { ResumeData } from '@/types';
import type { TemplateType } from '@/components/resume/templates';
import { getTemplateLabel, useResumeTemplateOptions } from '@/components/resume/templates/template-options';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface ResumeManagerProps {
  currentResumeId: string | null;
  currentResumeName: string;
  currentResumeData: ResumeData;
  currentTemplate: TemplateType;
  onLoadResume: (resume: SavedResume) => void;
  onSaveResume: (resume: SavedResume) => void;
  onNewResume: () => void;
  onAnnounce?: (message: string, priority?: 'polite' | 'assertive') => void;
  onNotify?: (message: string, type?: 'error' | 'success' | 'info') => void;
}

export default function ResumeManager({
  currentResumeId,
  currentResumeName,
  currentResumeData,
  currentTemplate,
  onLoadResume,
  onSaveResume,
  onNewResume,
  onAnnounce,
  onNotify,
}: ResumeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<{ id: string; name: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const templateOptions = useResumeTemplateOptions();

  // Load saved resumes
  useEffect(() => {
    loadResumes();
    
    // Refresh list when storage changes (from other tabs)
    const handleStorageChange = () => {
      loadResumes();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside and handle keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const loadResumes = () => {
    const resumes = getAllResumes();
    // Sort by lastUpdated (newest first)
    resumes.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    setSavedResumes(resumes);
  };

  const handleSave = () => {
    if (!currentResumeId) {
      // Create new resume
      const name = prompt('Enter resume name:', currentResumeName || 'Untitled Resume');
      if (!name) return;
      
      const newResume: SavedResume = {
        id: crypto.randomUUID(),
        name: name.trim() || 'Untitled Resume',
        template: currentTemplate,
        data: currentResumeData,
        lastUpdated: new Date().toISOString(),
      };
      
      saveResume(newResume);
      onSaveResume(newResume);
      loadResumes();
    } else {
      // Update existing resume
      const existingResume = getResumeById(currentResumeId);
      if (!existingResume) return;
      
      const updatedResume: SavedResume = {
        ...existingResume,
        name: currentResumeName,
        template: currentTemplate,
        data: currentResumeData,
        lastUpdated: new Date().toISOString(),
      };
      
      saveResume(updatedResume);
      onSaveResume(updatedResume);
      loadResumes();
    }
  };

  const handleLoad = (resume: SavedResume) => {
    onLoadResume(resume);
    setIsOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setResumeToDelete({ id, name });
    setDeleteDialogOpen(true);
    setIsOpen(false); // Close dropdown when opening dialog
  };

  const handleDeleteConfirm = () => {
    if (!resumeToDelete) return;

    try {
      deleteResume(resumeToDelete.id);
      loadResumes();
      onAnnounce?.(`Resume "${resumeToDelete.name}" deleted`, 'polite');
      onNotify?.(`Resume "${resumeToDelete.name}" deleted`, 'success');
      
      // If deleting current resume, create new one
      if (resumeToDelete.id === currentResumeId) {
        onNewResume();
      }
    } catch (error) {
      onAnnounce?.('Failed to delete resume', 'assertive');
      onNotify?.('Failed to delete resume. Please try again.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setResumeToDelete(null);
  };

  const handleRename = (resume: SavedResume) => {
    setRenamingId(resume.id);
    setRenameValue(resume.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }

    const resume = getResumeById(id);
    if (!resume) return;

    const updatedResume: SavedResume = {
      ...resume,
      name: renameValue.trim(),
      lastUpdated: new Date().toISOString(),
    };

    saveResume(updatedResume);
    loadResumes();
    setRenamingId(null);
    setRenameValue('');

    // If renaming current resume, update it
    if (id === currentResumeId) {
      onSaveResume(updatedResume);
    }
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
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
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium text-gray-700 touch-target min-w-0 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline truncate max-w-[100px] md:max-w-[150px] lg:max-w-none">{currentResumeName || 'Untitled Resume'}</span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-manager-title"
          className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 md:w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[calc(100vh-120px)] overflow-y-auto"
        >
          <div className="p-2 sm:p-3 border-b border-gray-200">
            <h3 id="resume-manager-title" className="sr-only">
              Resume Manager
            </h3>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  onNewResume();
                  setIsOpen(false);
                }}
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                + New Resume
              </button>
              <button
                onClick={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:text-sm max-[480px]:min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Save
              </button>
            </div>
          </div>

          <div className="p-2 sm:p-3">
            {savedResumes.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">
                No saved resumes. Create one to get started.
              </p>
            ) : (
              <div className="space-y-1 sm:space-y-1.5">
                {savedResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="p-2 sm:p-3 rounded-lg border transition-colors bg-gray-50 border-gray-200 hover:bg-gray-100"
                  >
                    {renamingId === resume.id ? (
                      <div className="flex gap-1.5 sm:gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSubmit(resume.id);
                            } else if (e.key === 'Escape') {
                              handleRenameCancel();
                            }
                          }}
                          className="flex-1 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameSubmit(resume.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRenameSubmit(resume.id);
                            }
                          }}
                          className="px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                          aria-label="Confirm rename"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleRenameCancel}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRenameCancel();
                            }
                          }}
                          className="px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                          aria-label="Cancel rename"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleLoad(resume)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleLoad(resume);
                                }
                              }}
                              className="text-xs sm:text-sm font-medium text-gray-900 text-left w-full truncate focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                            >
                              {resume.name}
                            </button>
                            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                              {formatDate(resume.lastUpdated)} • {getTemplateLabel(resume.template, templateOptions)}
                            </p>
                          </div>
                          <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                const duplicated = duplicateResume(resume);
                                saveResume(duplicated);
                                onLoadResume(duplicated);
                                loadResumes();
                                setIsOpen(false);
                                onAnnounce?.(`Resume "${duplicated.name}" duplicated`, 'polite');
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Duplicate"
                              aria-label={`Duplicate resume ${resume.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRename(resume)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleRename(resume);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                              title="Rename"
                              aria-label={`Rename ${resume.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(resume.id, resume.name)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleDeleteClick(resume.id, resume.name);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                              title="Delete"
                              aria-label={`Delete ${resume.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {resume.id === currentResumeId && (
                          <span className="inline-block mt-2 text-xs text-gray-600 font-medium">
                            Current
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        resumeName={resumeToDelete?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
