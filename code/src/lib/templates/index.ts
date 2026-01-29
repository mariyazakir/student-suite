import { assignmentTemplates } from './assignment';
import { noteTemplates } from './notes';
import { resumeTemplates } from './resume';

export type TemplateTarget = 'resume' | 'assignment' | 'notes';

export interface TemplateRules {
  layout?: Record<string, unknown>;
  fonts?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  sectionOrder?: string[];
  visibility?: Record<string, boolean>;
  colors?: Record<string, string>;
  extras?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  appliesTo: TemplateTarget[];
  previewImage?: string;
  rules: TemplateRules;
  source?: 'built-in' | 'custom';
  fileType?: 'pdf' | 'docx' | 'html';
  fileUrl?: string;
  previewUrl?: string;
  createdAt?: string;
}

const BUILT_INS: Template[] = [...resumeTemplates, ...assignmentTemplates, ...noteTemplates];
const STORAGE_KEY = 'custom-templates-v1';

const loadCustomTemplates = (): Template[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Template[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistCustomTemplates = (templates: Template[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent('templates-registry-updated'));
};

export const addCustomTemplate = (template: Template) => {
  const customs = loadCustomTemplates();
  const next = [{ ...template, source: 'custom' as const }, ...customs];
  persistCustomTemplates(next);
};

export const updateCustomTemplate = (id: string, data: Partial<Template>) => {
  const customs = loadCustomTemplates().map((tpl) => (tpl.id === id ? { ...tpl, ...data } : tpl));
  persistCustomTemplates(customs);
};

export const deleteCustomTemplate = (id: string) => {
  const customs = loadCustomTemplates().filter((tpl) => tpl.id !== id);
  persistCustomTemplates(customs);
};

const withCustoms = (): Template[] => [...BUILT_INS, ...loadCustomTemplates()];

export const getAllTemplates = (): Template[] => withCustoms();

export const getTemplatesFor = (target: TemplateTarget): Template[] =>
  withCustoms().filter((template) => template.appliesTo.includes(target));

export { assignmentTemplates, noteTemplates, resumeTemplates, loadCustomTemplates, persistCustomTemplates };
