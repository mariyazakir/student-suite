/**
 * Floating Download Button Component
 * 
 * Single floating button that opens export modal.
 * Positioned at bottom-right corner, hidden during export/print.
 */

'use client';

interface FloatingDownloadButtonProps {
  onClick: () => void;
  isExporting: boolean;
}

export default function FloatingDownloadButton({
  onClick,
  isExporting,
}: FloatingDownloadButtonProps) {
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      disabled={isExporting}
      className="fixed bottom-20 right-4 z-40 no-print export-buttons bg-gray-600 text-white rounded-full p-4 shadow-xl hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[56px] min-h-[56px] touch-target md:hidden transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      title="Download Resume"
      aria-label="Download Resume"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  );
}
