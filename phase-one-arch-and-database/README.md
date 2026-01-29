# Phase 1: Architecture & Database

## Overview

This phase defines the complete architecture, data models, and design decisions for the AI-powered Resume Builder SaaS.

## Files

1. **ARCHITECTURE.md** - System architecture, tech stack, and design patterns
2. **DATA_MODELS.md** - Data models, schemas, and relationships
3. **schema.prisma** - Database schema definition
4. **TYPES.ts** - TypeScript type definitions
5. **AI_PROMPTS.md** - AI prompt templates and behavior rules
6. **SCORING_LOGIC.md** - ATS and recruiter scoring algorithms
7. **API_DESIGN.md** - Complete API endpoint documentation

## Key Design Decisions

### 1. Next.js Full-Stack
- **Decision**: Use Next.js for both frontend and backend
- **Rationale**: Unified framework, server components, API routes, excellent DX
- **Trade-off**: Monolithic structure, but acceptable for SaaS at this scale

### 2. JSON Resume Storage
- **Decision**: Store resume data as JSON in database
- **Rationale**: Flexibility for custom sections, easy versioning, no schema migrations for new fields
- **Trade-off**: Less queryable, but acceptable for resume data structure

### 3. Immutable Versioning
- **Decision**: Each version is a complete snapshot
- **Rationale**: Enables rollback, history tracking, and score comparison
- **Trade-off**: Storage overhead, but enables powerful features

### 4. Dual Scoring System
- **Decision**: Separate ATS and recruiter scores
- **Rationale**: Different optimization strategies, provides comprehensive feedback
- **Trade-off**: More complex, but better user value

### 5. On-Demand AI Processing
- **Decision**: AI improvements triggered by user action
- **Rationale**: Cost control, user control, better UX (no surprises)
- **Trade-off**: Requires explicit user action, but more predictable

### 6. Modular Component Architecture
- **Decision**: Section-based component structure
- **Rationale**: Reusability, maintainability, easier testing
- **Trade-off**: More files, but better organization

## Database Schema Highlights

- **Users**: Authentication and subscription management
- **Resumes**: Container for resume data and metadata
- **ResumeVersions**: Immutable snapshots with scoring data
- **JobDescriptions**: Parsed job descriptions for optimization
- **AIImprovementHistory**: Audit trail of all AI changes

## Next Steps (Phase 2)

1. Set up Next.js project with TypeScript
2. Configure Prisma and database
3. Implement authentication
4. Build core UI components
5. Create resume editor components
6. Implement real-time preview
7. Integrate AI services
8. Build scoring engine
9. Add export functionality
10. Implement versioning system

## Scalability Considerations

- Database indexes on frequently queried fields
- Caching strategy for resume data (future)
- Queue system for AI processing (future)
- CDN for static assets and exports
- Rate limiting per subscription tier
- Usage tracking for monetization

## Monetization Readiness

- Subscription tiers defined in User model
- Rate limiting structure in place
- Usage tracking capability (AI requests, exports)
- Multi-resume support per user
- Version history (premium feature)
