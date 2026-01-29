/**
 * Achievements Editor Component
 * 
 * Manages list of achievement entries.
 * Allows adding, editing, and removing achievement items.
 */

'use client';

import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Achievement } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';
import {
  handleBulletKeyDown,
  insertBulletAtCursor,
  normalizeBulletText,
} from '@/components/resume/bullet-utils';
import { capitalizeLineStarts } from '@/components/resume/text-utils';

interface AchievementsEditorProps {
  achievements: Achievement[];
  onUpdate: (achievements: Achievement[]) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function AchievementsEditor({
  achievements,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: AchievementsEditorProps) {
  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: uuidv4(),
      title: '',
      description: '',
      year: '',
    };
    onUpdate([...achievements, newAchievement]);
  };

  const updateAchievement = (id: string, updates: Partial<Achievement>) => {
    onUpdate(
      achievements.map((ach) => (ach.id === id ? { ...ach, ...updates } : ach))
    );
  };

  const removeAchievement = (id: string) => {
    onUpdate(achievements.filter((ach) => ach.id !== id));
  };

  const sectionText = achievements
    .flatMap((ach) => [ach.title, ach.description, ach.year])
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
        <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
        <button onClick={addAchievement} className="btn-secondary text-sm" aria-label="Add new achievement entry">
          + Add Achievement
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

      {achievements.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
          No achievement entries yet. Click “Add Achievement” to get started.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Achievement entries">
        {achievements.map((ach) => (
          <div key={ach.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Achievement Entry</h3>
              <button
                onClick={() => removeAchievement(ach.id)}
                className="btn-secondary text-sm"
                aria-label={`Remove achievement ${ach.title || 'entry'}`}
              >
                Remove
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div>
                <label htmlFor={`achievement-title-${ach.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id={`achievement-title-${ach.id}`}
                  type="text"
                  value={ach.title}
                  onChange={(e) => updateAchievement(ach.id, { title: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="Best Hackathon Project"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                  aria-required="true"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor={`achievement-description-${ach.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <button
                    type="button"
                    className="text-xs text-gray-600 hover:text-gray-800"
                    title="Use bullets for clarity (ATS-safe)"
                    aria-label="Insert bullet"
                    onClick={() => {
                      const targetId = `achievement-description-${ach.id}`;
                      const textarea = document.getElementById(targetId) as HTMLTextAreaElement | null;
                      if (!textarea) return;
                      insertBulletAtCursor(textarea, ach.description, (nextValue, nextCaret) => {
                        const cappedValue = capitalizeLineStarts(ach.description, nextValue);
                        updateAchievement(ach.id, { description: cappedValue });
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
                  id={`achievement-description-${ach.id}`}
                  value={ach.description}
                  onChange={(e) =>
                    updateAchievement(ach.id, {
                      description: capitalizeLineStarts(
                        ach.description,
                        normalizeBulletText(e.target.value),
                      ),
                    })
                  }
                  onKeyDown={(event) => {
                    handleBulletKeyDown(event, ach.description, (nextValue, nextCaret) => {
                      const cappedValue = capitalizeLineStarts(ach.description, nextValue);
                      updateAchievement(ach.id, { description: cappedValue });
                      requestAnimationFrame(() => {
                        const textarea = document.getElementById(
                          `achievement-description-${ach.id}`,
                        ) as HTMLTextAreaElement | null;
                        textarea?.setSelectionRange(nextCaret, nextCaret);
                      });
                    });
                  }}
                  className="textarea-field min-h-[80px]"
                  placeholder="Describe the achievement and its significance..."
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor={`achievement-year-${ach.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  id={`achievement-year-${ach.id}`}
                  type="text"
                  value={ach.year}
                  onChange={(e) => updateAchievement(ach.id, { year: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="2023"
                  aria-required="true"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
