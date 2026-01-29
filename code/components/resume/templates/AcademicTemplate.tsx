/**
 * Academic Template
 *
 * Clean, readable layout suited for research and education roles.
 * ATS-friendly with clear section rules and consistent typography.
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

interface AcademicTemplateProps {
  data: ResumeData;
  sectionVisibility?: SectionVisibility;
  sectionOrder?: SectionOrderKey[];
  sectionTitles?: SectionTitles;
}

export default function AcademicTemplate({
  data,
  sectionVisibility = defaultSectionVisibility,
  sectionOrder = defaultSectionOrder,
  sectionTitles = {},
}: AcademicTemplateProps) {
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
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <p className="text-gray-800 leading-relaxed text-sm">{data.personalInfo.summary}</p>
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{exp.position}</h3>
                      <p className="text-gray-800">{exp.company}</p>
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p>{exp.startDate} - {exp.endDate}</p>
                      {exp.location && <p className="text-xs">{exp.location}</p>}
                    </div>
                  </div>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-800 text-sm">
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
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{edu.degree}</h3>
                      <p className="text-gray-800">{edu.institution}</p>
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p>{edu.startYear} - {edu.endYear}</p>
                    </div>
                  </div>
                  {edu.description && (
                    <BulletText text={edu.description} className="text-gray-800 text-sm mt-1" />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      case 'skills':
        if (data.skills.technical.length === 0 && data.skills.soft.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            {data.skills.technical.length > 0 && (
              <div className="mb-2">
                <p className="text-gray-900 text-sm"><strong>Technical:</strong> {data.skills.technical.join(', ')}</p>
              </div>
            )}
            {data.skills.soft.length > 0 && (
              <div>
                <p className="text-gray-900 text-sm"><strong>Soft Skills:</strong> {data.skills.soft.join(', ')}</p>
              </div>
            )}
          </section>
        );
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <div className="space-y-3">
              {data.projects.map((proj) => (
                <div key={proj.id}>
                  <h3 className="font-semibold text-gray-900 text-base">
                    {proj.projectLink ? (
                      <a href={proj.projectLink} target="_blank" rel="noopener noreferrer" className="underline">
                        {proj.projectName}
                      </a>
                    ) : (
                      proj.projectName
                    )}
                  </h3>
                  {proj.description && (
                    <BulletText text={proj.description} className="text-gray-800 text-sm mt-1" />
                  )}
                  {proj.technologiesUsed && (
                    <p className="text-gray-700 text-xs mt-1 italic">Technologies: {proj.technologiesUsed}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <div className="space-y-2">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{cert.certificateName}</h3>
                    <p className="text-gray-800 text-sm">{cert.issuer}</p>
                    {cert.credentialLink && (
                      <a href={cert.credentialLink} target="_blank" rel="noopener noreferrer" className="text-gray-800 text-xs underline">
                        View Credential
                      </a>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{cert.year}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'achievements':
        if (!data.achievements || data.achievements.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <div className="space-y-2">
              {data.achievements.map((ach) => (
                <div key={ach.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{ach.title}</h3>
                    {ach.description && (
                      <BulletText text={ach.description} className="text-gray-800 text-sm" />
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{ach.year}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <section key={sectionKey} className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-1">
              {title}
            </h2>
            <div className="h-px bg-gray-400 mb-3" />
            <div className="flex flex-wrap gap-3">
              {data.languages.map((lang) => (
                <div key={lang.id} className="text-gray-900 text-sm">
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-xs ml-1">({lang.proficiency})</span>
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
    <div className="bg-white p-4 sm:p-6 md:p-8 max-w-4xl mx-auto font-serif w-full">
      <div className="mb-6 border-b border-gray-800 pb-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {data.personalInfo.fullName || 'Your Name'}
        </h1>
        <div className="flex flex-wrap gap-3 text-sm text-gray-800 mt-2">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
        </div>
        {(data.personalInfo.linkedIn || data.personalInfo.portfolio) && (
          <div className="flex flex-wrap gap-3 text-sm text-gray-800 mt-2">
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
