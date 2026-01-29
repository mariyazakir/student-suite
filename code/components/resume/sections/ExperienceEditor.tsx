/**
 * Experience Editor Component
 * 
 * Manages list of experience entries.
 * Allows adding, editing, and removing experience items.
 */

'use client';

import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ExperienceItem } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';

interface ExperienceEditorProps {
  experience: ExperienceItem[];
  onUpdate: (experience: ExperienceItem[]) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function ExperienceEditor({
  experience,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: ExperienceEditorProps) {

  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: uuidv4(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: 'Present',
      achievements: [''],
    };
    onUpdate([...experience, newExp]);
  };

  const updateExperience = (id: string, updates: Partial<ExperienceItem>) => {
    onUpdate(
      experience.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const removeExperience = (id: string) => {
    onUpdate(experience.filter((exp) => exp.id !== id));
  };

  const addAchievement = (expId: string) => {
    const exp = experience.find((e) => e.id === expId);
    if (exp) {
      updateExperience(expId, {
        achievements: [...exp.achievements, ''],
      });
    }
  };

  const updateAchievement = (expId: string, index: number, value: string) => {
    const exp = experience.find((e) => e.id === expId);
    if (exp) {
      const newAchievements = [...exp.achievements];
      newAchievements[index] = value;
      updateExperience(expId, { achievements: newAchievements });
    }
  };

  const removeAchievement = (expId: string, index: number) => {
    const exp = experience.find((e) => e.id === expId);
    if (exp) {
      const newAchievements = exp.achievements.filter((_, i) => i !== index);
      updateExperience(expId, { achievements: newAchievements });
    }
  };


  const sectionText = experience
    .flatMap((exp) => [
      exp.company,
      exp.position,
      exp.location,
      exp.startDate,
      exp.endDate,
      ...exp.achievements,
    ])
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
        <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
        <button onClick={addExperience} className="btn-secondary text-sm" aria-label="Add new experience entry">
          + Add Experience
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

      {experience.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
          No experience entries yet. Click “Add Experience” to get started.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Experience entries">
        {experience.map((exp) => (
          <div key={exp.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Experience Entry</h3>
              <button
                onClick={() => removeExperience(exp.id)}
                className="btn-secondary text-sm"
                aria-label={`Remove experience entry at ${exp.company || 'this company'}`}
              >
                Remove
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="Software Engineer"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="Tech Corp"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`start-date-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date (YYYY-MM) *
                  </label>
                  <input
                    id={`start-date-${exp.id}`}
                    type="text"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="input-field"
                    placeholder="2020-01"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor={`end-date-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    id={`end-date-${exp.id}`}
                    type="text"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="input-field"
                    placeholder="Present or YYYY-MM"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`location-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  id={`location-${exp.id}`}
                  type="text"
                  value={exp.location}
                  onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="San Francisco, CA"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor={`achievements-${exp.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Achievements *
                </label>
                <div className="space-y-2" role="list" aria-label="Achievements list">
                  {exp.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex gap-2" role="listitem">
                      <input
                        id={`achievement-${exp.id}-${idx}`}
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(exp.id, idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            // If current achievement has content, add new one
                            if (achievement.trim()) {
                              addAchievement(exp.id);
                              // Focus the new input after a brief delay
                              setTimeout(() => {
                                const nextInput = document.getElementById(`achievement-${exp.id}-${exp.achievements.length}`);
                                nextInput?.focus();
                              }, 50);
                            }
                          }
                        }}
                        className="input-field flex-1"
                        placeholder="Led team of 5 developers..."
                        spellCheck={true}
                        autoCorrect="on"
                        lang="en-US"
                        autoComplete="off"
                        aria-label={`Achievement ${idx + 1}`}
                      />
                      {exp.achievements.length > 1 && (
                        <button
                          onClick={() => removeAchievement(exp.id, idx)}
                          className="text-red-600 hover:text-red-700 px-2"
                          aria-label={`Remove achievement ${idx + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addAchievement(exp.id)}
                    className="text-sm text-gray-600 hover:text-gray-700"
                    aria-label="Add new achievement"
                  >
                    + Add Achievement
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
