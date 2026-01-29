/**
 * Resume Preview Component
 * 
 * Real-time preview of the resume as user edits.
 * Displays formatted resume using selected template with A4 page layout.
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ResumeData } from '@/types';
import type { SectionVisibility } from '@/types/section-visibility';
import type { SectionKey as SectionOrderKey } from '@/types/section-order';
import type { SectionTitles } from '@/types/section-titles';
import {
  AcademicTemplate,
  ClassicTemplate,
  CompactTemplate,
  ExecutiveTemplate,
  MinimalTemplate,
  ModernTemplate,
  ProfessionalTemplate,
  type TemplateType,
} from './templates';
import MultiPageResume from './MultiPageResume';
import { extractKeywords, extractPhrases } from '@/lib/ats/ats-utils';

interface ResumePreviewProps {
  data: ResumeData;
  template?: TemplateType;
  sectionVisibility?: SectionVisibility;
  sectionOrder?: SectionOrderKey[];
  sectionTitles?: SectionTitles;
  jobDescription?: string;
  heatmapEnabled?: boolean;
  isExporting?: boolean;
}

export default function ResumePreview({ 
  data, 
  template = 'minimal',
  sectionVisibility,
  sectionOrder,
  sectionTitles,
  jobDescription = '',
  heatmapEnabled = false,
  isExporting = false,
}: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const terms = useMemo(() => {
    if (!jobDescription.trim()) return [];
    const keywords = extractKeywords(jobDescription);
    const phrases = extractPhrases(jobDescription);
    return [...new Set([...phrases, ...keywords])];
  }, [jobDescription]);

  const hasContent = useMemo(() => {
    const hasPersonal =
      !!data.personalInfo.fullName ||
      !!data.personalInfo.email ||
      !!data.personalInfo.phone ||
      !!data.personalInfo.location ||
      !!data.personalInfo.summary;
    const hasSections =
      data.experience.length > 0 ||
      data.education.length > 0 ||
      (data.projects || []).length > 0 ||
      (data.certifications || []).length > 0 ||
      (data.achievements || []).length > 0 ||
      (data.languages || []).length > 0 ||
      data.skills.technical.length + data.skills.soft.length > 0;
    return hasPersonal || hasSections;
  }, [data]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const clearHighlights = () => {
      const marked = container.querySelectorAll<HTMLSpanElement>('.ats-heatmap-mark');
      marked.forEach((node) => {
        const text = document.createTextNode(node.textContent || '');
        node.replaceWith(text);
      });
    };

    const highlight = () => {
      if (!terms.length) return;
      const escaped = terms
        .slice()
        .sort((a, b) => b.length - a.length)
        .map((term) =>
          term
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s+')
        );
      if (!escaped.length) return;
      const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            if ((node.parentElement?.classList.contains('ats-heatmap-mark'))) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const textNodes: Text[] = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
      }

      textNodes.forEach((node) => {
        const text = node.nodeValue || '';
        const matches = [...text.matchAll(regex)];
        if (!matches.length) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        matches.forEach((match) => {
          const index = match.index ?? 0;
          if (index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
          }
          const mark = document.createElement('span');
          mark.className = 'ats-heatmap-mark';
          mark.textContent = match[0];
          fragment.appendChild(mark);
          lastIndex = index + match[0].length;
        });
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        node.replaceWith(fragment);
      });
    };

    clearHighlights();
    if (heatmapEnabled && !isExporting) {
      highlight();
    }

    return () => {
      clearHighlights();
    };
  }, [terms, heatmapEnabled, isExporting]);

  return (
    <div
      id="resume-preview"
      ref={previewRef}
      className="bg-gray-50 min-h-full print-resume-container"
    >
      {!hasContent && (
        <div className="no-print flex items-center justify-center py-2 text-gray-600">
          <div className="rounded-md border border-gray-200 bg-white px-3 py-1 text-[20px]">
            Start filling the editor to see a live preview here.
          </div>
        </div>
      )}
      <MultiPageResume>
        {template === 'minimal' && (
          <MinimalTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
        {template === 'modern' && (
          <ModernTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
        {template === 'classic' && (
          <ClassicTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
        {template === 'compact' && (
          <CompactTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
        {template === 'professional' && (
          <ProfessionalTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
        {template === 'executive' && (
          <ExecutiveTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
        {template === 'academic' && (
          <AcademicTemplate
            data={data}
            sectionVisibility={sectionVisibility}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
          />
        )}
      </MultiPageResume>
    </div>
  );
}
