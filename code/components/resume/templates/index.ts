/**
 * Template Exports
 */
import type { resumeTemplates } from '@/src/lib/templates/resume';

export { default as MinimalTemplate } from './MinimalTemplate';
export { default as ModernTemplate } from './ModernTemplate';
export { default as ClassicTemplate } from './ClassicTemplate';
export { default as CompactTemplate } from './CompactTemplate';
export { default as ProfessionalTemplate } from './ProfessionalTemplate';
export { default as ExecutiveTemplate } from './ExecutiveTemplate';
export { default as AcademicTemplate } from './AcademicTemplate';

export type TemplateType = (typeof resumeTemplates)[number]['id'];
