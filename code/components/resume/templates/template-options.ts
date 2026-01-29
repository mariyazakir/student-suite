import { useEffect, useState } from 'react';
import type { Template } from '@/src/lib/templates';
import { getTemplatesFor } from '@/src/lib/templates';
import type { TemplateType } from './index';

export interface TemplateOption {
  id: TemplateType;
  label: string;
  description: string;
}

export const useResumeTemplateOptions = (): TemplateOption[] => {
  const [options, setOptions] = useState<TemplateOption[]>(() => {
    const templates = getTemplatesFor('resume') as Array<Template & { id: TemplateType }>;
    return templates.map((template) => ({
      id: template.id as TemplateType,
      label: template.name,
      description: template.description,
    }));
  });

  useEffect(() => {
    const handler = () => {
      const templates = getTemplatesFor('resume') as Array<Template & { id: TemplateType }>;
      setOptions(
        templates.map((template) => ({
          id: template.id as TemplateType,
          label: template.name,
          description: template.description,
        })),
      );
    };
    window.addEventListener('storage', handler);
    window.addEventListener('templates-registry-updated', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('templates-registry-updated', handler as EventListener);
    };
  }, []);

  return options;
};

export const getTemplateLabel = (template: TemplateType, options: TemplateOption[]): string => {
  return options.find((option) => option.id === template)?.label ?? 'Template';
};
