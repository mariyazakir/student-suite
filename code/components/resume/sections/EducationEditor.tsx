/**
 * Education Editor Component
 * 
 * Manages list of education entries.
 * Allows adding, editing, and removing education items.
 */

'use client';

import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EducationItem } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';
import {
  handleBulletKeyDown,
  insertBulletAtCursor,
  normalizeBulletText,
} from '@/components/resume/bullet-utils';
import { capitalizeLineStarts } from '@/components/resume/text-utils';

interface EducationEditorProps {
  education: EducationItem[];
  onUpdate: (education: EducationItem[]) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function EducationEditor({
  education,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: EducationEditorProps) {
  const addEducation = () => {
    const newEdu: EducationItem = {
      id: uuidv4(),
      degree: '',
      institution: '',
      startYear: '',
      endYear: '',
      description: '',
    };
    onUpdate([...education, newEdu]);
  };

  const updateEducation = (id: string, updates: Partial<EducationItem>) => {
    onUpdate(
      education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu))
    );
  };

  const removeEducation = (id: string) => {
    onUpdate(education.filter((edu) => edu.id !== id));
  };

  const sectionText = education
    .flatMap((edu) => [edu.degree, edu.institution, edu.startYear, edu.endYear, edu.description])
    .filter(Boolean)
    .join(' ');
  const { missingKeywords, missingPhrases } = useMemo(
    () => getMissingKeywordsForText(sectionText, jobKeywords, jobPhrases),
    [sectionText, jobKeywords, jobPhrases]
  );
  const missingItems = [...missingKeywords, ...missingPhrases].slice(0, 6);
  const highlightTerms = useMemo(
    () => [...jobPhrases, ...jobKeywords],
    [jobPhrases, jobKeywords]
  );

  return (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Education</h2>
        <button onClick={addEducation} className="btn-secondary text-sm" aria-label="Add new education entry">
          + Add Education
        </button>
      </div>

      {missingItems.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Missing keywords: {missingItems.join(', ')}
        </p>
      )}
      {sectionText.trim() && highlightTerms.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Highlight preview: <KeywordHighlight text={sectionText} terms={highlightTerms} />
        </p>
      )}

      {education.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
          No education entries yet. Click “Add Education” to get started.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Education entries">
        {education.map((edu) => (
          <div key={edu.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Education Entry</h3>
              <button
                onClick={() => removeEducation(edu.id)}
                className="btn-secondary text-sm"
                aria-label={`Remove education entry at ${edu.institution || 'this institution'}`}
              >
                Remove
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree *
                </label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="Bachelor of Science"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution *
                </label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                  className="input-field"
                  placeholder="University Name"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`start-year-${edu.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year *
                  </label>
                  <input
                    id={`start-year-${edu.id}`}
                    type="text"
                    value={edu.startYear}
                    onChange={(e) => updateEducation(edu.id, { startYear: e.target.value })}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="input-field"
                    placeholder="2018"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor={`end-year-${edu.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    End Year *
                  </label>
                  <input
                    id={`end-year-${edu.id}`}
                    type="text"
                    value={edu.endYear}
                    onChange={(e) => updateEducation(edu.id, { endYear: e.target.value })}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="input-field"
                    placeholder="2022"
                    aria-required="true"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor={`description-${edu.id}`} className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <button
                    type="button"
                    className="text-xs text-gray-600 hover:text-gray-800"
                    title="Use bullets for clarity (ATS-safe)"
                    aria-label="Insert bullet"
                    onClick={() => {
                      const targetId = `description-${edu.id}`;
                      const textarea = document.getElementById(targetId) as HTMLTextAreaElement | null;
                      if (!textarea) return;
                      insertBulletAtCursor(textarea, edu.description, (nextValue, nextCaret) => {
                        const cappedValue = capitalizeLineStarts(edu.description, nextValue);
                        updateEducation(edu.id, { description: cappedValue });
                        requestAnimationFrame(() => {
                          textarea.focus();
                          textarea.setSelectionRange(nextCaret, nextCaret);
                        });
                      });
                    }}
                  >
                    Bullets
                  </button>
                </div>
                <textarea
                  id={`description-${edu.id}`}
                  value={edu.description}
                  onChange={(e) =>
                    updateEducation(edu.id, {
                      description: capitalizeLineStarts(
                        edu.description,
                        normalizeBulletText(e.target.value),
                      ),
                    })
                  }
                  onKeyDown={(event) => {
                    handleBulletKeyDown(event, edu.description, (nextValue, nextCaret) => {
                      const cappedValue = capitalizeLineStarts(edu.description, nextValue);
                      updateEducation(edu.id, { description: cappedValue });
                      requestAnimationFrame(() => {
                        const textarea = document.getElementById(
                          `description-${edu.id}`,
                        ) as HTMLTextAreaElement | null;
                        textarea?.setSelectionRange(nextCaret, nextCaret);
                      });
                    });
                  }}
                  className="textarea-field min-h-[80px]"
                  placeholder="Relevant coursework, honors, or achievements..."
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
