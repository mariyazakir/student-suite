'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  addCustomTemplate,
  deleteCustomTemplate,
  getAllTemplates,
  updateCustomTemplate,
} from '@/src/lib/templates';
import type { Template, TemplateTarget } from '@/src/lib/templates';

const templateTargets: TemplateTarget[] = ['resume', 'assignment', 'notes'];

const targetLabels: Record<TemplateTarget, string> = {
  resume: 'Resume Builder',
  assignment: 'Assignment Formatter',
  notes: 'Notes → PDF',
};

const targetLinks: Record<TemplateTarget, string> = {
  resume: '/tools/resume-builder',
  assignment: '/tools/assignment-formatter',
  notes: '/tools/notes-to-pdf',
};

const Thumb = ({ template }: { template: Template }) => {
  const accent = template.rules.colors?.accent || template.rules.colors?.primary || '#111827';
  const bg = template.rules.colors?.background || '#ffffff';
  return (
    <div
      className="relative h-16 w-full rounded-lg border border-gray-200 bg-white overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={{ background: bg }} />
      <div className="absolute left-2 top-2 h-2 w-10 rounded-sm" style={{ background: accent }} />
      <div className="absolute left-2 top-5 h-1 w-24 rounded-sm bg-gray-200" />
      <div className="absolute left-2 top-7 h-1 w-20 rounded-sm bg-gray-200" />
      <div className="absolute right-2 top-2 h-10 w-10 rounded-md border border-gray-200" />
    </div>
  );
};

