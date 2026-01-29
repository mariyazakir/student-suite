/**
 * ATS Score Panel Component
 *
 * Provides a basic ATS-friendly score and suggestions based on
 * resume data and a pasted job description.
 */

'use client';

import { useMemo, useState } from 'react';
import type { ResumeData } from '@/types';
import {
  extractKeywords,
  extractPhrases,
  getSkillClusters,
  getKeywordSetForText,
  getMissingKeywordsForText,
  normalizeText,
  type SynonymMap,
} from '@/lib/ats/ats-utils';

interface ATSScorePanelProps {
  resumeData: ResumeData;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  heatmapEnabled?: boolean;
  onToggleHeatmap?: (enabled: boolean) => void;
  onAddSkillKeyword?: (keyword: string) => void;
  onAddAllSkillKeywords?: (keywords: string[]) => void;
  onExportResume?: () => Promise<void> | void;
  onAnnounce?: (message: string, priority?: 'polite' | 'assertive') => void;
  onNotify?: (message: string, type?: 'error' | 'success' | 'info') => void;
}

const ROLE_PRESETS: { label: string; description: string }[] = [
  { label: 'Doctor (General Practitioner)', description: 'Primary care, diagnose and manage common conditions, order tests, coordinate treatment plans. Skills: patient assessment, EMR, clinical decision making.' },
  { label: 'Cardiologist', description: 'Diagnose and treat heart conditions, manage risk factors, interpret cardiac tests. Skills: cardiology, ECG, echocardiography, patient counseling.' },
  { label: 'Neurologist', description: 'Evaluate and treat nervous system disorders, order imaging, manage chronic neuro conditions. Skills: neuro exam, MRI/CT interpretation, care planning.' },
  { label: 'Psychiatrist', description: 'Diagnose and treat mental health disorders, manage medications, coordinate therapy. Skills: psychiatric assessment, psychopharmacology, crisis management.' },
  { label: 'Pulmonologist', description: 'Manage lung and respiratory diseases, interpret PFTs, oversee chronic care. Skills: pulmonology, PFT, ventilator basics.' },
  { label: 'Gastroenterologist', description: 'Diagnose and treat GI conditions, perform scopes, manage chronic GI care. Skills: endoscopy, GI assessment, patient counseling.' },
  { label: 'Hepatologist', description: 'Manage liver diseases, interpret labs/imaging, coordinate transplant referrals. Skills: hepatology, cirrhosis care, patient education.' },
  { label: 'Nephrologist', description: 'Manage kidney disease, interpret labs, oversee dialysis care. Skills: nephrology, fluid/electrolyte management, CKD care.' },
  { label: 'Urologist', description: 'Treat urinary and male reproductive conditions, perform procedures. Skills: urology, endoscopy, patient counseling.' },
  { label: 'Endocrinologist', description: 'Treat hormonal/metabolic disorders, adjust therapies, counsel patients. Skills: endocrinology, diabetes management, thyroid care.' },
  { label: 'Rheumatologist', description: 'Diagnose/treat autoimmune and joint diseases, manage biologics. Skills: rheumatology, joint assessment, immunology basics.' },
  { label: 'Oncologist', description: 'Manage cancer care, coordinate treatment plans, counsel patients. Skills: oncology, staging, treatment planning.' },
  { label: 'Hematologist', description: 'Diagnose/treat blood disorders, interpret labs, manage therapies. Skills: hematology, coagulation, transfusion basics.' },
  { label: 'Dermatologist', description: 'Diagnose/treat skin conditions, perform procedures, counsel patients. Skills: dermatology, derm procedures, patient education.' },
  { label: 'Allergist/Immunologist', description: 'Diagnose allergies/immune disorders, interpret tests, manage treatments. Skills: allergy testing, immunotherapy, patient education.' },
  { label: 'Infectious Disease Specialist', description: 'Diagnose/treat infections, guide antimicrobials, manage complex cases. Skills: ID consults, stewardship, infection control.' },
  { label: 'Orthopedic Surgeon', description: 'Treat musculoskeletal conditions surgically and non-surgically. Skills: ortho evaluation, surgical techniques, rehab planning.' },
  { label: 'General Surgeon', description: 'Perform surgical procedures, perioperative care, coordinate teams. Skills: surgery, sterile technique, post-op management.' },
  { label: 'ENT (Otolaryngologist)', description: 'Manage ear, nose, throat conditions; perform procedures. Skills: ENT exam, scopes, surgical care.' },
  { label: 'Ophthalmologist', description: 'Diagnose/treat eye diseases, perform eye procedures. Skills: eye exam, imaging, surgical basics.' },
  { label: 'Optometrist', description: 'Provide eye exams, prescribe lenses, detect ocular conditions. Skills: refraction, ocular screening, patient education.' },
  { label: 'Obstetrician/Gynecologist (OB/GYN)', description: 'Provide women’s health, prenatal care, deliveries, surgeries. Skills: OB care, gynecologic procedures, counseling.' },
  { label: 'Pediatrician', description: 'Child health care, immunizations, growth monitoring, parent guidance. Skills: pediatrics, preventative care, communication.' },
  { label: 'Geriatrician', description: 'Care for older adults, manage multiple conditions, coordinate care. Skills: geriatric assessment, medication review, counseling.' },
  { label: 'Radiologist', description: 'Interpret imaging, report findings, collaborate with teams. Skills: diagnostic imaging, clinical analysis.' },
  { label: 'Anesthesiologist', description: 'Provide anesthesia, monitor patients, manage perioperative care. Skills: anesthesia planning, airway management, monitoring.' },
  { label: 'Emergency Medicine Physician', description: 'Acute care for diverse conditions, stabilize patients, triage. Skills: emergency assessment, procedures, teamwork.' },
  { label: 'Pathologist', description: 'Interpret lab specimens, support diagnoses, ensure quality. Skills: pathology, lab QA, reporting.' },
  { label: 'Palliative Care Physician', description: 'Manage symptoms, support patients/families, coordinate care. Skills: palliative care, communication, pain/symptom control.' },
  { label: 'Physical Medicine & Rehabilitation (Physiatrist)', description: 'Rehab planning, functional restoration, coordinate therapies. Skills: PM&R, mobility assessment, patient counseling.' },
  { label: 'Nurse (Registered Nurse)', description: 'Patient monitoring, medication administration, care plans, documentation. Skills: nursing care, EMR, teamwork, patient education.' },
  { label: 'Nurse (Psychiatric Nurse)', description: 'Mental health assessments, medication management, crisis intervention. Skills: psychiatric care, counseling, safety protocols.' },
  { label: 'Nurse (Midwife)', description: 'Prenatal care, delivery support, postpartum care. Skills: maternity care, patient education, monitoring.' },
  { label: 'Pharmacist', description: 'Dispense medications, review prescriptions, counsel patients. Skills: pharmacology, safety checks, compliance.' },
  { label: 'Dentist', description: 'Oral exams, treatment plans, procedures. Skills: dental care, patient management, hygiene.' },
  { label: 'Medical Technologist', description: 'Run lab tests, maintain equipment, report results. Skills: lab procedures, QA, documentation.' },
  { label: 'Physiotherapist', description: 'Assess mobility, design rehab plans, patient coaching. Skills: therapy techniques, patient care.' },

  { label: 'Accountant', description: 'Prepare financial statements, reconcile accounts, ensure compliance. Skills: GAAP, Excel, reporting.' },
  { label: 'Auditor', description: 'Review financial records, assess controls, report findings. Skills: audit planning, compliance.' },
  { label: 'Actuary', description: 'Model risk, analyze data, forecast outcomes. Skills: statistics, modeling, Excel/SQL.' },
  { label: 'Banker', description: 'Client service, account management, financial products. Skills: banking operations, compliance.' },
  { label: 'Investment Analyst', description: 'Analyze markets, build models, recommend investments. Skills: valuation, research, finance.' },
  { label: 'Financial Planner', description: 'Create financial plans, budgeting, retirement planning. Skills: client advising, analysis.' },
  { label: 'Human Resources Manager', description: 'Recruiting, employee relations, policy management. Skills: HR operations, compliance.' },
  { label: 'Recruiter', description: 'Source candidates, screen, coordinate interviews. Skills: talent acquisition, communication.' },
  { label: 'Marketing Specialist', description: 'Campaign planning, content, analytics. Skills: marketing strategy, SEO, social.' },
  { label: 'Sales Executive', description: 'Lead generation, pipeline management, closing deals. Skills: sales strategy, CRM.' },

  { label: 'Software Developer', description: 'Build and maintain software, write clean code, collaborate with teams. Skills: programming, testing, Git.' },
  { label: 'Web Developer', description: 'Develop web applications, responsive UI, integrate APIs. Skills: HTML, CSS, JavaScript.' },
  { label: 'Mobile App Developer', description: 'Build mobile apps, optimize performance, publish releases. Skills: iOS/Android, UI, APIs.' },
  { label: 'Data Scientist', description: 'Analyze data, build models, communicate insights. Skills: Python, ML, statistics.' },
  { label: 'AI Engineer', description: 'Develop AI models, deploy pipelines, optimize performance. Skills: ML, Python, MLOps.' },
  { label: 'Cybersecurity Analyst', description: 'Monitor threats, respond to incidents, assess risk. Skills: security tools, SIEM.' },
  { label: 'Cloud Architect', description: 'Design cloud solutions, ensure scalability and security. Skills: AWS/Azure, architecture.' },
  { label: 'Systems Administrator', description: 'Maintain servers, troubleshoot issues, manage networks. Skills: Linux, scripting, networking.' },
  { label: 'UX/UI Designer', description: 'Design user flows, wireframes, prototypes. Skills: Figma, user research, UI design.' },
  { label: 'Game Developer', description: 'Build game mechanics, optimize performance, collaborate with art/design. Skills: Unity/Unreal, C#.' },

  { label: 'Teacher (Primary)', description: 'Deliver lessons, manage classroom, assess student progress. Skills: curriculum, communication.' },
  { label: 'Teacher (Secondary)', description: 'Teach subject content, evaluate students, plan lessons. Skills: instruction, assessment.' },
  { label: 'Teacher (Special Education)', description: 'Create individualized plans, support diverse needs. Skills: IEPs, inclusive teaching.' },
  { label: 'University Professor', description: 'Teach courses, conduct research, mentor students. Skills: pedagogy, research.' },
  { label: 'Lecturer', description: 'Deliver lectures, prepare materials, assess learning. Skills: teaching, content design.' },
  { label: 'Corporate Trainer', description: 'Design and deliver training, evaluate outcomes. Skills: facilitation, LMS.' },
  { label: 'Instructional Designer', description: 'Create learning materials, define outcomes. Skills: learning design, e‑learning.' },
  { label: 'Librarian', description: 'Manage collections, assist research, catalog resources. Skills: information management.' },
  { label: 'Academic Researcher', description: 'Conduct studies, analyze data, publish findings. Skills: research methods, writing.' },

  { label: 'Civil Engineer', description: 'Design infrastructure projects, ensure compliance. Skills: CAD, project management.' },
  { label: 'Mechanical Engineer', description: 'Design mechanical systems, test prototypes. Skills: CAD, analysis.' },
  { label: 'Electrical Engineer', description: 'Design electrical systems, troubleshoot issues. Skills: circuit design, testing.' },
  { label: 'Chemical Engineer', description: 'Optimize processes, ensure safety, scale production. Skills: process design.' },
  { label: 'Aerospace Engineer', description: 'Design aircraft systems, test performance. Skills: aerodynamics, analysis.' },
  { label: 'Factory Worker', description: 'Operate equipment, follow procedures, ensure quality. Skills: safety, teamwork.' },
  { label: 'Machine Operator', description: 'Operate machinery, monitor output, perform checks. Skills: equipment operation.' },
  { label: 'Quality Assurance Specialist', description: 'Inspect products, manage quality standards. Skills: QA processes, documentation.' },

  { label: 'Actor', description: 'Perform roles, rehearse, collaborate with directors. Skills: acting, communication.' },
  { label: 'Musician', description: 'Perform or compose music, rehearse, collaborate. Skills: music theory, performance.' },
  { label: 'Dancer', description: 'Perform choreography, rehearse routines. Skills: technique, performance.' },
  { label: 'Photographer', description: 'Capture images, edit photos, manage shoots. Skills: lighting, editing.' },
  { label: 'Graphic Designer', description: 'Create visual designs, branding, marketing assets. Skills: Adobe suite, typography.' },
  { label: 'Illustrator', description: 'Create illustrations for print or digital. Skills: drawing, composition.' },
  { label: 'Animator', description: 'Create animations, storyboard, refine motion. Skills: animation tools.' },
  { label: 'Journalist', description: 'Research stories, conduct interviews, write articles. Skills: writing, reporting.' },
  { label: 'Editor', description: 'Edit content, ensure clarity and accuracy. Skills: editing, proofreading.' },
  { label: 'Filmmaker', description: 'Plan and produce video content. Skills: storytelling, production.' },
  { label: 'Social Media Influencer', description: 'Create content, grow audience, partnerships. Skills: social strategy, analytics.' },
  { label: 'Content Creator', description: 'Produce content across platforms. Skills: writing, video, social.' },

  { label: 'Lawyer', description: 'Advise clients, draft legal documents, represent cases. Skills: legal research, writing.' },
  { label: 'Judge', description: 'Preside over cases, interpret law, issue rulings. Skills: legal analysis.' },
  { label: 'Paralegal', description: 'Support legal work, prepare documents, research. Skills: legal research, organization.' },
  { label: 'Police Officer', description: 'Enforce laws, respond to incidents, patrol. Skills: safety, communication.' },
  { label: 'Firefighter', description: 'Emergency response, rescue operations, safety. Skills: emergency response.' },
  { label: 'Soldier', description: 'Conduct missions, follow protocols, teamwork. Skills: discipline, operations.' },
  { label: 'Politician', description: 'Develop policy, represent constituents, public speaking. Skills: leadership, communication.' },
  { label: 'Diplomat', description: 'Manage international relations, negotiation. Skills: diplomacy, communication.' },
  { label: 'Civil Servant', description: 'Administer public services, policy implementation. Skills: administration.' },
  { label: 'Social Worker', description: 'Support individuals/families, case management. Skills: counseling, advocacy.' },
  { label: 'NGO Coordinator', description: 'Manage programs, partnerships, reporting. Skills: program management.' },

  { label: 'Biologist', description: 'Conduct biological research, analyze data. Skills: lab work, analysis.' },
  { label: 'Chemist', description: 'Run experiments, analyze compounds. Skills: lab techniques, safety.' },
  { label: 'Physicist', description: 'Research physical systems, model data. Skills: analysis, research.' },
  { label: 'Environmental Scientist', description: 'Study ecosystems, assess environmental impact. Skills: field work, analysis.' },
  { label: 'Ecologist', description: 'Analyze ecosystems, conservation research. Skills: ecology, data analysis.' },
  { label: 'Archaeologist', description: 'Excavate sites, analyze artifacts. Skills: field research, documentation.' },
  { label: 'Anthropologist', description: 'Study human behavior and cultures. Skills: research, analysis.' },
  { label: 'Research Assistant', description: 'Support studies, collect data, documentation. Skills: research methods.' },
  { label: 'Lab Technician', description: 'Operate lab equipment, run tests. Skills: lab procedures, QA.' },

  { label: 'Electrician', description: 'Install/repair electrical systems, follow codes. Skills: wiring, safety.' },
  { label: 'Plumber', description: 'Install/repair plumbing systems. Skills: troubleshooting, safety.' },
  { label: 'Carpenter', description: 'Construct/repair structures, measure and cut materials. Skills: tools, precision.' },
  { label: 'Mechanic', description: 'Diagnose and repair vehicles. Skills: troubleshooting, tools.' },
  { label: 'Welder', description: 'Join metals using welding techniques. Skills: welding, safety.' },
  { label: 'Tailor', description: 'Alter and create garments. Skills: sewing, measurements.' },
  { label: 'Chef', description: 'Prepare meals, manage kitchen operations. Skills: cooking, food safety.' },
  { label: 'Baker', description: 'Bake breads/pastries, manage recipes. Skills: baking, timing.' },
  { label: 'Butcher', description: 'Prepare meat, ensure safety standards. Skills: knife skills, hygiene.' },
  { label: 'Driver', description: 'Transport goods/people safely. Skills: navigation, safety.' },
  { label: 'Construction Worker', description: 'Assist on construction sites, follow safety rules. Skills: physical work, safety.' },

  { label: 'Hotel Manager', description: 'Oversee hotel operations, staff, guest satisfaction. Skills: management, service.' },
  { label: 'Receptionist', description: 'Front desk support, scheduling, communication. Skills: organization, customer service.' },
  { label: 'Tour Guide', description: 'Lead tours, provide information. Skills: communication, knowledge.' },
  { label: 'Travel Agent', description: 'Plan trips, bookings, customer service. Skills: planning, communication.' },
  { label: 'Flight Attendant', description: 'Ensure passenger safety, service. Skills: safety, communication.' },
  { label: 'Pilot', description: 'Operate aircraft safely, follow procedures. Skills: navigation, safety.' },
  { label: 'Restaurant Waiter', description: 'Serve guests, take orders, manage tables. Skills: service, communication.' },
  { label: 'Bartender', description: 'Prepare drinks, manage bar service. Skills: mixology, service.' },

  { label: 'Farmer', description: 'Manage crops/livestock, maintain equipment. Skills: agriculture, planning.' },
  { label: 'Rancher', description: 'Manage livestock and land. Skills: animal care, operations.' },
  { label: 'Agricultural Technician', description: 'Support farm operations, run tests. Skills: agronomy, data collection.' },
  { label: 'Horticulturist', description: 'Grow/manage plants, landscape maintenance. Skills: plant care.' },
  { label: 'Gardener', description: 'Maintain gardens, plant care. Skills: horticulture.' },
  { label: 'Wildlife Conservationist', description: 'Protect wildlife, manage habitats. Skills: conservation, field work.' },
  { label: 'Forester', description: 'Manage forests, conservation planning. Skills: forestry, ecology.' },
  { label: 'Fisheries Worker', description: 'Assist in fishing operations, maintain equipment. Skills: safety, teamwork.' },

  { label: 'Custom', description: '' },
];

