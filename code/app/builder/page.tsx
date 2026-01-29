/**
 * Resume Builder Page
 * 
 * Main resume builder interface with editor and preview.
 * Split layout: Editor on left, Preview on right.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ResumeEditor from '@/components/resume/ResumeEditor';
import ATSScorePanel from '@/components/resume/ATSScorePanel';
import ResumePreview from '@/components/resume/ResumePreview';
import ChatAssistant from '@/components/resume/ChatAssistant';
import FloatingDownloadButton from '@/components/resume/FloatingExportButtons';
import ExportModal from '@/components/resume/ExportModal';
import ResumeManager from '@/components/resume/ResumeManager';
import ResponsiveLayout from '@/components/resume/ResponsiveLayout';
import { exportToPDF, exportToImage, printResume } from '@/lib/export/resume-export';
import { 
  getAllResumes,
  getLastOpenedResume, 
  createNewResume, 
  saveResume, 
  setLastOpenedResumeId,
  type SavedResume 
} from '@/lib/storage/resume-storage';
import type { ResumeData } from '@/types';
import type { TemplateType } from '@/components/resume/templates';
import { useResumeTemplateOptions, getTemplateLabel } from '@/components/resume/templates/template-options';
import type { SectionVisibility } from '@/types/section-visibility';
import { defaultSectionVisibility } from '@/types/section-visibility';
import type { SectionKey as SectionOrderKey } from '@/types/section-order';
import { defaultSectionOrder } from '@/types/section-order';
import type { SectionTitles } from '@/types/section-titles';
import SectionsPanel from '@/components/resume/SectionsPanel';
import AccessibilityMenu from '@/components/resume/AccessibilityMenu';
import type { AccessibilitySettings } from '@/types/accessibility-settings';

/**
 * Default empty resume data structure
 */
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

