/**
 * Multi-Page Resume Component
 * 
 * Wraps resume content in multiple A4 page containers for screen display.
 * Automatically splits content across pages when it overflows.
 * For print/PDF: CSS page breaks handle multi-page automatically.
 */

'use client';

import React from 'react';

interface MultiPageResumeProps {
  children: React.ReactNode;
}

export default function MultiPageResume({ children }: MultiPageResumeProps) {
  return <div className="resume-flow">{children}</div>;
}
