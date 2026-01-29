import type { Template } from './index';

export const assignmentTemplates: Template[] = [
  {
    id: 'assignment-academic',
    name: 'Academic',
    description: 'A4, serif body, generous spacing for readability.',
    appliesTo: ['assignment'],
    rules: {
      layout: {
        pageSize: 'a4',
        marginPreset: 'normal',
        titleAlign: 'center',
        textAlign: 'left',
      },
      fonts: {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: 12,
        headingSizes: { h1: 20, h2: 17, h3: 15 },
        headingWeight: 600,
      },
      spacing: {
        lineSpacing: 1.5,
        paragraphSpacing: 10,
        firstLineIndent: 18,
      },
      colors: {
        text: '#0f172a',
      },
    },
  },
  {
    id: 'assignment-formal',
    name: 'Formal',
    description: 'Letter, double-spaced sans-serif with balanced margins.',
    appliesTo: ['assignment'],
    rules: {
      layout: {
        pageSize: 'letter',
        marginPreset: 'normal',
        titleAlign: 'center',
        textAlign: 'justify',
      },
      fonts: {
        fontFamily: 'Calibri, "Segoe UI", sans-serif',
        fontSize: 12,
        headingSizes: { h1: 22, h2: 18, h3: 15 },
        headingWeight: 600,
      },
      spacing: {
        lineSpacing: 2,
        paragraphSpacing: 10,
        firstLineIndent: 28,
      },
      colors: {
        text: '#0b1224',
      },
    },
  },
  {
    id: 'assignment-project-report',
    name: 'Project Report',
    description: 'A4, wide margins, justified body, serif headings.',
    appliesTo: ['assignment'],
    rules: {
      layout: {
        pageSize: 'a4',
        marginPreset: 'wide',
        titleAlign: 'left',
        textAlign: 'justify',
      },
      fonts: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 12,
        headingSizes: { h1: 22, h2: 18, h3: 14 },
        headingWeight: 600,
      },
      spacing: {
        lineSpacing: 1.5,
        paragraphSpacing: 10,
        firstLineIndent: 24,
      },
      colors: {
        text: '#111827',
      },
    },
  },
  {
    id: 'assignment-research-paper',
    name: 'Research Paper',
    description: 'Letter, single-column, academic spacing and alignment.',
    appliesTo: ['assignment'],
    rules: {
      layout: {
        pageSize: 'letter',
        marginPreset: 'normal',
        titleAlign: 'left',
        textAlign: 'left',
      },
      fonts: {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: 11,
        headingSizes: { h1: 20, h2: 16, h3: 14 },
        headingWeight: 600,
      },
      spacing: {
        lineSpacing: 1.5,
        paragraphSpacing: 8,
        firstLineIndent: 18,
      },
      colors: {
        text: '#0f172a',
      },
    },
  },
];
