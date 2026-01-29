# ATS & Recruiter Scoring Engine

## Overview

Dual scoring system that evaluates resumes from both ATS (Applicant Tracking System) and human recruiter perspectives.

## ATS Scoring Algorithm

### Components (Weighted)

1. **Keyword Match (40%)**
   - Required skills match: 20 points
   - Preferred skills match: 10 points
   - Industry keywords: 10 points
   - Scoring: (matched / total) * weight

2. **Format Compliance (30%)**
   - ATS-friendly formatting: 15 points
   - No complex tables/graphics: 10 points
   - Standard section headers: 5 points

3. **Content Quality (30%)**
   - Quantified achievements: 15 points
   - Action verbs usage: 10 points
   - No generic phrases: 5 points

### Implementation Logic

```typescript
interface ATSScoringInput {
  resumeData: ResumeData;
  jobDescription: ParsedJobDescription;
}

function calculateATSScore(input: ATSScoringInput): ATSScoreDetails {
  const { resumeData, jobDescription } = input;
  
  // 1. Keyword Matching
  const allResumeText = extractAllText(resumeData);
  const requiredMatches = findMatches(
    allResumeText,
    jobDescription.requiredSkills
  );
  const preferredMatches = findMatches(
    allResumeText,
    jobDescription.preferredSkills
  );
  const keywordMatches = findMatches(
    allResumeText,
    jobDescription.keywords
  );
  
  const keywordScore = (
    (requiredMatches.length / jobDescription.requiredSkills.length) * 20 +
    (preferredMatches.length / jobDescription.preferredSkills.length) * 10 +
    (keywordMatches.length / jobDescription.keywords.length) * 10
  );
  
  // 2. Format Compliance
  const formatIssues = checkFormatCompliance(resumeData);
  const formatScore = 30 - (formatIssues.length * 2); // Max 2 points per issue
  
  // 3. Content Quality
  const quantifiedCount = countQuantifiedAchievements(resumeData);
  const actionVerbCount = countActionVerbs(resumeData);
  const genericPhraseCount = countGenericPhrases(resumeData);
  
  const contentScore = (
    Math.min(quantifiedCount / 5, 1) * 15 + // Max 5 quantified = full points
    Math.min(actionVerbCount / 10, 1) * 10 + // Max 10 action verbs
    Math.max(0, 5 - genericPhraseCount) // Penalty for generic phrases
  );
  
  const overallScore = keywordScore + formatScore + contentScore;
  
  return {
    overallScore: Math.round(overallScore),
    keywordMatch: {
      score: Math.round(keywordScore),
      matched: [...requiredMatches, ...preferredMatches, ...keywordMatches],
      missing: findMissingKeywords(jobDescription, allResumeText),
      explanation: generateKeywordExplanation(requiredMatches, preferredMatches, keywordMatches)
    },
    formatCompliance: {
      score: Math.round(formatScore),
      issues: formatIssues,
      explanation: generateFormatExplanation(formatIssues)
    },
    contentQuality: {
      score: Math.round(contentScore),
      strengths: identifyStrengths(resumeData),
      weaknesses: identifyWeaknesses(resumeData),
      explanation: generateContentExplanation(quantifiedCount, actionVerbCount, genericPhraseCount)
    },
    recommendations: generateRecommendations(keywordScore, formatScore, contentScore)
  };
}
```

## Recruiter Scoring Algorithm

### Components (Weighted)

1. **Impact (35%)**
   - Quantified achievements: 20 points
   - Leadership/initiative examples: 15 points

2. **Clarity (25%)**
   - Clear, concise writing: 15 points
   - Logical flow: 10 points

3. **Relevance (25%)**
   - Experience alignment: 15 points
   - Skills alignment: 10 points

4. **Professionalism (15%)**
   - No errors: 10 points
   - Professional tone: 5 points

### Implementation Logic

