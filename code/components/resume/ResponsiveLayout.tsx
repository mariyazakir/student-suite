/**
 * Responsive Layout Component
 * 
 * Handles three responsive breakpoints:
 * - Desktop (≥768px): Split view with resizable panels (side-by-side)
 * - Mobile (<768px): Tab-based system with bottom navigation
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ResponsiveLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  storageKey?: string;
  onDownloadClick?: () => void;
}

type LayoutMode = 'desktop' | 'tablet' | 'mobile';
type MobileTab = 'editor' | 'preview';

export default function ResponsiveLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 25,
  maxLeftWidth = 70,
  storageKey = 'resume-builder-split-width',
  onDownloadClick,
}: ResponsiveLayoutProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('desktop');
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  // Detect layout mode based on window size (responsive for all devices)
  useEffect(() => {
    const updateLayoutMode = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setLayoutMode('desktop');
      } else if (width >= 640) {
        setLayoutMode('tablet');
      } else {
        setLayoutMode('mobile');
      }
    };

    // Initial check
    updateLayoutMode();

    // Listen for resize events
    window.addEventListener('resize', updateLayoutMode);
    
    // Use matchMedia for more accurate breakpoint detection
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const tabletQuery = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');
    const mobileQuery = window.matchMedia('(max-width: 639px)');

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      if (e.matches) setLayoutMode('desktop');
    };
    const handleTabletChange = (e: MediaQueryListEvent) => {
      if (e.matches) setLayoutMode('tablet');
    };
    const handleMobileChange = (e: MediaQueryListEvent) => {
      if (e.matches) setLayoutMode('mobile');
    };

    desktopQuery.addEventListener('change', handleDesktopChange);
    tabletQuery.addEventListener('change', handleTabletChange);
    mobileQuery.addEventListener('change', handleMobileChange);

    return () => {
      window.removeEventListener('resize', updateLayoutMode);
      desktopQuery.removeEventListener('change', handleDesktopChange);
      tabletQuery.removeEventListener('change', handleTabletChange);
      mobileQuery.removeEventListener('change', handleMobileChange);
    };
  }, []);

  // Desktop (≥1024px): Split view with resizable panels (side-by-side)
  if (layoutMode === 'desktop') {
    return (
      <DesktopSplitLayout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        defaultLeftWidth={defaultLeftWidth}
        minLeftWidth={minLeftWidth}
        maxLeftWidth={maxLeftWidth}
        storageKey={storageKey}
      />
    );
  }

  // Tablet (640px-1023px): Stacked layout (editor on top, preview below)
  if (layoutMode === 'tablet') {
    return (
      <TabletStackedLayout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      />
    );
  }

  // Mobile (<640px): Tab-based system with bottom navigation
  return (
    <MobileTabLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      activeTab={mobileTab}
      onTabChange={setMobileTab}
      onDownloadClick={onDownloadClick}
    />
  );
}

/**
 * Tablet Stacked Layout (640px-1023px)
 * Editor on top, Preview below (stacked vertically)
 */