const ROLE_PRESET_SYNONYMS: Record<string, SynonymMap> = {
  'Software Engineer': {
    frontend: ['front-end', 'front end'],
    backend: ['back-end', 'back end'],
    cicd: ['ci/cd', 'ci cd'],
  },
  'Data Analyst': {
    bi: ['business intelligence'],
    tableau: ['data visualization'],
  },
  'Product Manager': {
    roadmap: ['road mapping'],
    prd: ['product requirements', 'product requirements document'],
  },
  'Graphic Designer': {
    branding: ['brand identity'],
  },
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const getResumeText = (data: ResumeData) => {
  const personal = [
    data.personalInfo.fullName,
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedIn,
    data.personalInfo.portfolio,
    data.personalInfo.summary,
  ];
  const experience = data.experience.flatMap((exp) => [
    exp.company,
    exp.position,
    exp.location,
    exp.startDate,
    exp.endDate,
    ...exp.achievements,
  ]);
  const education = data.education.flatMap((edu) => [
    edu.degree,
    edu.institution,
    edu.startYear,
    edu.endYear,
    edu.description,
  ]);
  const projects = (data.projects || []).flatMap((proj) => [
    proj.projectName,
    proj.description,
    proj.technologiesUsed,
    proj.projectLink,
  ]);
  const certifications = (data.certifications || []).flatMap((cert) => [
    cert.certificateName,
    cert.issuer,
    cert.year,
    cert.credentialLink,
  ]);
  const achievements = (data.achievements || []).flatMap((ach) => [
    ach.title,
    ach.description,
    ach.year,
  ]);
  const languages = (data.languages || []).flatMap((lang) => [
    lang.language,
    lang.proficiency,
  ]);
  const skills = [...data.skills.technical, ...data.skills.soft];

  return [
    ...personal,
    ...experience,
    ...education,
    ...projects,
    ...certifications,
    ...achievements,
    ...languages,
    ...skills,
  ]
    .filter(Boolean)
    .join(' ');
};

const hasAnyText = (value: string | undefined | null) => !!value && value.trim().length > 0;

const hasValidDates = (value: string | undefined | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'present' || normalized === 'current') return true;
  return /\d{4}/.test(normalized);
};

