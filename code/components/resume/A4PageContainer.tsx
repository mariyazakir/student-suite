/**
 * A4 Page Container Component
 * 
 * Represents a single A4-sized page (210mm × 297mm).
 * Used for multi-page resume layout with proper page breaking.
 */

'use client';

import React from 'react';

interface A4PageContainerProps {
  children: React.ReactNode;
  isFirstPage?: boolean;
  totalPages?: number;
  pageNumber?: number;
}

export default function A4PageContainer({
  children,
  isFirstPage = false,
  totalPages = 1,
  pageNumber = 1,
}: A4PageContainerProps) {
  return (
    <div className={`a4-page ${isFirstPage ? 'first-page' : ''}`} data-total-pages={totalPages} data-page-number={pageNumber}>
      <div className="a4-page-content">
        {children}
      </div>
    </div>
  );
}
