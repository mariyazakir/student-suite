/**
 * Export Modal Component
 * 
 * Modal dialog for export options (PDF, Image).
 * Accessible, keyboard navigable, and mobile-friendly.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: () => void;
  onExportImage: () => void;
  onPrint?: () => void;
  isExporting: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExportPDF,
  onExportImage,
  onPrint,
  isExporting,
}: ExportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Store previous focus element for restoration
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle ESC key and focus trap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        // Restore focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    };

    // Focus trap: Keep focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (!isOpen || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
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

    if (isOpen) {
      // Store current focus element for restoration
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);
      
      // Focus first button when modal opens (desktop only)
      if (!isMobile) {
        setTimeout(() => {
          firstButtonRef.current?.focus();
        }, 100);
      }
      // Only prevent body scroll on desktop
      if (!isMobile) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      if (!isMobile) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onClose, isMobile]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle swipe down on mobile
  const handleTouchStart = useRef<{ y: number; time: number } | null>(null);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !handleTouchStart.current) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - handleTouchStart.current.y;
    // If swiping down significantly, close modal
    if (deltaY > 50) {
      onClose();
      handleTouchStart.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 no-print export-buttons ${
        isMobile
          ? 'flex items-end bg-black bg-opacity-40'
          : 'flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white shadow-xl w-full max-w-md ${
          isMobile
            ? 'rounded-t-2xl p-6 pb-8 transform transition-transform duration-300 ease-out animate-slide-up max-h-[80vh] overflow-y-auto safe-area-inset-bottom'
            : 'rounded-lg p-6 transform transition-all duration-200 scale-100'
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          handleTouchStart.current = {
            y: e.touches[0].clientY,
            time: Date.now(),
          };
        }}
        onTouchMove={handleTouchMove}
      >
        {/* Mobile: Swipe indicator */}
        {isMobile && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 id="export-modal-title" className="text-xl font-semibold text-gray-900">
            Export Resume
          </h2>
          <button
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
              }
            }}
            className="text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-target focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`space-y-3 ${isMobile ? 'space-y-4' : ''}`}>
          <button
            ref={firstButtonRef}
            onClick={() => {
              onExportPDF();
              onClose();
            }}
            disabled={isExporting}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 touch-target max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:text-sm max-[480px]:min-h-[44px] ${
              isMobile ? 'min-h-[48px]' : ''
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>{isExporting ? 'Exporting...' : 'Download as PDF'}</span>
          </button>

          <button
            onClick={() => {
              onExportImage();
              onClose();
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isExporting) {
                e.preventDefault();
                onExportImage();
                onClose();
              }
            }}
            disabled={isExporting}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 touch-target max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:text-sm max-[480px]:min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
              isMobile ? 'min-h-[48px]' : ''
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{isExporting ? 'Exporting...' : 'Download as Image (PNG/JPEG)'}</span>
          </button>

          {onPrint && (
            <button
              onClick={() => {
                onPrint();
                onClose();
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isExporting) {
                  e.preventDefault();
                  onPrint();
                  onClose();
                }
              }}
              disabled={isExporting}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 touch-target focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                isMobile ? 'min-h-[48px]' : ''
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Resume</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