const buildReportText = (analysis: {
  score: number;
  matchRate: number;
  keywordScore: number;
  completenessScore: number;
  formattingScore: number;
  wordCount: number;
  suggestions: string[];
  matched: string[];
  missing: string[];
  matchedPhrases: string[];
  missingPhrases: string[];
  checklist: { label: string; passed: boolean }[];
  lengthWarnings: string[];
  atsTips: string[];
}) => {
  const lines = [
    `ATS Score Report`,
    `Score: ${analysis.score}/100`,
    `Keyword match: ${formatPercent(analysis.matchRate)}`,
    `Word count: ${analysis.wordCount}`,
    `Breakdown:`,
    `- Keyword match: ${analysis.keywordScore}/60`,
    `- Completeness: ${analysis.completenessScore}/25`,
    `- Formatting: ${analysis.formattingScore}/15`,
    ``,
    `Checklist:`,
    ...analysis.checklist.map((item) => `- ${item.passed ? 'PASS' : 'WARN'}: ${item.label}`),
    ``,
    `Suggestions:`,
    ...analysis.suggestions.map((item) => `- ${item}`),
  ];

  if (analysis.lengthWarnings.length) {
    lines.push('', 'Length warnings:', ...analysis.lengthWarnings.map((item) => `- ${item}`));
  }

  if (analysis.atsTips.length) {
    lines.push('', 'ATS tips:', ...analysis.atsTips.map((item) => `- ${item}`));
  }

  if (analysis.missing.length) {
    lines.push('', 'Missing keywords:', analysis.missing.join(', '));
  }
  if (analysis.missingPhrases.length) {
    lines.push('', 'Missing key phrases:', analysis.missingPhrases.join(', '));
  }
  if (analysis.matched.length) {
    lines.push('', 'Matched keywords:', analysis.matched.join(', '));
  }
  if (analysis.matchedPhrases.length) {
    lines.push('', 'Matched key phrases:', analysis.matchedPhrases.join(', '));
  }

  return lines.join('\n');
};

