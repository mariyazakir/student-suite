/**
 * Compact Template
 *
 * Space-efficient, ATS-friendly layout with tighter spacing.
 * Designed to fit more content while staying readable.
 */

'use client';

import React from 'react';
import type { ResumeData } from '@/types';
import type { SectionVisibility } from '@/types/section-visibility';
import { defaultSectionVisibility } from '@/types/section-visibility';
import type { SectionKey as SectionOrderKey } from '@/types/section-order';
import { defaultSectionOrder } from '@/types/section-order';
import type { SectionTitles } from '@/types/section-titles';
import { defaultSectionTitles } from '@/types/section-titles';
import BulletText from '@/components/resume/BulletText';

interface CompactTemplateProps {
  data: ResumeData;
  sectionVisibility?: SectionVisibility;
  sectionOrder?: SectionOrderKey[];
  sectionTitles?: SectionTitles;
}

export default function CompactTemplate({
  data,
  sectionVisibility = defaultSectionVisibility,
  sectionOrder = defaultSectionOrder,
  sectionTitles = {},
}: CompactTemplateProps) {
  const getSectionTitle = (key: SectionOrderKey): string => {
    if (key === 'personalInfo') return 'Personal Info';
    return sectionTitles[key as keyof typeof defaultSectionTitles] ||
      defaultSectionTitles[key as keyof typeof defaultSectionTitles] ||
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
  };

  const renderSection = (sectionKey: SectionOrderKey) => {
    if (!sectionVisibility[sectionKey]) return null;
    const title = getSectionTitle(sectionKey);

    switch (sectionKey) {
      case 'summary':
        if (!data.personalInfo.summary) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-1">
              {title}
            </h2>
            <p className="text-gray-900 leading-snug text-xs">{data.personalInfo.summary}</p>
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            <div className="space-y-2">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{exp.position}</h3>
                      <p className="text-gray-800 text-xs">{exp.company}</p>
                    </div>
                    <div className="text-right text-xs text-gray-700">
                      <p>{exp.startDate} - {exp.endDate}</p>
                      {exp.location && <p>{exp.location}</p>}
                    </div>
                  </div>
                  <ul className="list-disc list-inside ml-4 space-y-0.5 text-gray-800 text-xs">
                    {exp.achievements.filter((a) => a.trim()).map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{edu.degree}</h3>
                      <p className="text-gray-800 text-xs">{edu.institution}</p>
                    </div>
                    <div className="text-right text-xs text-gray-700">
                      <p>{edu.startYear} - {edu.endYear}</p>
                    </div>
                  </div>
                  {edu.description && (
                    <BulletText text={edu.description} className="text-gray-800 text-xs mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      case 'skills':
        if (data.skills.technical.length === 0 && data.skills.soft.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            {data.skills.technical.length > 0 && (
              <div className="mb-1">
                <p className="text-gray-900 text-xs"><strong>Technical:</strong> {data.skills.technical.join(', ')}</p>
              </div>
            )}
            {data.skills.soft.length > 0 && (
              <div>
                <p className="text-gray-900 text-xs"><strong>Soft Skills:</strong> {data.skills.soft.join(', ')}</p>
              </div>
            )}
          </section>
        );
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            <div className="space-y-2">
              {data.projects.map((proj) => (
                <div key={proj.id}>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {proj.projectLink ? (
                      <a href={proj.projectLink} target="_blank" rel="noopener noreferrer" className="underline">
                        {proj.projectName}
                      </a>
                    ) : (
                      proj.projectName
                    )}
                  </h3>
                  {proj.description && (
                    <BulletText text={proj.description} className="text-gray-800 text-xs mt-0.5" />
                  )}
                  {proj.technologiesUsed && (
                    <p className="text-gray-700 text-[11px] mt-0.5 italic">Technologies: {proj.technologiesUsed}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            <div className="space-y-1.5">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{cert.certificateName}</h3>
                    <p className="text-gray-800 text-xs">{cert.issuer}</p>
                    {cert.credentialLink && (
                      <a href={cert.credentialLink} target="_blank" rel="noopener noreferrer" className="text-gray-800 text-[11px] underline">
                        View Credential
                      </a>
                    )}
                  </div>
                  <p className="text-gray-700 text-xs">{cert.year}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'achievements':
        if (!data.achievements || data.achievements.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            <div className="space-y-1.5">
              {data.achievements.map((ach) => (
                <div key={ach.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{ach.title}</h3>
                    {ach.description && (
                      <BulletText text={ach.description} className="text-gray-800 text-xs" />
                    )}
                  </div>
                  <p className="text-gray-700 text-xs">{ach.year}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {title}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang) => (
                <div key={lang.id} className="text-gray-900 text-xs">
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-[11px] ml-1">({lang.proficiency})</span>
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-2 sm:p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-3 border-b border-gray-300 pb-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          {data.personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap gap-2 text-xs text-gray-800 mt-1">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
        </div>
        {(data.personalInfo.linkedIn || data.personalInfo.portfolio) && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-800 mt-1">
            {data.personalInfo.linkedIn && (
              <a
                href={data.personalInfo.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {data.personalInfo.linkedIn}
              </a>
            )}
            {data.personalInfo.portfolio && (
              <a
                href={data.personalInfo.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {data.personalInfo.portfolio}
              </a>
            )}
          </div>
        )}
      </div>
      {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
    </div>
  );
}
