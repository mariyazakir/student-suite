/**
 * Resizable Split Layout Component
 * 
 * Provides a resizable split layout with draggable divider.
 * Persists width in localStorage.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ResizableSplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number; // Percentage (0-100)
  minLeftWidth?: number; // Percentage
  maxLeftWidth?: number; // Percentage
  storageKey?: string;
}

export default function ResizableSplitLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 25,
  maxLeftWidth = 70,
  storageKey = 'resume-builder-split-width',
}: ResizableSplitLayoutProps) {
  const [leftWidth, setLeftWidth] = useState<number>(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Load persisted width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const width = parseFloat(savedWidth);
        // Validate width is within bounds
        if (width >= minLeftWidth && width <= maxLeftWidth) {
          setLeftWidth(width);
        }
      }
    }
  }, [storageKey, minLeftWidth, maxLeftWidth]);

  // Save width to localStorage
  const saveWidth = useCallback((width: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [storageKey]);

  // Handle mouse down on divider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Calculate new width percentage
      const mouseX = e.clientX - containerRect.left;
      let newWidth = (mouseX / containerWidth) * 100;

      // Clamp to min/max
      newWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));

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
    <>
      {/* Desktop: Resizable Split Layout */}
      <div
        ref={containerRef}
        className="hidden md:flex h-[calc(100vh-73px)] relative"
      >
        {/* Left Panel */}
        <div
          className="overflow-y-auto bg-white transition-all duration-200 border-r border-gray-200"
          style={{ width: `${leftWidth}%` }}
        >
          {leftPanel}
        </div>

        {/* Divider */}
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

        {/* Right Panel */}
        <div
          className="overflow-y-auto bg-gray-50 flex-1"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {rightPanel}
        </div>
      </div>

      {/* Mobile: Stacked Layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-73px)]">
        <div className="overflow-y-auto bg-white border-b border-gray-200">
          {leftPanel}
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {rightPanel}
        </div>
      </div>
    </>
  );
}
