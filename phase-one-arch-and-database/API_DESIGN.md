# API Design Documentation

## API Structure

All APIs follow RESTful conventions with Next.js API routes.

Base URL: `/api`

## Authentication

All endpoints require authentication (JWT or session-based).
Headers: `Authorization: Bearer <token>`

## Endpoints

### Resume Management

#### `GET /api/resume`
List all resumes for authenticated user.

**Response:**
```json
{
  "resumes": [
    {
      "id": "uuid",
      "title": "Software Engineer Resume",
      "currentVersionId": "uuid",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/resume`
Create a new resume.

**Request:**
```json
{
  "title": "Software Engineer Resume",
  "data": { ResumeData }
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Software Engineer Resume",
  "currentVersionId": "uuid",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### `GET /api/resume/[id]`
Get resume details.

**Response:**
```json
{
  "id": "uuid",
  "title": "Software Engineer Resume",
  "currentVersionId": "uuid",
  "jobDescription": "...",
  "currentVersion": { ResumeVersionResponse }
}
```

#### `PUT /api/resume/[id]`
Update resume metadata (title, job description).

**Request:**
```json
{
  "title": "Updated Title",
  "jobDescription": "..."
}
```

#### `DELETE /api/resume/[id]`
Delete resume and all versions.

---

### Resume Versions

#### `GET /api/resume/[id]/versions`
List all versions of a resume.

**Response:**
```json
{
  "versions": [
    {
      "id": "uuid",
      "versionNumber": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "changeSummary": "Initial version"
    }
  ]
}
```

#### `GET /api/resume/[id]/versions/[versionId]`
Get specific version.

**Response:**
```json
{ ResumeVersionResponse }
```

#### `POST /api/resume/[id]/versions`
Create new version from current data.

**Request:**
```json
{
  "data": { ResumeData },
  "changeSummary": "Updated experience section"
}
```

**Response:**
```json
{ ResumeVersionResponse }
```

#### `POST /api/resume/[id]/versions/[versionId]/restore`
Restore a previous version (creates new version from old data).

**Response:**
```json
{ ResumeVersionResponse }
```

---

### Resume Sections

#### `PUT /api/resume/[id]/sections/[section]`
Update a specific section.

**Request:**
```json
{
  "data": { /* section-specific data */ }
}
```

**Response:**
```json
{
  "success": true,
  "versionId": "uuid"
}
```

**Sections:**
- `personalInfo`
- `experience`
- `education`
- `skills`
- `certifications`
- `projects`
- `customSections/[id]`

---

### AI Services

#### `POST /api/ai/improve`
Improve a specific section using AI.

**Request:**
```json
{
  "resumeId": "uuid",
  "section": "experience.0",
  "currentContent": { /* current section data */ },
  "jobDescription": "..." // optional
}
```

**Response:**
```json
{
  "improvedContent": { /* improved section data */ },
  "reasoning": "Explanation of improvements",
  "keywords": ["keyword1", "keyword2"]
}
```

#### `POST /api/ai/parse-job`
Parse job description and extract keywords.

**Request:**
```json
{
  "jobDescription": "Full job description text..."
}
```

**Response:**
```json
{
  "parsedData": { ParsedJobDescription }
}
```

#### `POST /api/ai/optimize`
Optimize entire resume for job description.

**Request:**
```json
{
  "resumeId": "uuid",
  "jobDescription": "..."
}
```

**Response:**
```json
{
  "optimizedResume": { ResumeData },
  "changes": [
    {
      "section": "experience.0",
      "change": "Added quantified metrics",
      "reason": "Improves ATS score by 15 points"
    }
  ],
  "keywordImprovements": {
    "added": ["React", "TypeScript"],
    "removed": ["jQuery"],
    "repositioned": ["Node.js"]
  }
}
```

---

### Scoring

#### `POST /api/scoring/ats`
Calculate ATS score.

**Request:**
```json
{
  "resumeId": "uuid",
  "versionId": "uuid", // optional, uses current if not provided
  "jobDescription": "..." // optional, uses resume's JD if not provided
}
```

**Response:**
```json
{
  "score": { ATSScoreDetails },
  "versionId": "uuid"
}
```

#### `POST /api/scoring/recruiter`
Calculate recruiter score.

**Request:**
```json
{
  "resumeId": "uuid",
  "versionId": "uuid"
}
```

**Response:**
```json
{
  "score": { RecruiterScoreDetails },
  "versionId": "uuid"
}
```

#### `POST /api/scoring/both`
Calculate both scores at once.

**Response:**
```json
{
  "ats": { ATSScoreDetails },
  "recruiter": { RecruiterScoreDetails },
  "versionId": "uuid"
}
```

---

### Export

#### `POST /api/resume/[id]/export`
Generate export file.

**Request:**
```json
{
  "format": "pdf" | "docx",
  "versionId": "uuid", // optional
  "options": {
    "includeScores": false,
    "template": "modern" | "classic" | "ats-optimized"
  }
}
```

**Response:**
- Binary file (PDF or DOCx)
- Headers: `Content-Type: application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `Content-Disposition: attachment; filename="resume.pdf"`

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // optional additional details
  }
}
```

**Error Codes:**
- `UNAUTHORIZED` - 401
- `NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `AI_ERROR` - 500
- `RATE_LIMIT_EXCEEDED` - 429
- `INTERNAL_ERROR` - 500

## Rate Limiting

- Free tier: 10 AI requests/day
- Pro tier: 100 AI requests/day
- Enterprise: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Validation

All inputs validated using Zod schemas (see TYPES.ts).

## Response Times

- CRUD operations: < 200ms
- AI improvements: 2-5s
- Scoring: < 1s
- Export generation: 1-3s
