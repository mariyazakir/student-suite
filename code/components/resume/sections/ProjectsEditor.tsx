/**
 * Projects Editor Component
 * 
 * Manages list of project entries.
 * Allows adding, editing, and removing project items.
 */

'use client';

import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types';
import { getMissingKeywordsForText } from '@/lib/ats/ats-utils';
import KeywordHighlight from '@/components/resume/KeywordHighlight';
import {
  handleBulletKeyDown,
  insertBulletAtCursor,
  normalizeBulletText,
} from '@/components/resume/bullet-utils';
import { capitalizeLineStarts } from '@/components/resume/text-utils';

interface ProjectsEditorProps {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
  jobKeywords?: string[];
  jobPhrases?: string[];
}

export default function ProjectsEditor({
  projects,
  onUpdate,
  jobKeywords = [],
  jobPhrases = [],
}: ProjectsEditorProps) {
  const addProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      projectName: '',
      description: '',
      technologiesUsed: '',
      projectLink: '',
    };
    onUpdate([...projects, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    onUpdate(
      projects.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj))
    );
  };

  const removeProject = (id: string) => {
    onUpdate(projects.filter((proj) => proj.id !== id));
  };

  const sectionText = projects
    .flatMap((proj) => [
      proj.projectName,
      proj.description,
      proj.technologiesUsed,
      proj.projectLink,
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
        <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
        <button onClick={addProject} className="btn-secondary text-sm" aria-label="Add new project entry">
          + Add Project
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

      {projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
          No project entries yet. Click “Add Project” to get started.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6" role="list" aria-label="Project entries">
        {projects.map((proj) => (
          <div key={proj.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Project Entry</h3>
              <button
                onClick={() => removeProject(proj.id)}
                className="btn-secondary text-sm"
                aria-label={`Remove project ${proj.projectName || 'entry'}`}
              >
                Remove
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div>
                <label htmlFor={`project-name-${proj.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  id={`project-name-${proj.id}`}
                  type="text"
                  value={proj.projectName}
                  onChange={(e) => updateProject(proj.id, { projectName: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="E-commerce Platform"
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
                    htmlFor={`project-description-${proj.id}`}
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
                      const targetId = `project-description-${proj.id}`;
                      const textarea = document.getElementById(targetId) as HTMLTextAreaElement | null;
                      if (!textarea) return;
                      insertBulletAtCursor(textarea, proj.description, (nextValue, nextCaret) => {
                        const cappedValue = capitalizeLineStarts(proj.description, nextValue);
                        updateProject(proj.id, { description: cappedValue });
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
                  id={`project-description-${proj.id}`}
                  value={proj.description}
                  onChange={(e) =>
                    updateProject(proj.id, {
                      description: capitalizeLineStarts(
                        proj.description,
                        normalizeBulletText(e.target.value),
                      ),
                    })
                  }
                  onKeyDown={(event) => {
                    handleBulletKeyDown(event, proj.description, (nextValue, nextCaret) => {
                      const cappedValue = capitalizeLineStarts(proj.description, nextValue);
                      updateProject(proj.id, { description: cappedValue });
                      requestAnimationFrame(() => {
                        const textarea = document.getElementById(
                          `project-description-${proj.id}`,
                        ) as HTMLTextAreaElement | null;
                        textarea?.setSelectionRange(nextCaret, nextCaret);
                      });
                    });
                  }}
                  className="textarea-field min-h-[100px]"
                  placeholder="Describe the project, its purpose, and key features..."
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
                <label htmlFor={`technologies-${proj.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Technologies Used *
                </label>
                <input
                  id={`technologies-${proj.id}`}
                  type="text"
                  value={proj.technologiesUsed}
                  onChange={(e) => updateProject(proj.id, { technologiesUsed: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="React, Node.js, MongoDB, AWS"
                  spellCheck={true}
                  autoCorrect="on"
                  lang="en-US"
                  autoComplete="off"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor={`project-link-${proj.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Project Link
                </label>
                <input
                  id={`project-link-${proj.id}`}
                  type="url"
                  value={proj.projectLink || ''}
                  onChange={(e) => updateProject(proj.id, { projectLink: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-field"
                  placeholder="https://project-demo.com"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
