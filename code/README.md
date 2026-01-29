# Resume Builder SaaS - Phase 2 Implementation

## Overview

Phase 2 implements the core backend infrastructure:
- Resume data model with validation
- Prisma database client setup
- RESTful API routes for resume CRUD operations
- AI service layer (no UI yet)

## Project Structure

```
code/
├── app/
│   └── api/
│       ├── resume/              # Resume CRUD endpoints
│       └── ai/                   # AI service endpoints
├── lib/
│   ├── db/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── models/
│   │   └── resume.ts            # Resume business logic
│   ├── validation/
│   │   └── resume-schema.ts    # Zod validation schemas
│   └── api/
│       ├── errors.ts            # Error handling
│       └── middleware.ts       # API middleware
├── services/
│   └── ai/
│       ├── base.ts              # AI service base class
│       ├── job-parser.ts        # Job description parser
│       ├── resume-improver.ts   # Resume improvement service
│       └── index.ts             # AI services export
├── types/
│   └── index.ts                 # TypeScript type definitions
└── package.json
```

## Key Files Explained

### `lib/db/prisma.ts`
- Prisma client singleton pattern
- Prevents multiple instances in development (hot reload)
- Configures logging based on environment

### `lib/models/resume.ts`
- Business logic for resume operations
- Handles CRUD, versioning, and data transformations
- Ensures data validation before database operations
- Implements ownership checks for security

### `lib/validation/resume-schema.ts`
- Zod schemas for runtime validation
- Validates all resume data before storage
- Provides type-safe validation functions

### `lib/api/errors.ts`
- Standardized error classes
- Consistent error response format
- Handles Zod validation errors

### `lib/api/middleware.ts`
- Authentication middleware (JWT bearer tokens)
- Error handling wrapper
- Request parsing utilities

### `app/api/resume/route.ts`
- GET: List all resumes for user
- POST: Create new resume with initial version

### `app/api/resume/[id]/route.ts`
- GET: Get resume details with current version
- PUT: Update resume metadata
- DELETE: Delete resume

### `app/api/resume/[id]/versions/route.ts`
- GET: List all versions
- POST: Create new version

### `services/ai/base.ts`
- Base class for AI services
- Structured output handling
- System prompt definitions

### `services/ai/job-parser.ts`
- Parses job descriptions
- Extracts structured data (skills, keywords, etc.)
- Returns ParsedJobDescription type

### `services/ai/resume-improver.ts`
- Improves experience sections
- Optimizes professional summary
- Optimizes skills section
- All with reasoning and keyword extraction

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   - Set `JWT_SECRET` for auth token signing

3. **Set up database:**
   ```bash
   # Copy schema from phase-one-arch-and-database/schema.prisma
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (development)
   npm run db:push
   
   # Or create migration (production)
   npm run db:migrate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Resume Management
- `GET /api/resume` - List resumes
- `POST /api/resume` - Create resume
- `GET /api/resume/[id]` - Get resume
- `PUT /api/resume/[id]` - Update resume
- `DELETE /api/resume/[id]` - Delete resume

### Versions
- `GET /api/resume/[id]/versions` - List versions
- `POST /api/resume/[id]/versions` - Create version
- `GET /api/resume/[id]/versions/[versionId]` - Get version
- `POST /api/resume/[id]/versions/[versionId]/restore` - Restore version

### AI Services
- `POST /api/ai/parse-job` - Parse job description
- `POST /api/ai/improve` - Improve resume section

### Authentication
- `POST /api/auth/register` - Create user + return token
- `POST /api/auth/login` - Login + return token
- `GET /api/auth/me` - Get current user info

## Next Steps (Phase 3)

- Implement authentication (JWT/sessions)
- Add rate limiting per subscription tier
- Build UI components
- Implement real-time preview
- Add scoring engine
- Implement export functionality

## Notes

- Authentication is currently a placeholder (x-user-id header)
- Rate limiting not yet implemented
- Database schema matches Phase 1 design
