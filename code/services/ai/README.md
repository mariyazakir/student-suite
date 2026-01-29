# AI Services Layer - Phase 3

## Overview

Complete AI service layer with prompt engineering, structured outputs, and mock responses for frontend development.

## Architecture

```
services/ai/
├── base.ts              # Base AI service class
├── prompts.ts           # Centralized prompt templates
├── job-parser.ts        # Job description parsing
├── resume-improver.ts   # Resume section improvements
├── project-improver.ts  # Project section improvements
├── ats-scorer.ts        # ATS scoring service
├── contracts.ts         # Input/output type contracts
├── mocks.ts             # Mock responses for testing
└── index.ts             # Central exports
```

## Services

### 1. Job Description Parser
**File:** `job-parser.ts`
**Input:** Raw job description text
**Output:** Structured `ParsedJobDescription`
**Features:**
- Extracts required/preferred skills
- Identifies keywords and phrases
- Determines experience level
- Extracts location and company

### 2. Resume Improver
**File:** `resume-improver.ts`
**Methods:**
- `improveExperience()` - Improves experience bullets
- `improveSummary()` - Optimizes professional summary
- `optimizeSkills()` - Optimizes skills section

### 3. Project Improver
**File:** `project-improver.ts`
**Method:**
- `improveProject()` - Enhances project descriptions

### 4. ATS Scorer
**File:** `ats-scorer.ts`
**Method:**
- `calculateATSScore()` - Calculates detailed ATS score

## Prompt Engineering

### Design Principles

1. **Job-Specific**: All prompts incorporate job description context
2. **Non-Generic**: Explicitly avoids generic phrases and filler text
3. **Quantified**: Always requests specific metrics and numbers
4. **Structured**: Returns consistent JSON format
5. **Reasoned**: Provides explanations for all changes

### Prompt Templates

All prompts are centralized in `prompts.ts`:

- `buildExperiencePrompt()` - Experience improvement
- `buildSummaryPrompt()` - Summary optimization
- `buildSkillsPrompt()` - Skills optimization
- `buildProjectsPrompt()` - Project enhancement
- `buildJobDescriptionParsePrompt()` - Job parsing
- `buildATSScoringPrompt()` - ATS scoring

## Input/Output Contracts

Type-safe contracts defined in `contracts.ts`:

- `JobDescriptionParserContract`
- `ExperienceImprovementContract`
- `SummaryImprovementContract`
- `SkillsOptimizationContract`
- `ProjectImprovementContract`
- `ATSScoringContract`

## Mock Responses

Mock responses in `mocks.ts` for:
- Frontend development without API costs
- Testing and demos
- Offline development

**Enable mock mode:**
```typescript
// Set environment variable
AI_MOCK_MODE=true
```

## API Endpoints

- `POST /api/ai/parse-job` - Parse job description
- `POST /api/ai/improve` - Improve resume sections
- `POST /api/ai/improve-project` - Improve project section
- `POST /api/scoring/ats` - Calculate ATS score

## Usage Examples

### Parse Job Description
```typescript
import { jobDescriptionParser } from '@/services/ai';

const parsed = await jobDescriptionParser.parseJobDescription(
  'Looking for Senior React Developer...'
);
```

### Improve Experience
```typescript
import { resumeImprover } from '@/services/ai';

const improved = await resumeImprover.improveExperience(
  {
    company: 'Tech Corp',
    position: 'Developer',
    location: 'SF',
    startDate: '2020-01',
    endDate: 'Present',
    achievements: ['Worked on website']
  },
  parsedJobDescription
);
```

### Calculate ATS Score
```typescript
import { atsScorer } from '@/services/ai';

const score = await atsScorer.calculateATSScore(
  resumeData,
  parsedJobDescription
);
```

## Environment Variables

- `AI_MOCK_MODE` - Set to 'true' to use mock responses

## Response Structure

All AI responses follow consistent structure:
```typescript
{
  // Improved content
  improvedContent: {...},
  
  // Keywords incorporated
  keywords: string[],
  
  // Explanation of changes
  reasoning: string
}
```

## Best Practices

1. Always provide job description context when available
2. Use structured prompts from `prompts.ts`
3. Validate inputs using contracts
4. Use mock mode for development
5. Handle errors gracefully
6. Log AI usage for monitoring
