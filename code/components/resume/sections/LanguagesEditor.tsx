/**
 * Languages Editor Component
 * 
 * Manages list of language entries.
 * Allows adding, editing, and removing language items.
 */

'use client';

import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Language } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';

interface LanguagesEditorProps {
  languages: Language[];
  onUpdate: (languages: Language[]) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function LanguagesEditor({
  languages,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: LanguagesEditorProps) {
  const addLanguage = () => {
    const newLang: Language = {
      id: uuidv4(),
      language: '',
      proficiency: 'Intermediate',
    };
    onUpdate([...languages, newLang]);
  };

  const updateLanguage = (id: string, updates: Partial<Language>) => {
    onUpdate(
      languages.map((lang) => (lang.id === id ? { ...lang, ...updates } : lang))
    );
  };

  const removeLanguage = (id: string) => {
    onUpdate(languages.filter((lang) => lang.id !== id));
  };

  const proficiencyOptions: Language['proficiency'][] = ['Beginner', 'Intermediate', 'Fluent', 'Native'];

  const sectionText = languages
    .flatMap((lang) => [lang.language, lang.proficiency])
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
        <h2 className="text-xl font-semibold text-gray-900">Languages</h2>
        <button onClick={addLanguage} className="btn-secondary text-sm" aria-label="Add new language entry">
          + Add Language
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

      {languages.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
          No language entries yet. Click “Add Language” to get started.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Language entries">
        {languages.map((lang) => (
          <div key={lang.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-900">Language Entry</h3>
              <button
                onClick={() => removeLanguage(lang.id)}
                className="btn-secondary text-sm"
                aria-label={`Remove language ${lang.language || 'entry'}`}
              >
                Remove
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor={`language-name-${lang.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Language Name *
                </label>
                <input
                  id={`language-name-${lang.id}`}
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateLanguage(lang.id, { language: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="Spanish"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor={`proficiency-${lang.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency *
                </label>
                <select
                  id={`proficiency-${lang.id}`}
                  value={lang.proficiency}
                  onChange={(e) => updateLanguage(lang.id, { proficiency: e.target.value as Language['proficiency'] })}
                  className="input-field"
                  aria-required="true"
                >
                  {proficiencyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