export default function TemplatesPage() {
  const [filter, setFilter] = useState<TemplateTarget | 'all'>('all');
  const [allTemplates, setAllTemplates] = useState<Template[]>(() => getAllTemplates());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'assign' | 'preview'>('upload');
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    size: string;
    fileType: 'pdf' | 'docx' | 'html';
    dataUrl: string;
  } | null>(null);
  const [tool, setTool] = useState<TemplateTarget>('resume');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ariaMessage, setAriaMessage] = useState('');

  const filteredTemplates = useMemo(() => {
    if (filter === 'all') return allTemplates;
    return allTemplates.filter((template) => template.appliesTo.includes(filter));
  }, [filter, allTemplates]);

  useEffect(() => {
    const handler = () => {
      setAllTemplates(getAllTemplates());
    };
    window.addEventListener('storage', handler);
    window.addEventListener('templates-registry-updated', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('templates-registry-updated', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    setPreviewUrl(fileMeta?.dataUrl ?? null);
  }, [fileMeta]);

  return (
    <div className="space-y-6">
      <div className="sr-only" aria-live="polite">
        {ariaMessage}
      </div>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[color:var(--topbar-text)]">Templates</h1>
        <p className="text-sm text-[color:var(--topbar-muted)]">
          Browse reusable layouts shared across Resume Builder, Assignment Formatter, and Notes → PDF.
        </p>
        <div className="flex flex-wrap gap-2 pt-2 items-center">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === 'all'
                ? 'border-primary-500 text-primary-700 bg-primary-50'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={filter === 'all'}
          >
            All
          </button>
          {templateTargets.map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => setFilter(target)}
              className={`rounded-full border px-3 py-1 text-sm ${
                filter === target
                  ? 'border-primary-500 text-primary-700 bg-primary-50'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={filter === target}
            >
              {targetLabels[target]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setStep('upload');
            }}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            title="Add Custom Template"
            aria-label="Add Custom Template"
          >
            +
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <article
            key={template.id}
            className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 shadow-sm transition hover:bg-[color:var(--sidebar-hover-bg)] focus-within:ring-2 focus-within:ring-[color:var(--sidebar-focus)]"
          >
            <Thumb template={template} />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[color:var(--topbar-text)]">
                  {template.name}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--topbar-muted)]">{template.description}</p>
              </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className="rounded-full bg-[color:var(--sidebar-hover-bg)] px-2 py-1 text-xs font-medium text-[color:var(--topbar-text)]">
                      {template.appliesTo.join(', ')}
                    </span>
                    {template.source === 'custom' && (
                      <span className="rounded-full bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700">
                        Custom
                      </span>
                    )}
                  </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {template.appliesTo.map((target) => (
                <Link
                  key={`${template.id}-${target}`}
                  href={`${targetLinks[target]}?templateId=${encodeURIComponent(template.id)}`}
                  className="inline-flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Use in {targetLabels[target]}
                </Link>
              ))}
                  {template.source === 'custom' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const newName = window.prompt('Rename template', template.name)?.trim();
                          if (!newName) return;
                          updateCustomTemplate(template.id, { name: newName });
                          setAllTemplates(getAllTemplates());
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Delete this custom template?')) return;
                          deleteCustomTemplate(template.id);
                          setAllTemplates(getAllTemplates());
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Delete
                      </button>
                    </>
                  )}
            </div>
          </article>
        ))}
      </div>
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Custom Template"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Custom Template</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span className={step === 'upload' ? 'text-primary-600' : ''}>Step 1: Upload</span>
                <span className={step === 'assign' ? 'text-primary-600' : ''}>Step 2: Assign</span>
                <span className={step === 'preview' ? 'text-primary-600' : ''}>Step 3: Preview</span>
              </div>
              {step === 'upload' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-800">
                    Upload template file (.pdf, .docx, .html)
                    <input
                      type="file"
                      accept=".pdf,.docx,.html"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const fileType = file.name.toLowerCase().endsWith('.pdf')
                          ? 'pdf'
                          : file.name.toLowerCase().endsWith('.docx')
                            ? 'docx'
                            : 'html';
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                          setFileMeta({
                            name: file.name,
                            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                            fileType,
                            dataUrl,
                          });
                          setStep('assign');
                          setAriaMessage('File uploaded, proceed to assign.');
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  {fileMeta && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {fileMeta.name} • {fileMeta.size}
                    </div>
                  )}
                </div>
              )}
              {step === 'assign' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-800">
                    Select Tool
                    <select
                      value={tool}
                      onChange={(e) => setTool(e.target.value as any)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="resume">Resume Builder</option>
                      <option value="assignment">Assignment Formatter</option>
                      <option value="notes">Notes → PDF</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-800">
                    Template Name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      placeholder="e.g., My Canva Export"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-800">
                    Description (optional)
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      rows={2}
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('preview')}
                      disabled={!name || !fileMeta}
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Next: Preview
                    </button>
                  </div>
                </div>
              )}
              {step === 'preview' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    {fileMeta?.fileType?.toUpperCase()} preview
                  </div>
                  <div className="h-48 w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    {fileMeta?.fileType === 'html' && previewUrl && (
                      <iframe title="HTML preview" src={previewUrl} className="h-full w-full" />
                    )}
                    {fileMeta?.fileType === 'pdf' && previewUrl && (
                      <embed src={previewUrl} className="h-full w-full" type="application/pdf" />
                    )}
                    {fileMeta?.fileType === 'docx' && (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        DOCX preview not available. Will attach as custom template.
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!fileMeta || !name) return;
                        const id = crypto.randomUUID();
                        const now = new Date().toISOString();
                        const template = {
                          id,
                          name,
                          description,
                          appliesTo: [tool],
                          rules: {},
                          source: 'custom' as const,
                          fileType: fileMeta.fileType,
                          fileUrl: fileMeta.dataUrl,
                          previewUrl: previewUrl || fileMeta.dataUrl,
                          createdAt: now,
                        };
                        addCustomTemplate(template);
                        setIsModalOpen(false);
                        setStep('upload');
                        setFileMeta(null);
                        setName('');
                        setDescription('');
                        setAllTemplates(getAllTemplates());
                        setAriaMessage('Custom template saved and added to the registry.');
                      }}
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      disabled={!name || !fileMeta}
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