export default function ATSScorePanel({
  resumeData,
  jobDescription,
  onJobDescriptionChange,
  heatmapEnabled = false,
  onToggleHeatmap,
  onAddSkillKeyword,
  onAddAllSkillKeywords,
  onExportResume,
  onAnnounce,
  onNotify,
}: ATSScorePanelProps) {
  const [selectedPreset, setSelectedPreset] = useState('Custom');
  const presetSynonyms = ROLE_PRESET_SYNONYMS[selectedPreset] || {};

  const analysis = useMemo(() => {
    if (!jobDescription.trim()) {
      return {
        score: 0,
        matchRate: 0,
        keywordScore: 0,
        completenessScore: 0,
        formattingScore: 0,
        wordCount: 0,
        matched: [] as string[],
        missing: [] as string[],
        matchedPhrases: [] as string[],
        missingPhrases: [] as string[],
        checklist: [] as { label: string; passed: boolean }[],
        skillClusters: [] as ReturnType<typeof getSkillClusters>,
        lengthWarnings: [] as string[],
        atsTips: [] as string[],
        suggestions: [
          'Paste a job description to get an ATS score.',
        ],
      };
    }

    const jdKeywords = extractKeywords(jobDescription);
    const jdPhrases = extractPhrases(jobDescription);
    const resumeText = getResumeText(resumeData);
    const resumeNormalized = normalizeText(resumeText);
    const resumeKeywords = getKeywordSetForText(resumeText, presetSynonyms);
    const wordCount = resumeNormalized ? resumeNormalized.split(' ').length : 0;

    const matched = jdKeywords.filter((word) => resumeKeywords.has(word));
    const { missingKeywords, missingPhrases: missingPhrasesList } = getMissingKeywordsForText(
      resumeText,
      jdKeywords,
      jdPhrases,
      presetSynonyms
    );
    const matchedPhrases = jdPhrases.filter((phrase) => resumeNormalized.includes(phrase));
    const missing = missingKeywords;
    const missingPhrases = missingPhrasesList;

    const keywordWeight = 1;
    const phraseWeight = 2;
    const totalWeight = jdKeywords.length * keywordWeight + jdPhrases.length * phraseWeight;
    const matchedWeight = matched.length * keywordWeight + matchedPhrases.length * phraseWeight;
    const matchRate = totalWeight ? matchedWeight / totalWeight : 0;

    const completenessScore = [
      resumeData.personalInfo.fullName ? 3 : 0,
      resumeData.personalInfo.email ? 3 : 0,
      resumeData.personalInfo.phone ? 3 : 0,
      resumeData.personalInfo.location ? 2 : 0,
      resumeData.personalInfo.summary && resumeData.personalInfo.summary.trim().length > 50 ? 4 : 0,
      resumeData.experience.length > 0 ? 5 : 0,
      resumeData.education.length > 0 ? 3 : 0,
      resumeData.skills.technical.length + resumeData.skills.soft.length > 0 ? 5 : 0,
      (resumeData.projects || []).length > 0 ? 2 : 0,
    ].reduce((total, value) => total + value, 0);

    const keywordScore = Math.round(matchRate * 60);

    const hasExperienceDates = resumeData.experience.every(
      (exp) => hasValidDates(exp.startDate) && hasValidDates(exp.endDate)
    );
    const hasEducationDates = resumeData.education.every(
      (edu) => hasValidDates(edu.startYear) && hasValidDates(edu.endYear)
    );
    const hasAchievementText = resumeData.experience.every(
      (exp) => exp.achievements.some((achievement) => hasAnyText(achievement))
    );

    const formattingScore = [
      hasExperienceDates ? 5 : 0,
      hasEducationDates ? 5 : 0,
      hasAchievementText ? 5 : 0,
    ].reduce((total, value) => total + value, 0);

    const score = Math.min(100, keywordScore + completenessScore + formattingScore);

    const suggestions: string[] = [];
    if (matchRate < 0.6) {
      suggestions.push('Add more keywords from the job description.');
    }
    if (missingPhrases.length > 0) {
      suggestions.push('Try to include key phrases from the job description.');
    }
    if (!resumeData.experience.length) {
      suggestions.push('Add at least one experience entry.');
    }
    if (!resumeData.education.length) {
      suggestions.push('Add at least one education entry.');
    }
    if (!resumeData.skills.technical.length && !resumeData.skills.soft.length) {
      suggestions.push('Add skills that match the job description.');
    }
    if (!resumeData.personalInfo.summary || resumeData.personalInfo.summary.trim().length < 50) {
      suggestions.push('Expand your summary with 2–3 strong sentences.');
    }
    if (!hasExperienceDates) {
      suggestions.push('Add consistent start/end dates for experience.');
    }
    if (!hasEducationDates) {
      suggestions.push('Add consistent start/end dates for education.');
    }
    if (!hasAchievementText) {
      suggestions.push('Add impact-focused bullet points in experience.');
    }
    if (!suggestions.length) {
      suggestions.push('Your resume looks well aligned. Keep refining keywords.');
    }

    const lengthWarnings: string[] = [];
    if (wordCount < 150) {
      lengthWarnings.push('Resume looks too short (under 150 words).');
    }
    if (wordCount > 850) {
      lengthWarnings.push('Resume looks too long (over 850 words).');
    }

    const atsTips: string[] = [
      'Use standard section headings like Experience, Education, Skills.',
      'Avoid tables or columns; keep a simple layout.',
      'Use consistent date formats (e.g., 2021–2023).',
      'Use bullet points for achievements and impact.',
      'Avoid icons or graphics in the content.',
    ];

    const checklist = [
      {
        label: 'Full name included',
        passed: hasAnyText(resumeData.personalInfo.fullName),
      },
      {
        label: 'Email included',
        passed: hasAnyText(resumeData.personalInfo.email),
      },
      {
        label: 'Phone number included',
        passed: hasAnyText(resumeData.personalInfo.phone),
      },
      {
        label: 'Summary length is 50+ characters',
        passed:
          hasAnyText(resumeData.personalInfo.summary) &&
          (resumeData.personalInfo.summary ?? '').trim().length >= 50,
      },
      {
        label: 'At least one experience entry',
        passed: resumeData.experience.length > 0,
      },
      {
        label: 'Experience entries have dates',
        passed: hasExperienceDates && resumeData.experience.length > 0,
      },
      {
        label: 'At least one education entry',
        passed: resumeData.education.length > 0,
      },
      {
        label: 'Education entries have dates',
        passed: hasEducationDates && resumeData.education.length > 0,
      },
      {
        label: 'Skills section filled',
        passed: resumeData.skills.technical.length + resumeData.skills.soft.length > 0,
      },
      {
        label: 'Experience has bullet points',
        passed: hasAchievementText && resumeData.experience.length > 0,
      },
    ];

    return {
      score,
      matchRate,
      keywordScore,
      completenessScore,
      formattingScore,
      wordCount,
      matched,
      missing,
      matchedPhrases,
      missingPhrases,
      checklist,
      skillClusters: getSkillClusters(jdKeywords, resumeText, presetSynonyms),
      lengthWarnings,
      atsTips,
      suggestions,
    };
  }, [jobDescription, resumeData, presetSynonyms]);

  const reportText = useMemo(() => buildReportText(analysis), [analysis]);

  const handleDownloadReport = () => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ats-score-report.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReportPdf = async () => {
    if (typeof window === 'undefined') return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.style.padding = '24px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.innerHTML = `
        <h1 style="font-size:18px;margin:0 0 12px;">ATS Score Report</h1>
        <pre style="white-space:pre-wrap;font-size:12px;line-height:1.5;">${reportText.replace(
          /</g,
          '&lt;'
        )}</pre>
      `;
      document.body.appendChild(container);

      await html2pdf().set({
        margin: 10,
        filename: 'ats-score-report.pdf',
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();

      container.remove();
    } catch (error) {
      onNotify?.('Failed to export ATS report PDF. Please try again.', 'error');
      onAnnounce?.('ATS report export failed', 'assertive');
    }
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = ROLE_PRESETS.find((item) => item.label === value);
    if (preset && preset.description) {
      onJobDescriptionChange(preset.description);
    } else if (value === 'Custom') {
      onJobDescriptionChange('');
    }
  };

  const handleCopyKeyword = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(keyword);
      onAnnounce?.(`Copied ${keyword}`, 'polite');
    } catch (error) {
      onAnnounce?.('Copy failed', 'assertive');
      onNotify?.('Copy failed. Please try again.', 'error');
    }
  };

  const handleAddKeyword = (keyword: string) => {
    onAddSkillKeyword?.(keyword);
    onAnnounce?.(`Added ${keyword} to skills`, 'polite');
  };

  const handleAddAll = () => {
    onAddAllSkillKeywords?.(analysis.missing);
    onAnnounce?.('Added missing keywords to skills', 'polite');
  };

  const handleDownloadBundle = async () => {
    onAnnounce?.('Downloading resume and ATS report', 'polite');
    if (onExportResume) {
      await onExportResume();
    }
    await handleDownloadReportPdf();
  };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">ATS Score</h2>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span>
            Score: <span className="font-semibold text-gray-900">{analysis.score}</span>/100
          </span>
          <button
            onClick={handleDownloadReport}
            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            aria-label="Download ATS score report"
          >
            Download Report
          </button>
          <button
            onClick={handleDownloadReportPdf}
            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            aria-label="Download ATS score report as PDF"
          >
            Report PDF
          </button>
          {onExportResume && (
            <button
              onClick={handleDownloadBundle}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              aria-label="Download resume and ATS report bundle"
            >
              Bundle
            </button>
          )}
        </div>
      </div>

      <label htmlFor="role-preset" className="block text-sm font-medium text-gray-700 mb-1">
        Role Preset
      </label>
      <select
        id="role-preset"
        value={selectedPreset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="input-field mb-3"
        title="Choose a role preset to auto-fill a sample job description"
      >
        {ROLE_PRESETS.map((preset) => (
          <option key={preset.label} value={preset.label}>
            {preset.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 mb-3">
        <input
          id="ats-heatmap-toggle"
          type="checkbox"
          checked={heatmapEnabled}
          onChange={(e) => onToggleHeatmap?.(e.target.checked)}
          className="h-4 w-4 text-gray-600"
          title="Highlight job keywords inside the preview"
        />
        <label htmlFor="ats-heatmap-toggle" className="text-sm text-gray-700">
          Highlight keywords in preview
        </label>
      </div>

      <label htmlFor="job-description-input" className="block text-sm font-medium text-gray-700 mb-1">
        Job Description
      </label>
      <textarea
        id="job-description-input"
        value={jobDescription}
        onChange={(e) => onJobDescriptionChange(e.target.value)}
        className="textarea-field min-h-[140px]"
        placeholder="Paste the job description here to analyze keyword match..."
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
        lang="en-US"
        autoComplete="off"
        aria-describedby="job-description-help"
        title="Paste the job description to analyze ATS match"
      />
      <p id="job-description-help" className="sr-only">
        Paste a job description to generate an ATS score and keyword suggestions.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Match Summary</h3>
          <p className="text-sm text-gray-600">
            Keyword match: {formatPercent(analysis.matchRate)}
          </p>
          <p className="text-sm text-gray-600">
            Word count: {analysis.wordCount}
          </p>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden" aria-hidden="true">
              <div
                className="h-full bg-gray-600"
                style={{ width: `${Math.round(analysis.matchRate * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(253,224,71,0.45)]" />
              Preview highlight shows job keywords
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Breakdown: {analysis.keywordScore}/60 keywords, {analysis.completenessScore}/25 completeness, {analysis.formattingScore}/15 formatting
          </p>
        </div>

        {!!analysis.lengthWarnings.length && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Length Warnings</h3>
            <ul className="text-sm text-gray-600 space-y-1" role="list" aria-label="Length warnings">
              {analysis.lengthWarnings.map((item) => (
                <li key={item} role="listitem">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">ATS Checklist</h3>
          <ul className="text-sm text-gray-600 space-y-1" role="list" aria-label="ATS checklist">
            {analysis.checklist.map((item) => (
              <li key={item.label} role="listitem">
                {item.passed ? '✓' : '•'} {item.label}
              </li>
            ))}
          </ul>
        </div>

        {!!analysis.skillClusters.length && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Skill Clusters</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {analysis.skillClusters.map((cluster) => (
                <div key={cluster.canonical} className="flex items-center justify-between gap-2">
                  <span>
                    {cluster.canonical} (matched: {cluster.matchedSynonyms.join(', ')})
                  </span>
                  {cluster.shouldSuggestCanonical && onAddSkillKeyword && (
                    <button
                      onClick={() => handleAddKeyword(cluster.canonical)}
                      className="text-xs text-gray-700 hover:text-gray-900"
                      aria-label={`Add ${cluster.canonical} to skills`}
                    >
                      Add skill
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggestions</h3>
          <ul className="text-sm text-gray-600 space-y-1" role="list" aria-label="ATS score suggestions">
            {analysis.suggestions.map((item) => (
              <li key={item} role="listitem">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {!!analysis.atsTips.length && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Basic ATS Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1" role="list" aria-label="Basic ATS tips">
              {analysis.atsTips.map((item) => (
                <li key={item} role="listitem">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!analysis.missing.length && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-900">Missing Keywords</h3>
              {onAddAllSkillKeywords && (
                <button
                  onClick={handleAddAll}
                  className="text-xs text-gray-700 hover:text-gray-900"
                  aria-label="Add all missing keywords to skills"
                >
                  Add all to skills
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Missing keywords">
              {analysis.missing.slice(0, 12).map((word) => (
                <span
                  key={word}
                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center gap-1"
                  role="listitem"
                >
                  {word}
                  <button
                    onClick={() => handleCopyKeyword(word)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={`Copy ${word}`}
                  >
                    Copy
                  </button>
                  {onAddSkillKeyword && (
                    <button
                      onClick={() => handleAddKeyword(word)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={`Add ${word} to skills`}
                    >
                      Add
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {!!analysis.missingPhrases.length && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Missing Key Phrases</h3>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Missing key phrases">
              {analysis.missingPhrases.slice(0, 10).map((phrase) => (
                <span
                  key={phrase}
                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                  role="listitem"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}

        {!!analysis.matched.length && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Matched Keywords</h3>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Matched keywords">
              {analysis.matched.slice(0, 12).map((word) => (
                <span
                  key={word}
                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                  role="listitem"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {!!analysis.matchedPhrases.length && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Matched Key Phrases</h3>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Matched key phrases">
              {analysis.matchedPhrases.slice(0, 10).map((phrase) => (
                <span
                  key={phrase}
                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                  role="listitem"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