```typescript
function calculateRecruiterScore(input: ATSScoringInput): RecruiterScoreDetails {
  const { resumeData, jobDescription } = input;
  
  // 1. Impact Score
  const quantifiedAchievements = countQuantifiedAchievements(resumeData);
  const leadershipExamples = findLeadershipExamples(resumeData);
  const impactScore = (
    Math.min(quantifiedAchievements / 8, 1) * 20 + // Max 8 quantified
    Math.min(leadershipExamples / 3, 1) * 15 // Max 3 leadership examples
  );
  
  // 2. Clarity Score
  const avgBulletLength = calculateAvgBulletLength(resumeData);
  const readabilityScore = assessReadability(resumeData);
  const clarityScore = (
    (avgBulletLength <= 20 ? 15 : Math.max(0, 15 - (avgBulletLength - 20) * 0.5)) +
    readabilityScore * 10
  );
  
  // 3. Relevance Score
  const experienceAlignment = calculateExperienceAlignment(resumeData, jobDescription);
  const skillsAlignment = calculateSkillsAlignment(resumeData, jobDescription);
  const relevanceScore = experienceAlignment * 15 + skillsAlignment * 10;
  
  // 4. Professionalism Score
  const errors = findErrors(resumeData); // Grammar, spelling, formatting
  const toneScore = assessProfessionalTone(resumeData);
  const professionalismScore = (
    Math.max(0, 10 - errors.length * 2) + // -2 points per error
    toneScore * 5
  );
  
  const overallScore = impactScore + clarityScore + relevanceScore + professionalismScore;
  
  return {
    overallScore: Math.round(overallScore),
    impact: {
      score: Math.round(impactScore),
      explanation: generateImpactExplanation(quantifiedAchievements, leadershipExamples),
      examples: extractTopAchievements(resumeData, 3)
    },
    clarity: {
      score: Math.round(clarityScore),
      explanation: generateClarityExplanation(avgBulletLength, readabilityScore)
    },
    relevance: {
      score: Math.round(relevanceScore),
      explanation: generateRelevanceExplanation(experienceAlignment, skillsAlignment)
    },
    professionalism: {
      score: Math.round(professionalismScore),
      explanation: generateProfessionalismExplanation(errors, toneScore)
    },
    recommendations: generateRecruiterRecommendations(impactScore, clarityScore, relevanceScore, professionalismScore)
  };
}
```

## Helper Functions

### Keyword Matching
```typescript
function findMatches(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase()) ||
    lowerText.includes(keyword.toLowerCase().replace(/\s+/g, ''))
  );
}
```

### Quantified Achievement Detection
```typescript
function countQuantifiedAchievements(resumeData: ResumeData): number {
  const quantifiers = /\d+%|\d+\+|\$\d+[KM]?|\d+\s*(years?|months?|people|users|customers|projects|%|x|times)/gi;
  let count = 0;
  
  resumeData.experience.forEach(exp => {
    exp.achievements.forEach(achievement => {
      if (quantifiers.test(achievement)) count++;
    });
  });
  
  return count;
}
```

### Action Verb Detection
```typescript
const ACTION_VERBS = [
  'led', 'managed', 'increased', 'reduced', 'improved', 'built', 'created',
  'developed', 'implemented', 'designed', 'optimized', 'achieved', 'delivered',
  'executed', 'launched', 'established', 'transformed', 'streamlined'
];

function countActionVerbs(resumeData: ResumeData): number {
  let count = 0;
  const allText = extractAllText(resumeData).toLowerCase();
  
  ACTION_VERBS.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches) count += matches.length;
  });
  
  return count;
}
```

### Generic Phrase Detection
```typescript
const GENERIC_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'assisted with',
  'team player', 'hardworking', 'detail-oriented', 'results-driven',
  'proven track record', 'strong communication skills'
];

function countGenericPhrases(resumeData: ResumeData): number {
  let count = 0;
  const allText = extractAllText(resumeData).toLowerCase();
  
  GENERIC_PHRASES.forEach(phrase => {
    if (allText.includes(phrase)) count++;
  });
  
  return count;
}
```

## Score Explanation Generation

Each score component includes an explanation that:
1. States the current score
2. Identifies strengths
3. Identifies weaknesses
4. Provides actionable recommendations
5. Uses plain language (not technical jargon)

## Integration Points

- Scores calculated on-demand when user requests
- Cached with resume version for performance
- Recalculated when resume or job description changes
- Displayed with visual indicators (color-coded scores)
- Recommendations shown as actionable items
