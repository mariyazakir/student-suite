/**
 * Skills Editor Component
 * 
 * Manages technical and soft skills.
 * Allows adding/removing skills with comma-separated input.
 */

'use client';

import { useMemo, useState } from 'react';
import type { Skills } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';

interface SkillsEditorProps {
  skills: Skills;
  onUpdate: (skills: Skills) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function SkillsEditor({
  skills,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: SkillsEditorProps) {
  const [technicalInput, setTechnicalInput] = useState('');
  const [softInput, setSoftInput] = useState('');

  const addTechnicalSkill = () => {
    if (technicalInput.trim()) {
      const newSkills = technicalInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && !skills.technical.includes(s));
      onUpdate({
        ...skills,
        technical: [...skills.technical, ...newSkills],
      });
      setTechnicalInput('');
    }
  };

  const removeTechnicalSkill = (skill: string) => {
    onUpdate({
      ...skills,
      technical: skills.technical.filter((s) => s !== skill),
    });
  };

  const addSoftSkill = () => {
    if (softInput.trim()) {
      const newSkills = softInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && !skills.soft.includes(s));
      onUpdate({
        ...skills,
        soft: [...skills.soft, ...newSkills],
      });
      setSoftInput('');
    }
  };

  const removeSoftSkill = (skill: string) => {
    onUpdate({
      ...skills,
      soft: skills.soft.filter((s) => s !== skill),
    });
  };


  const skillsText = [...skills.technical, ...skills.soft].join(' ');
  const { missingKeywords, missingPhrases } = useMemo(
    () => getMissingKeywordsForText(skillsText, jobKeywords, jobPhrases),
    [skillsText, jobKeywords, jobPhrases]
  );
  const missingItems = [...missingKeywords, ...missingPhrases].slice(0, 6);
  const highlightTerms = useMemo(
    () => [...jobPhrases, ...jobKeywords],
    [jobPhrases, jobKeywords]
  );

  return (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
      </div>

      {missingItems.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Missing keywords: {missingItems.join(', ')}
        </p>
      )}
      {skills.technical.length + skills.soft.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600 mb-3">
          No skills added yet. Use the inputs below to add skills.
        </div>
      )}
      {skillsText.trim() && highlightTerms.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">
          Highlight preview: <KeywordHighlight text={skillsText} terms={highlightTerms} />
        </p>
      )}

      <div className="space-y-6">
        {/* Technical Skills */}
        <div>
          <label htmlFor="technical-skills-input" className="block text-sm font-medium text-gray-700 mb-2">
            Technical Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              id="technical-skills-input"
              type="text"
              value={technicalInput}
              onChange={(e) => setTechnicalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTechnicalSkill();
                }
              }}
              className="input-field flex-1"
              placeholder="React, TypeScript, Node.js (comma-separated)"
              spellCheck={true}
              autoCorrect="on"
              lang="en-US"
              autoComplete="off"
              aria-describedby="technical-skills-help"
            />
            <button 
              onClick={addTechnicalSkill} 
              className="btn-secondary"
              aria-label="Add technical skills"
            >
              Add
            </button>
          </div>
          <p id="technical-skills-help" className="sr-only">
            Enter skills separated by commas. Press Enter to add.
          </p>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Technical skills list">
            {skills.technical.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                role="listitem"
              >
                {skill}
                <button
                  onClick={() => removeTechnicalSkill(skill)}
                  className="text-primary-600 hover:text-primary-800"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div>
          <label htmlFor="soft-skills-input" className="block text-sm font-medium text-gray-700 mb-2">
            Soft Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              id="soft-skills-input"
              type="text"
              value={softInput}
              onChange={(e) => setSoftInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSoftSkill();
                }
              }}
              className="input-field flex-1"
              placeholder="Leadership, Communication (comma-separated)"
              spellCheck={true}
              autoCorrect="on"
              lang="en-US"
              autoComplete="off"
              aria-describedby="soft-skills-help"
            />
            <button 
              onClick={addSoftSkill} 
              className="btn-secondary"
              aria-label="Add soft skills"
            >
              Add
            </button>
          </div>
          <p id="soft-skills-help" className="sr-only">
            Enter skills separated by commas. Press Enter to add.
          </p>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Soft skills list">
            {skills.soft.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                role="listitem"
              >
                {skill}
                <button
                  onClick={() => removeSoftSkill(skill)}
                  className="text-gray-600 hover:text-gray-800"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
