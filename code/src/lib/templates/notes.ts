import type { Template } from './index';

export const noteTemplates: Template[] = [
  {
    id: 'notes-plain',
    name: 'Plain',
    description: 'Unlined white paper with neutral ink.',
    appliesTo: ['notes'],
    rules: {
      layout: { pageType: 'plain' },
      fonts: { body: 'Inter, system-ui, -apple-system, sans-serif', size: 14 },
      spacing: { lineSpacing: 1.5 },
      colors: { background: '#ffffff', text: '#0f172a', mode: 'light' },
    },
  },
  {
    id: 'notes-ruled',
    name: 'Ruled',
    description: 'Light horizontal rules for handwriting.',
    appliesTo: ['notes'],
    rules: {
      layout: { pageType: 'ruled' },
      fonts: { body: 'Inter, system-ui, -apple-system, sans-serif', size: 14 },
      spacing: { lineSpacing: 1.6 },
      colors: { background: '#ffffff', text: '#0f172a', mode: 'light' },
    },
  },
  {
    id: 'notes-grid',
    name: 'Grid',
    description: 'Graph grid for sketches and diagrams.',
    appliesTo: ['notes'],
    rules: {
      layout: { pageType: 'grid' },
      fonts: { body: 'Inter, system-ui, -apple-system, sans-serif', size: 14 },
      spacing: { lineSpacing: 1.5 },
      colors: { background: '#ffffff', text: '#0f172a', mode: 'light' },
    },
  },
  {
    id: 'notes-cornell',
    name: 'Cornell',
    description: 'Guides for cues, notes, and summary.',
    appliesTo: ['notes'],
    rules: {
      layout: { pageType: 'cornell' },
      fonts: { body: 'Inter, system-ui, -apple-system, sans-serif', size: 14 },
      spacing: { lineSpacing: 1.5 },
      colors: { background: '#ffffff', text: '#0f172a', mode: 'light' },
    },
  },
];
