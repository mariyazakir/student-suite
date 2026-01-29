/**
 * Summary Editor Component
 * 
 * Text area for editing professional summary.
 */

'use client';

import { useMemo } from 'react';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';
import { capitalizeLineStarts } from '@/components/resume/text-utils';

interface SummaryEditorProps {
  summary: string;
  onUpdate: (summary: string) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function SummaryEditor({
  summary,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: SummaryEditorProps) {
  const { missingKeywords, missingPhrases } = useMemo(
    () => getMissingKeywordsForText(summary || '', jobKeywords, jobPhrases),
    [summary, jobKeywords, jobPhrases]
  );
  const missingItems = [...missingKeywords, ...missingPhrases].slice(0, 6);
  const highlightTerms = useMemo(
    () => [...jobPhrases, ...jobKeywords],
    [jobPhrases, jobKeywords]
  );


  return (
    <div className="section-card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Summary</h2>

      {missingItems.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Missing keywords: {missingItems.join(', ')}
        </p>
      )}
      {summary.trim() && highlightTerms.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Highlight preview: <KeywordHighlight text={summary} terms={highlightTerms} />
        </p>
      )}
      
      <label htmlFor="summary-textarea" className="sr-only">
        Professional Summary
      </label>
      <textarea
        id="summary-textarea"
        value={summary}
        onChange={(e) => {
          const nextValue = capitalizeLineStarts(summary || '', e.target.value);
          onUpdate(nextValue);
        }}
        className="textarea-field min-h-[120px]"
        placeholder="Write a brief professional summary highlighting your experience, skills, and value proposition..."
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
        lang="en-US"
        autoComplete="off"
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
        aria-label="Professional Summary"
      />
    </div>
  );
}
