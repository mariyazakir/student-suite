# Resume Builder SaaS - Architecture Design

## System Overview

Production-ready AI-powered resume builder with ATS optimization, real-time preview, and multi-format export capabilities.

## Tech Stack Decisions

**Frontend:**
- **Next.js 14+ (App Router)** - Server components, API routes, SSR/SSG
- **React 18+** - Component library
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type safety

**Backend:**
- **Next.js API Routes** - Unified full-stack framework
- **Prisma ORM** - Type-safe database access (PostgreSQL/SQLite)
- **Zod** - Runtime validation

**AI Integration:**
- **OpenAI API** - GPT-4 for content generation
- **Structured outputs** - JSON mode for consistent responses

**Storage:**
- **PostgreSQL** - Production database (SQLite for dev)
- **JSON columns** - Flexible resume data storage
- **File storage** - Local/S3 for exports

**Export:**
- **react-pdf** - PDF generation
- **docx** - DOCx generation

## Architecture Patterns

### 1. Modular Component Architecture
```
components/
  ├── resume/
  │   ├── sections/        # Individual resume sections
  │   ├── editor/          # Section editors
  │   ├── preview/         # Real-time preview
  │   └── ai-assistant/    # AI improvement UI
  ├── scoring/
  │   ├── ats-scorer/      # ATS scoring component
  │   └── recruiter-scorer/ # Recruiter scoring component
  └── export/
      └── export-options/  # Export controls
```

### 2. Data Flow
```
User Input → React State → JSON Schema → Database
                ↓
         Real-time Preview
                ↓
         AI Processing (on-demand)
                ↓
         Scoring Engine
                ↓
         Export Generation
```

### 3. API Structure
```
/api/
  ├── resume/
  │   ├── [id]/           # CRUD operations
  │   ├── [id]/sections/  # Section management
  │   ├── [id]/versions/  # Versioning
  │   └── [id]/export/    # Export generation
  ├── ai/
  │   ├── improve/        # Content improvement
  │   ├── parse-job/      # Job description parsing
  │   └── optimize/       # ATS optimization
  └── scoring/
      ├── ats/            # ATS scoring
      └── recruiter/      # Recruiter scoring
```

## Key Design Decisions

1. **JSON Storage**: Resume data stored as structured JSON for flexibility and easy versioning
2. **Real-time Preview**: React state sync with preview component (no API calls needed)
3. **On-demand AI**: AI processing triggered by user action, not automatic
4. **Versioning**: Immutable snapshots with metadata for rollback
5. **Scoring Separation**: ATS and recruiter scores calculated separately with explanations
6. **Modular Sections**: Each resume section is a self-contained component
7. **Type Safety**: TypeScript + Zod for end-to-end type safety

## Scalability Considerations

- **Database Indexing**: User ID, resume ID, version timestamps
- **Caching**: Redis for frequently accessed resumes (future)
- **Queue System**: Background jobs for AI processing (future)
- **CDN**: Static assets and exports
- **Rate Limiting**: Per-user AI API limits
- **Monetization Ready**: Usage tracking, subscription tiers