function TabletStackedLayout({
  leftPanel,
  rightPanel,
}: Pick<ResponsiveLayoutProps, 'leftPanel' | 'rightPanel'>) {
  return (
    <div className="flex flex-col h-[calc(100vh-73px)] min-h-0 overflow-hidden">
      {/* Editor Panel - Top */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white border-b border-gray-200">
        {leftPanel}
      </div>
      {/* Preview Panel - Bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-gray-50">
        {rightPanel}
      </div>
    </div>
  );
}

/**
 * Desktop Split Layout (≥1024px)
 * Resizable panels with draggable divider
 * Editor on left, Preview on right (side-by-side)
 */
function DesktopSplitLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth,
  minLeftWidth,
  maxLeftWidth,
  storageKey,
}: ResponsiveLayoutProps) {
  const [leftWidth, setLeftWidth] = useState<number>(defaultLeftWidth ?? 360);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Load persisted width
  useEffect(() => {
    if (!storageKey) return;
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const width = parseFloat(savedWidth);
        if (width >= minLeftWidth! && width <= maxLeftWidth!) {
          setLeftWidth(width);
        }
      }
    }
  }, [storageKey, minLeftWidth, maxLeftWidth]);

  // Save width
  const saveWidth = useCallback((width: number) => {
    if (!storageKey) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [storageKey]);

  // Handle drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      let newWidth = (mouseX / containerRect.width) * 100;

      newWidth = Math.max(minLeftWidth!, Math.min(maxLeftWidth!, newWidth));
      setLeftWidth(newWidth);
      saveWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minLeftWidth, maxLeftWidth, saveWidth]);

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-73px)] min-h-0 relative transition-all duration-300 overflow-hidden"
    >
      <div
        className="min-w-0 overflow-y-auto overflow-x-hidden bg-white transition-all duration-200 border-r border-gray-200"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      <div
        ref={dividerRef}
        onMouseDown={handleMouseDown}
        className={`w-1 bg-gray-300 hover:bg-primary-500 cursor-col-resize transition-colors duration-200 flex-shrink-0 relative group ${
          isDragging ? 'bg-primary-600' : ''
        }`}
        style={{ minWidth: '4px' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-12 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div
        className="min-w-0 flex-1 overflow-y-auto overflow-x-auto bg-gray-50"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}


/**
 * Mobile Tab Layout (<768px)
 * Tab-based system with Editor, Preview, and Download tabs
 * Bottom navigation bar for thumb-friendly access
 * Page-turn animation when switching to Preview
 */
function MobileTabLayout({
  leftPanel,
  rightPanel,
  activeTab,
  onTabChange,
  onDownloadClick,
}: Pick<ResponsiveLayoutProps, 'leftPanel' | 'rightPanel' | 'onDownloadClick'> & {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (tab: MobileTab | 'download') => {
    if (tab === 'download' && onDownloadClick) {
      onDownloadClick();
      // Don't change active tab, keep current view
    } else if (tab === 'editor' || tab === 'preview') {
      onTabChange(tab);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-[calc(100vh-65px)] md:h-[calc(100vh-73px)] relative overflow-hidden min-h-0"
      style={{ 
        perspective: '1000px',
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Tab Content with Page Turn Effect */}
      <div className="flex-1 relative min-h-0" style={{ transformStyle: 'preserve-3d' }}>
        {/* Editor Page (Left Page) */}
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            activeTab === 'editor'
              ? 'translate-x-0 z-10'
              : '-translate-x-full z-0'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="bg-white min-h-full h-full overflow-y-auto shadow-lg">
            {leftPanel}
          </div>
        </div>

        {/* Preview Page (Right Page) - Page Turn Effect */}
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            activeTab === 'preview'
              ? 'translate-x-0 z-10'
              : 'translate-x-full z-0'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="bg-gray-50 min-h-full h-full min-w-0 overflow-y-auto overflow-x-auto relative shadow-lg">
            {/* Back Button - Only visible in Preview */}
            {activeTab === 'preview' && (
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                  onClick={() => handleTabClick('editor')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTabClick('editor');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium text-sm touch-target min-h-[44px] px-3 transition-colors bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Back to Editor"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Back to Editor</span>
                </button>
              </div>
            )}
            {rightPanel}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Fixed to bottom, safe area for notched devices */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="flex items-center justify-around min-h-[64px] h-auto py-2 px-2">
          {/* Editor Tab */}
          <button
            onClick={() => handleTabClick('editor')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick('editor');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-h-[64px] px-2 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
              activeTab === 'editor'
                ? 'text-gray-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            aria-label="Editor"
          >
            <svg
              className={`w-6 h-6 mb-1.5 transition-transform duration-200 ${
                activeTab === 'editor' ? 'scale-110' : 'scale-100'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Editor</span>
          </button>

          {/* Preview Tab */}
          <button
            onClick={() => handleTabClick('preview')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick('preview');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-h-[64px] px-2 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
              activeTab === 'preview'
                ? 'text-gray-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            aria-label="Preview"
          >
            <svg
              className={`w-6 h-6 mb-1.5 transition-transform duration-200 ${
                activeTab === 'preview' ? 'scale-110' : 'scale-100'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Preview</span>
          </button>

          {/* Download Tab */}
          <button
            onClick={() => handleTabClick('download')}
            className="flex flex-col items-center justify-center flex-1 min-h-[64px] px-2 py-2 transition-all duration-200 text-gray-600 hover:text-gray-800 active:text-gray-700"
            aria-label="Download"
          >
            <svg
              className="w-6 h-6 mb-1.5 transition-transform duration-200 active:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

