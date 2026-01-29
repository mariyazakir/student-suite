/**
 * Resume Editor Component
 * 
 * Main editor component that contains all section editors.
 * Manages resume data state and passes it to section components.
 */

'use client';

import { useMemo } from 'react';
import PersonalDetailsEditor from './sections/PersonalDetailsEditor';
import SummaryEditor from './sections/SummaryEditor';
import ExperienceEditor from './sections/ExperienceEditor';
import SkillsEditor from './sections/SkillsEditor';
import EducationEditor from './sections/EducationEditor';
import ProjectsEditor from './sections/ProjectsEditor';
import CertificationsEditor from './sections/CertificationsEditor';
import AchievementsEditor from './sections/AchievementsEditor';
import LanguagesEditor from './sections/LanguagesEditor';
import type { ResumeData } from '@/types';
import { extractKeywords, extractPhrases } from '@/lib/ats/ats-utils';

interface ResumeEditorProps {
  data: ResumeData;
  onDataChange: (data: ResumeData) => void;
  jobDescription?: string;
}

export default function ResumeEditor({ data, onDataChange, jobDescription = '' }: ResumeEditorProps) {
  const jobKeywords = useMemo(
    () => (jobDescription.trim() ? extractKeywords(jobDescription) : []),
    [jobDescription]
  );
  const jobPhrases = useMemo(
    () => (jobDescription.trim() ? extractPhrases(jobDescription) : []),
    [jobDescription]
  );
  const updatePersonalInfo = (personalInfo: ResumeData['personalInfo']) => {
    onDataChange({ ...data, personalInfo });
  };

  const updateSummary = (summary: string) => {
    onDataChange({
      ...data,
      personalInfo: { ...data.personalInfo, summary },
    });
  };

  const updateExperience = (experience: ResumeData['experience']) => {
    onDataChange({ ...data, experience });
  };

  const updateSkills = (skills: ResumeData['skills']) => {
    onDataChange({ ...data, skills });
  };

  const updateEducation = (education: ResumeData['education']) => {
    onDataChange({ ...data, education });
  };

  const updateProjects = (projects: ResumeData['projects'] = []) => {
    onDataChange({ ...data, projects });
  };

  const updateCertifications = (certifications: ResumeData['certifications'] = []) => {
    onDataChange({ ...data, certifications });
  };

  const updateAchievements = (achievements: ResumeData['achievements'] = []) => {
    onDataChange({ ...data, achievements });
  };

  const updateLanguages = (languages: ResumeData['languages'] = []) => {
    onDataChange({ ...data, languages });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <PersonalDetailsEditor
        data={data.personalInfo}
        onUpdate={updatePersonalInfo}
      />
      
      <SummaryEditor
        summary={data.personalInfo.summary || ''}
        onUpdate={updateSummary}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <SkillsEditor
        skills={data.skills}
        onUpdate={updateSkills}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <ExperienceEditor
        experience={data.experience}
        onUpdate={updateExperience}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <EducationEditor
        education={data.education}
        onUpdate={updateEducation}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <ProjectsEditor
        projects={data.projects || []}
        onUpdate={updateProjects}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <CertificationsEditor
        certifications={data.certifications || []}
        onUpdate={updateCertifications}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <AchievementsEditor
        achievements={data.achievements || []}
        onUpdate={updateAchievements}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
      
      <LanguagesEditor
        languages={data.languages || []}
        onUpdate={updateLanguages}
        jobKeywords={jobKeywords}
        jobPhrases={jobPhrases}
      />
    </div>
  );
}
