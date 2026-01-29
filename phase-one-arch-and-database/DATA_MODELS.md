# Data Models & Schema

## Core Data Models

### 1. User Model
```typescript
{
  id: string (UUID)
  email: string (unique)
  name: string
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2. Resume Model
```typescript
{
  id: string (UUID)
  userId: string (FK)
  title: string
  currentVersionId: string (FK to ResumeVersion)
  jobDescription?: string (for ATS optimization)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 3. ResumeVersion Model (Immutable Snapshots)
```typescript
{
  id: string (UUID)
  resumeId: string (FK)
  versionNumber: number
  data: ResumeData (JSON)
  metadata: {
    createdAt: DateTime
    createdBy: string (userId)
    changeSummary?: string
    aiOptimized: boolean
    jobDescriptionId?: string (if optimized for specific JD)
  }
  atsScore?: number
  recruiterScore?: number
  scores?: {
    ats: ATSScoreDetails
    recruiter: RecruiterScoreDetails
  }
}
```

### 4. ResumeData Schema (JSON Structure)
```typescript
{
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedIn?: string
    portfolio?: string
    summary?: string
  }
  experience: Array<{
    id: string
    company: string
    position: string
    location: string
    startDate: string (YYYY-MM)
    endDate: string | 'Present'
    achievements: Array<string> // Quantified bullets
    keywords: Array<string> // Extracted keywords
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    location: string
    graduationDate: string (YYYY-MM)
    gpa?: string
    honors?: Array<string>
  }>
  skills: {
    technical: Array<string>
    soft: Array<string>
    languages?: Array<{
      language: string
      proficiency: string
    }>
  }
  certifications: Array<{
    id: string
    name: string
    issuer: string
    date: string
    expiryDate?: string
  }>
  projects: Array<{
    id: string
    name: string
    description: string
    technologies: Array<string>
    url?: string
    achievements: Array<string>
  }>
  customSections?: Array<{
    id: string
    title: string
    items: Array<any>
  }>
}
```

### 5. JobDescription Model
```typescript
{
  id: string (UUID)
  resumeId: string (FK)
  content: string
  parsedData: {
    title: string
    company?: string
    requiredSkills: Array<string>
    preferredSkills: Array<string>
    keywords: Array<string>
    experienceLevel?: string
    location?: string
  }
  createdAt: DateTime
}
```

### 6. ATSScoreDetails Schema
```typescript
{
  overallScore: number (0-100)
  keywordMatch: {
    score: number
    matched: Array<string>
    missing: Array<string>
    explanation: string
  }
  formatCompliance: {
    score: number
    issues: Array<string>
    explanation: string
  }
  contentQuality: {
    score: number
    strengths: Array<string>
    weaknesses: Array<string>
    explanation: string
  }
  recommendations: Array<string>
}
```

### 7. RecruiterScoreDetails Schema
```typescript
{
  overallScore: number (0-100)
  impact: {
    score: number
    explanation: string
    examples: Array<string>
  }
  clarity: {
    score: number
    explanation: string
  }
  relevance: {
    score: number
    explanation: string
  }
  professionalism: {
    score: number
    explanation: string
  }
  recommendations: Array<string>
}
```

### 8. AIImprovementHistory Model
```typescript
{
  id: string (UUID)
  resumeVersionId: string (FK)
  section: string
  originalContent: string
  improvedContent: string
  prompt: string
  reasoning: string
  createdAt: DateTime
}
```

## Database Schema (Prisma)

See `schema.prisma` for complete database schema definition.

## Key Design Decisions

1. **Immutable Versions**: Each version is a snapshot, enabling rollback and history
2. **JSON Resume Data**: Flexible structure allows custom sections without schema changes
3. **Separate Scoring**: ATS and recruiter scores stored separately with detailed breakdowns
4. **Job Description Linking**: Versions can be linked to specific job descriptions for optimization
5. **AI History Tracking**: All AI improvements logged for transparency and learning
6. **Normalized User Data**: Users separate from resumes for multi-resume support
