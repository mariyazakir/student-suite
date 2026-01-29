/**
 * Modern Template
 * 
 * Contemporary resume template with subtle color accents.
 * Better visual hierarchy while remaining ATS-friendly.
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

interface ModernTemplateProps {
  data: ResumeData;
  sectionVisibility?: SectionVisibility;
  sectionOrder?: SectionOrderKey[];
  sectionTitles?: SectionTitles;
}

export default function ModernTemplate({ 
  data, 
  sectionVisibility = defaultSectionVisibility,
  sectionOrder = defaultSectionOrder,
  sectionTitles = {},
}: ModernTemplateProps) {
  const getSectionTitle = (key: SectionOrderKey): string => {
    if (key === 'personalInfo') return 'Personal Info';
    return sectionTitles[key as keyof typeof defaultSectionTitles] || 
           defaultSectionTitles[key as keyof typeof defaultSectionTitles] || 
           key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
  };
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header with accent */}
      <div className="mb-8">
        <div className="bg-primary-600 text-white p-6 rounded-t-lg">
          <h1 className="text-4xl font-bold mb-2">
            {data.personalInfo.fullName || 'Your Name'}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-primary-50">
            {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
            {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
          </div>
        </div>
        {(data.personalInfo.linkedIn || data.personalInfo.portfolio) && (
          <div className="bg-gray-50 px-6 py-3 rounded-b-lg border-l-4 border-primary-600">
            <div className="flex flex-wrap gap-4 text-sm">
              {data.personalInfo.linkedIn && (
                <a
                  href={data.personalInfo.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium break-all"
                >
                  {data.personalInfo.linkedIn}
                </a>
              )}
              {data.personalInfo.portfolio && (
                <a
                  href={data.personalInfo.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium break-all"
                >
                  {data.personalInfo.portfolio}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Sections in Order */}
      {sectionOrder.map((sectionKey) => {
        if (!sectionVisibility[sectionKey]) return null;
        const title = getSectionTitle(sectionKey).toUpperCase();

        switch (sectionKey) {
          case 'summary':
            if (!data.personalInfo.summary) return null;
            return (
              <section key={sectionKey} className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <p className="text-gray-700 leading-relaxed pl-2">{data.personalInfo.summary}</p>
              </section>
            );

          case 'experience':
            if (data.experience.length === 0) return null;
            return (
              <section key={sectionKey} className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="space-y-5">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{exp.position}</h3>
                          <p className="text-primary-600 font-semibold">{exp.company}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">{exp.startDate} - {exp.endDate}</p>
                          {exp.location && <p className="text-xs text-gray-500">{exp.location}</p>}
                        </div>
                      </div>
                      <ul className="list-none space-y-1.5 ml-2">
                        {exp.achievements.filter(a => a.trim()).map((achievement, idx) => (
                          <li key={idx} className="text-gray-700 text-sm flex items-start">
                            <span className="text-primary-600 mr-2">▸</span>
                            <span>{achievement}</span>
                          </li>
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
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="space-y-5">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{edu.degree}</h3>
                          <p className="text-primary-600 font-semibold">{edu.institution}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">{edu.startYear} - {edu.endYear}</p>
                        </div>
                      </div>
                      {edu.description && (
                        <BulletText text={edu.description} className="text-gray-700 text-sm mt-2" />
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
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="pl-2 space-y-3">
                  {data.skills.technical.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">Technical Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {data.skills.technical.map((skill) => (
                          <span key={skill} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.skills.soft.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">Soft Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {data.skills.soft.map((skill) => (
                          <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );

          case 'projects':
            if (!data.projects || data.projects.length === 0) return null;
            return (
              <section key={sectionKey} className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="space-y-5">
                  {data.projects.map((proj) => (
                    <div key={proj.id} className="border-l-4 border-primary-500 pl-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        {proj.projectLink ? (
                          <a href={proj.projectLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                            {proj.projectName}
                          </a>
                        ) : (
                          proj.projectName
                        )}
                      </h3>
                      {proj.description && (
                        <BulletText text={proj.description} className="text-gray-700 text-sm mb-2" />
                      )}
                      {proj.technologiesUsed && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {proj.technologiesUsed.split(',').map((tech, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
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
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="space-y-4">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{cert.certificateName}</h3>
                          <p className="text-primary-600 font-medium">{cert.issuer}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{cert.year}</p>
                      </div>
                      {cert.credentialLink && (
                        <a href={cert.credentialLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 text-sm">
                          View Credential →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'achievements':
            if (!data.achievements || data.achievements.length === 0) return null;
            return (
              <section key={sectionKey} className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="space-y-4">
                  {data.achievements.map((ach) => (
                    <div key={ach.id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 text-base">{ach.title}</h3>
                        <p className="text-sm font-medium text-gray-700">{ach.year}</p>
                      </div>
                      {ach.description && (
                        <BulletText text={ach.description} className="text-gray-700 text-sm mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'languages':
            if (!data.languages || data.languages.length === 0) return null;
            return (
              <section key={sectionKey} className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md mr-3 text-sm font-semibold">
                    {title}
                  </span>
                  <span className="flex-1 border-t-2 border-primary-200"></span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {data.languages.map((lang) => (
                    <div key={lang.id} className="bg-primary-50 border border-primary-200 px-4 py-2 rounded-lg">
                      <span className="font-semibold text-gray-900">{lang.language}</span>
                      <span className="text-sm text-gray-600 ml-2">({lang.proficiency})</span>
                    </div>
                  ))}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