export default function BuilderPage() {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('minimal');
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [currentResumeName, setCurrentResumeName] = useState<string>('Untitled Resume');
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(defaultSectionVisibility);
  const [sectionOrder, setSectionOrder] = useState<SectionOrderKey[]>(defaultSectionOrder);
  const [sectionTitles, setSectionTitles] = useState<SectionTitles>({});
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [banner, setBanner] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const templateOptions = useResumeTemplateOptions();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const assertiveLiveRegionRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const templateButtonRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const applyingHistoryRef = useRef(false);
  const templateParamAppliedRef = useRef(false);
  const searchParams = useSearchParams();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Utility function to announce to screen readers
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = priority === 'assertive' ? assertiveLiveRegionRef.current : liveRegionRef.current;
    if (region) {
      // Clear previous message
      region.textContent = '';
      // Use setTimeout to ensure the message is announced
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  };

  // Load last opened resume on mount
  useEffect(() => {
    const lastOpened = getLastOpenedResume();
    if (lastOpened) {
      loadResume(lastOpened);
      return;
    }

    const resumes = getAllResumes();
    if (resumes.length > 0) {
      const sorted = [...resumes].sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      loadResume(sorted[0]);
    }
  }, []);

  useEffect(() => {
    if (templateParamAppliedRef.current) return;
    const templateId = searchParams.get('templateId');
    if (!templateId) return;
    const exists = templateOptions.some((option) => option.id === templateId);
    if (!exists) return;
    setSelectedTemplate(templateId as TemplateType);
    setIsTemplateMenuOpen(false);
    templateParamAppliedRef.current = true;
  }, [searchParams, templateOptions]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!templateMenuRef.current) return;
      if (!templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTemplateMenuOpen) {
        setIsTemplateMenuOpen(false);
        templateButtonRef.current?.focus();
      }
    };

    if (isTemplateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isTemplateMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem('rb-onboarding-dismissed');
    if (!dismissed) {
      setShowOnboarding(true);
    }
  }, []);

  const showBannerMessage = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setBanner({ message, type });
    setTimeout(() => setBanner(null), 4000);
  };

  // Load job description per resume
  useEffect(() => {
    if (!currentResumeId || typeof window === 'undefined') return;
    const stored = localStorage.getItem(`ats-job-description-${currentResumeId}`);
    if (stored !== null) {
      setJobDescription(stored);
    } else {
      setJobDescription('');
    }
  }, [currentResumeId]);

  // Persist job description per resume
  useEffect(() => {
    if (!currentResumeId || typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      localStorage.setItem(`ats-job-description-${currentResumeId}`, jobDescription);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentResumeId, jobDescription]);

  // Autosave every 5-10 seconds (debounced)
  useEffect(() => {
    if (!currentResumeId) return;

    const currentDataString = JSON.stringify({ 
      resumeData, 
      sectionVisibility, 
      sectionOrder, 
      sectionTitles 
    });
    
    // Only autosave if data has changed
    if (currentDataString === lastSavedDataRef.current) return;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer (debounce: wait 7 seconds after last change)
    setAutosaveStatus('saving');
    announceToScreenReader('Saving…', 'polite');
    autosaveTimerRef.current = setTimeout(() => {
      handleAutosave();
    }, 7000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [resumeData, selectedTemplate, currentResumeId, currentResumeName, sectionVisibility, sectionOrder, sectionTitles]);

  useEffect(() => {
    if (applyingHistoryRef.current) return;
    const snapshot = JSON.stringify({
      resumeData,
      selectedTemplate,
      sectionVisibility,
      sectionOrder,
      sectionTitles,
    });
    const history = historyRef.current;
    const lastSnapshot = history[historyIndexRef.current];
    if (snapshot === lastSnapshot) return;

    const nextHistory = history.slice(0, historyIndexRef.current + 1);
    nextHistory.push(snapshot);
    if (nextHistory.length > 50) {
      nextHistory.shift();
    } else {
      historyIndexRef.current += 1;
    }

    historyRef.current = nextHistory;
    if (nextHistory.length === 50) {
      historyIndexRef.current = nextHistory.length - 1;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < nextHistory.length - 1);
  }, [resumeData, selectedTemplate, sectionVisibility, sectionOrder, sectionTitles]);

  const handleAutosave = () => {
    if (!currentResumeId) return;

    try {
      const savedResume: SavedResume = {
        id: currentResumeId,
        name: currentResumeName,
        template: selectedTemplate,
        data: resumeData,
        sectionVisibility,
        sectionOrder,
        sectionTitles,
        lastUpdated: new Date().toISOString(),
      };

      saveResume(savedResume);
      lastSavedDataRef.current = JSON.stringify({ 
        resumeData, 
        sectionVisibility, 
        sectionOrder, 
        sectionTitles 
      });
      setAutosaveStatus('saved');
      announceToScreenReader('Saved', 'polite');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setAutosaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Autosave failed:', error);
      setAutosaveStatus('idle');
      announceToScreenReader('Save failed', 'assertive');
    }
  };

  const handleDataChange = (updatedData: ResumeData) => {
    setResumeData(updatedData);
  };

  const applySnapshot = (snapshot: string) => {
    try {
      const parsed = JSON.parse(snapshot) as {
        resumeData: ResumeData;
        selectedTemplate: TemplateType;
        sectionVisibility: SectionVisibility;
        sectionOrder: SectionOrderKey[];
        sectionTitles: SectionTitles;
      };
      applyingHistoryRef.current = true;
      setResumeData(parsed.resumeData);
      setSelectedTemplate(parsed.selectedTemplate);
      setSectionVisibility(parsed.sectionVisibility);
      setSectionOrder(parsed.sectionOrder);
      setSectionTitles(parsed.sectionTitles);
      setTimeout(() => {
        applyingHistoryRef.current = false;
      }, 0);
    } catch (error) {
      console.error('Failed to apply history snapshot:', error);
    }
  };

  const resetHistory = (snapshot: {
    resumeData: ResumeData;
    selectedTemplate: TemplateType;
    sectionVisibility: SectionVisibility;
    sectionOrder: SectionOrderKey[];
    sectionTitles: SectionTitles;
  }) => {
    const serialized = JSON.stringify(snapshot);
    historyRef.current = [serialized];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    applySnapshot(snapshot);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    applySnapshot(snapshot);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const loadResume = (resume: SavedResume) => {
    setCurrentResumeId(resume.id);
    setCurrentResumeName(resume.name);
    setSelectedTemplate(resume.template);
    setResumeData(resume.data);
    setSectionVisibility(resume.sectionVisibility || defaultSectionVisibility);
    setSectionOrder(resume.sectionOrder || defaultSectionOrder);
    setSectionTitles(resume.sectionTitles || {});
    setLastOpenedResumeId(resume.id);
    lastSavedDataRef.current = JSON.stringify({ 
      resumeData: resume.data, 
      sectionVisibility: resume.sectionVisibility || defaultSectionVisibility,
      sectionOrder: resume.sectionOrder || defaultSectionOrder,
      sectionTitles: resume.sectionTitles || {},
    });
    resetHistory({
      resumeData: resume.data,
      selectedTemplate: resume.template,
      sectionVisibility: resume.sectionVisibility || defaultSectionVisibility,
      sectionOrder: resume.sectionOrder || defaultSectionOrder,
      sectionTitles: resume.sectionTitles || {},
    });
  };

  const handleLoadResume = (resume: SavedResume) => {
    // Check if current resume has unsaved changes
    const currentDataString = JSON.stringify({ resumeData, sectionVisibility });
    if (currentResumeId && currentDataString !== lastSavedDataRef.current) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes. Do you want to switch resumes without saving?'
      );
      if (!confirmSwitch) return;
    }

    loadResume(resume);
  };

  const handleSaveResume = (resume: SavedResume) => {
    setCurrentResumeId(resume.id);
    setCurrentResumeName(resume.name);
    setSectionVisibility(resume.sectionVisibility || defaultSectionVisibility);
    setLastOpenedResumeId(resume.id);
    lastSavedDataRef.current = JSON.stringify({ resumeData: resume.data, sectionVisibility: resume.sectionVisibility || defaultSectionVisibility });
  };

  const handleNewResume = () => {
    // Check if current resume has unsaved changes
    const currentDataString = JSON.stringify({ resumeData, sectionVisibility });
    if (currentResumeId && currentDataString !== lastSavedDataRef.current) {
      const confirmNew = window.confirm(
        'You have unsaved changes. Do you want to create a new resume without saving?'
      );
      if (!confirmNew) return;
    }

    const newResume = createNewResume();
    setCurrentResumeId(newResume.id);
    setCurrentResumeName(newResume.name);
    setSelectedTemplate(newResume.template);
    setResumeData(newResume.data);
    setSectionVisibility(newResume.sectionVisibility || defaultSectionVisibility);
    setSectionOrder(newResume.sectionOrder || defaultSectionOrder);
    setSectionTitles(newResume.sectionTitles || {});
    setLastOpenedResumeId(newResume.id);
    lastSavedDataRef.current = JSON.stringify({ 
      resumeData: newResume.data, 
      sectionVisibility: newResume.sectionVisibility || defaultSectionVisibility,
      sectionOrder: newResume.sectionOrder || defaultSectionOrder,
      sectionTitles: newResume.sectionTitles || {},
    });
    resetHistory({
      resumeData: newResume.data,
      selectedTemplate: newResume.template,
      sectionVisibility: newResume.sectionVisibility || defaultSectionVisibility,
      sectionOrder: newResume.sectionOrder || defaultSectionOrder,
      sectionTitles: newResume.sectionTitles || {},
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    announceToScreenReader('Exporting PDF…', 'polite');
    try {
      await exportToPDF();
      announceToScreenReader('PDF export completed', 'polite');
    } catch (error) {
      console.error('PDF export failed:', error);
      announceToScreenReader('PDF export failed', 'assertive');
      showBannerMessage('Failed to export PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    announceToScreenReader('Exporting image…', 'polite');
    try {
      await exportToImage();
      announceToScreenReader('Image export completed', 'polite');
    } catch (error) {
      console.error('Image export failed:', error);
      announceToScreenReader('Image export failed', 'assertive');
      showBannerMessage('Failed to export image. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    announceToScreenReader('Opening print dialog…', 'polite');
    printResume();
  };

  const handleOpenDownloadModal = () => {
    setIsModalOpen(true);
  };

  const handleResetTemplateStyle = () => {
    setSelectedTemplate('minimal');
    showBannerMessage('Template style reset to Minimal.', 'info');
    announceToScreenReader('Template style reset to Minimal', 'polite');
  };

  const renderTemplateThumbnail = (templateId: TemplateType) => {
    const base = 'h-10 w-14 rounded border border-gray-200 bg-white p-1 flex flex-col gap-1';
    if (templateId === 'modern') {
      return (
        <div className={base}>
          <div className="h-2 rounded bg-primary-600" />
          <div className="h-1 rounded bg-gray-200" />
          <div className="flex-1 rounded bg-primary-50" />
        </div>
      );
    }
    if (templateId === 'compact') {
      return (
        <div className={base}>
          <div className="h-1 rounded bg-gray-700" />
          <div className="h-1 rounded bg-gray-300" />
          <div className="h-1 rounded bg-gray-300" />
          <div className="h-1 rounded bg-gray-300" />
        </div>
      );
    }
    if (templateId === 'professional') {
      return (
        <div className={base}>
          <div className="h-1 rounded bg-gray-800" />
          <div className="h-px bg-gray-300" />
          <div className="h-1 rounded bg-gray-300" />
          <div className="h-1 rounded bg-gray-300" />
        </div>
      );
    }
    if (templateId === 'executive') {
      return (
        <div className={base}>
          <div className="h-1 rounded bg-gray-900" />
          <div className="h-px bg-gray-300" />
          <div className="h-1 rounded bg-gray-400" />
          <div className="h-1 rounded bg-gray-300" />
        </div>
      );
    }
    if (templateId === 'academic') {
      return (
        <div className={base}>
          <div className="h-1 rounded bg-gray-700" />
          <div className="h-px bg-gray-400" />
          <div className="h-1 rounded bg-gray-300" />
          <div className="h-1 rounded bg-gray-300" />
        </div>
      );
    }
    if (templateId === 'classic') {
      return (
        <div className={base}>
          <div className="h-1 rounded bg-gray-700" />
          <div className="h-1 rounded bg-gray-400" />
          <div className="h-1 rounded bg-gray-300" />
          <div className="h-1 rounded bg-gray-300" />
        </div>
      );
    }
    return (
      <div className={base}>
        <div className="h-1 rounded bg-gray-800" />
        <div className="h-1 rounded bg-gray-400" />
        <div className="h-1 rounded bg-gray-300" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 no-print">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Resume Builder</h1>
            {autosaveStatus !== 'idle' && (
              <div className="flex items-center gap-2 text-sm text-gray-600" role="status" aria-live="polite" aria-atomic="true">
                {autosaveStatus === 'saving' && (
                  <>
                    <svg className="animate-spin h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                )}
                {autosaveStatus === 'saved' && (
                  <>
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600">Saved</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Undo last change"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Redo last change"
              >
                Redo
              </button>
            </div>
            <AccessibilityMenu
              resumeId={currentResumeId}
              onSettingsChange={setAccessibilitySettings}
            />
            <ResumeManager
            currentResumeId={currentResumeId}
            currentResumeName={currentResumeName}
            currentResumeData={resumeData}
            currentTemplate={selectedTemplate}
            onLoadResume={handleLoadResume}
            onSaveResume={handleSaveResume}
            onNewResume={handleNewResume}
            onAnnounce={announceToScreenReader}
            onNotify={showBannerMessage}
            />
          </div>
        </div>
      </header>

      {banner && (
        <div className="no-print px-3 sm:px-4 md:px-6 py-2">
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              banner.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : banner.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
            }`}
            role="status"
            aria-live="polite"
          >
            {banner.message}
          </div>
        </div>
      )}

      
      {/* Live regions for screen reader announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveLiveRegionRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      
      <main className="flex-1">
        <ResponsiveLayout
          leftPanel={
            <section aria-label="Resume Editor" className="h-full overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
                {showOnboarding && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-gray-900">Welcome to Resume Builder</span>
                      <button
                        onClick={() => {
                          setShowOnboarding(false);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('rb-onboarding-dismissed', 'true');
                          }
                        }}
                        className="text-xs text-gray-600"
                        aria-label="Dismiss onboarding"
                      >
                        Got it
                      </button>
                    </div>
                    <ul className="space-y-1" role="list" aria-label="Onboarding steps">
                      <li role="listitem">1. Add your details in the editor on the left.</li>
                      <li role="listitem">2. Paste a job description to see the ATS score.</li>
                      <li role="listitem">3. Export as PDF when ready.</li>
                    </ul>
                  </div>
                )}
              <ATSScorePanel
                resumeData={resumeData}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                heatmapEnabled={heatmapEnabled}
                onToggleHeatmap={setHeatmapEnabled}
                onAddSkillKeyword={(keyword) => {
                  setResumeData((prev) => {
                    const trimmed = keyword.trim();
                    if (!trimmed) return prev;
                    if (prev.skills.technical.includes(trimmed)) return prev;
                    return {
                      ...prev,
                      skills: {
                        ...prev.skills,
                        technical: [...prev.skills.technical, trimmed],
                      },
                    };
                  });
                }}
                onAddAllSkillKeywords={(keywords) => {
                  setResumeData((prev) => {
                    const additions = keywords
                      .map((item) => item.trim())
                      .filter((item) => item && !prev.skills.technical.includes(item));
                    if (!additions.length) return prev;
                    return {
                      ...prev,
                      skills: {
                        ...prev.skills,
                        technical: [...prev.skills.technical, ...additions],
                      },
                    };
                  });
                }}
                onExportResume={handleExportPDF}
                onAnnounce={announceToScreenReader}
                onNotify={showBannerMessage}
              />
              <SectionsPanel
                  sectionVisibility={sectionVisibility}
                  sectionOrder={sectionOrder}
                  sectionTitles={sectionTitles}
                  onVisibilityChange={setSectionVisibility}
                  onOrderChange={setSectionOrder}
                  onTitlesChange={setSectionTitles}
                />
                <ResumeEditor
                  data={resumeData}
                  onDataChange={handleDataChange}
                  jobDescription={jobDescription}
                />
              </div>
            </section>
          }
          rightPanel={
            <aside aria-label="Resume Preview" className="h-full flex flex-col relative">
              {/* Template Switcher */}
              <nav aria-label="Template Selection" className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 sm:py-3 sticky top-0 z-10 template-switcher no-print">
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4">
                  <div className="relative" ref={templateMenuRef}>
                    <button
                      ref={templateButtonRef}
                      type="button"
                      onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isTemplateMenuOpen}
                      className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      <span className="text-gray-500">Template:</span>
                      <span className="text-gray-900">{getTemplateLabel(selectedTemplate, templateOptions)}</span>
                      <svg className={`w-4 h-4 transition-transform ${isTemplateMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isTemplateMenuOpen && (
                      <div
                        role="listbox"
                        aria-label="Template options"
                        className="absolute left-0 mt-2 w-[min(320px,80vw)] bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2 space-y-1"
                      >
                        {templateOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            role="option"
                            aria-selected={selectedTemplate === option.id}
                            onClick={() => {
                              setSelectedTemplate(option.id);
                              setIsTemplateMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left text-xs sm:text-sm transition-colors ${
                              selectedTemplate === option.id
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {renderTemplateThumbnail(option.id)}
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="text-xs sm:text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label="Download resume as PDF"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTemplateStyle}
                      className="text-xs sm:text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Reset template style
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Choose a template first—exports match the preview.
                </p>
              </nav>
              
              {/* Preview */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 no-print-preview-wrapper">
                <ResumePreview 
                  data={resumeData} 
                  template={selectedTemplate}
                  sectionVisibility={sectionVisibility}
                  sectionOrder={sectionOrder}
                  sectionTitles={sectionTitles}
                jobDescription={jobDescription}
                heatmapEnabled={heatmapEnabled}
                isExporting={isExporting}
                />
              </div>
              <ChatAssistant resumeData={resumeData} jobDescription={jobDescription} />
            </aside>
          }
          defaultLeftWidth={50}
          minLeftWidth={25}
          maxLeftWidth={70}
          storageKey="resume-builder-split-width"
          onDownloadClick={handleOpenDownloadModal}
        />
      </main>

      {/* Floating Download Button */}
      <FloatingDownloadButton
        onClick={handleOpenModal}
        isExporting={isExporting}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onExportPDF={handleExportPDF}
        onExportImage={handleExportImage}
        onPrint={handlePrint}
        isExporting={isExporting}
      />
    </div>
  );
}
