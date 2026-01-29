# Phase 2 Implementation - Beginner's Guide

## 🏗️ Understanding the Folder Structure

Think of the folder structure like organizing a restaurant:

```
code/
├── app/api/              ← The "Waiters" (API Routes)
│   ├── resume/           ← Handle resume requests
│   └── ai/               ← Handle AI requests
│
├── lib/                  ← The "Kitchen Staff" (Business Logic)
│   ├── db/               ← Database connection
│   ├── models/           ← How to work with data
│   ├── validation/      ← Check if data is correct
│   └── api/              ← Helper tools for API
│
├── services/             ← Specialized "Chefs" (AI Services)
│   └── ai/               ← AI processing
│
├── types/                ← "Recipe Cards" (Type Definitions)
│
└── prisma/               ← "Storage Room Layout" (Database Schema)
```

### Simple Explanation:
- **app/api/** = Where requests come in (like a restaurant's front door)
- **lib/** = Where the actual work happens (like the kitchen)
- **services/** = Specialized workers (like a pastry chef)
- **types/** = Rules about what data should look like
- **prisma/** = The blueprint of your database

---

## 📁 What Each Major File Does

### 1. API Routes (The "Waiters")

#### `app/api/resume/route.ts`
**What it does:** Handles requests to list or create resumes

**Think of it like:** A waiter taking your order

```typescript
// When someone visits GET /api/resume
// This file says: "Get all resumes for this user"

// When someone sends POST /api/resume
// This file says: "Create a new resume"
```

**Key functions:**
- `GET` - "Show me all my resumes"
- `POST` - "Create a new resume"

---

#### `app/api/resume/[id]/route.ts`
**What it does:** Handles requests for a specific resume

**Think of it like:** A waiter handling a specific table

```typescript
// GET /api/resume/123
// "Show me resume #123"

// PUT /api/resume/123
// "Update resume #123"

// DELETE /api/resume/123
// "Delete resume #123"
```

**Key functions:**
- `GET` - Get one resume
- `PUT` - Update resume title/description
- `DELETE` - Remove resume

---

#### `app/api/resume/[id]/versions/route.ts`
**What it does:** Manages different versions of a resume

**Think of it like:** Keeping track of recipe revisions

```typescript
// GET /api/resume/123/versions
// "Show me all versions of resume #123"

// POST /api/resume/123/versions
// "Save a new version of resume #123"
```

**Why versions matter:** Like saving different drafts of a document

---

#### `app/api/resume/[id]/versions/[versionId]/route.ts`
**What it does:** Handles specific version operations

**Think of it like:** Looking at or restoring an old recipe version

```typescript
// GET /api/resume/123/versions/version-456
// "Show me the details of version #456"

// POST /api/resume/123/versions/version-456/restore
// "Restore version #456 (creates a new version from old data)"
```

**Key functions:**
- `GET` - Get specific version details (with full resume data)
- `POST /restore` - Restore an old version (creates new version from old data)

**Why restore matters:** Like "undo" - you can go back to a previous version without losing current work

---

#### `app/api/ai/parse-job/route.ts`
**What it does:** Parses job descriptions using AI

**Think of it like:** A smart assistant that reads job postings and extracts key info

```typescript
// POST /api/ai/parse-job
// Input: "Looking for Senior React Developer..."
// Output: {
//   title: "Senior React Developer",
//   requiredSkills: ["React", "TypeScript"],
//   keywords: [...]
// }
```

**What it does:**
- Takes raw job description text
- Uses AI to extract structured data
- Returns skills, keywords, requirements
- Helps match resume to job

**Why it's useful:** Saves time manually reading job descriptions

---

#### `app/api/ai/improve/route.ts`
**What it does:** Improves resume sections using AI

**Think of it like:** A writing coach that improves your resume

```typescript
// POST /api/ai/improve
// Input: {
//   section: "experience",
//   currentContent: { company: "...", achievements: [...] },
//   jobDescription: {...}
// }
// Output: {
//   improvedContent: { improvedAchievements: [...] },
//   reasoning: "Added metrics and keywords...",
//   keywords: ["React", "TypeScript"]
// }
```

**What it can improve:**
- Experience bullets (makes them more impactful)
- Professional summary (optimizes for keywords)
- Skills section (matches job requirements)

**Key features:**
- Always provides reasoning for changes
- Extracts keywords that were added
- Never generates generic text
- Always quantifies achievements

---

### 2. Business Logic (The "Kitchen")

#### `lib/models/resume.ts`
**What it does:** Contains all the functions that actually work with resumes

**Think of it like:** The actual cooking recipes

**Key functions explained:**

```typescript
// 1. createResume()
//    - Takes user ID, title, and resume data
//    - Validates the data
//    - Saves to database
//    - Creates first version automatically

// 2. getResumeById()
//    - Finds a resume by its ID
//    - Checks if user owns it (security!)
//    - Returns resume with current version

// 3. createResumeVersion()
//    - Creates a new snapshot of resume
//    - Like "Save As" in a document
//    - Old versions stay unchanged

// 4. deleteResume()
//    - Removes resume and all versions
//    - Checks ownership first

// 5. getResumeVersion()
//    - Gets a specific version by ID
//    - Checks ownership through resume
//    - Returns full version data

// 6. getResumeVersions()
//    - Lists all versions for a resume
//    - Ordered by version number (newest first)
//    - Returns version metadata and scores

// 7. restoreResumeVersion()
//    - Takes old version data
//    - Creates NEW version from old data
//    - Like "Save As" from an old file
//    - Doesn't delete current version
```

**Why it's separate:** Keeps API routes clean. API routes just receive requests and call these functions.

**How functions work together:**
```typescript
// Example: Creating a new version
1. createResumeVersion() is called
2. It calls getResumeVersions() to find latest version number
3. It validates data using validateResumeData()
4. It creates new version in database
5. It updates resume's currentVersionId
```

---

#### `lib/validation/resume-schema.ts`
**What it does:** Checks if resume data is valid before saving

**Think of it like:** A quality checker before food goes out

**Example:**
```typescript
// Bad data (will be rejected):
{
  email: "not-an-email",  // ❌ Not a valid email
  phone: "",              // ❌ Empty phone number
}

// Good data (will be accepted):
{
  email: "john@example.com",  // ✅ Valid email
  phone: "123-456-7890",      // ✅ Has phone number
}
```

**Key functions:**
- `validateResumeData()` - Throws error if invalid
- `safeValidateResumeData()` - Returns success/failure without throwing

---

#### `lib/db/prisma.ts`
**What it does:** Creates a connection to the database

**Think of it like:** The phone line to the storage room

**Why singleton pattern?**
```typescript
// BAD: Creating new connection every time
// (Like calling the storage room 100 times)

// GOOD: Reuse one connection
// (Like having a direct line that stays open)
```

**What it does:**
- Creates ONE database connection
- Reuses it everywhere
- Prevents connection overload

---

### 3. Error Handling

#### `lib/api/errors.ts`
**What it does:** Standardized error messages

**Think of it like:** A consistent way to say "something went wrong"

**Error types:**
```typescript
NotFoundError      // "Resume #123 doesn't exist"
UnauthorizedError  // "You're not allowed to do this"
ValidationError   // "Your data is invalid"
RateLimitError    // "You've made too many requests"
```

**Why it matters:** Consistent error format makes debugging easier

---

#### `lib/api/middleware.ts`
**What it does:** Helper functions for all API routes

**Key functions:**

```typescript
// 1. requireAuth()
//    - Checks if user is logged in
//    - Returns user ID if valid
//    - Throws error if not

// 2. withErrorHandler()
//    - Wraps API functions
//    - Catches any errors
//    - Returns nice error messages

// 3. parseJSONBody()
//    - Safely reads request body
//    - Handles errors gracefully
```

**Example usage:**
```typescript
// Without middleware (messy):
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) throw new Error('Not authorized');
    // ... rest of code
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// With middleware (clean):
export const GET = withErrorHandler(async (request) => {
  const userId = requireAuth(request);  // Handles auth automatically
  // ... rest of code (errors handled automatically)
});
```

---

### 4. AI Services

#### `services/ai/base.ts`
**What it does:** Base class for all AI operations

**Think of it like:** A template for AI workers

**What it provides:**
- Standard way to call AI
- Error handling for AI calls
- System prompts (rules for AI)

---

#### `services/ai/job-parser.ts`
**What it does:** Reads job descriptions and extracts important info

**Input:**
```
"Looking for a Senior React Developer with 5+ years experience.
Must know TypeScript, Node.js, and AWS..."
```

**Output:**
```json
{
  "title": "Senior React Developer",
  "requiredSkills": ["React", "TypeScript", "Node.js"],
  "keywords": ["5+ years", "AWS", "Senior"]
}
```

**Why it's useful:** Helps match resume to job requirements

---

#### `services/ai/resume-improver.ts`
**What it does:** Improves resume content using AI

**What it can improve:**
1. **Experience bullets** - Makes them more impactful
2. **Professional summary** - Optimizes for keywords
3. **Skills section** - Matches job requirements

**Example:**
```typescript
// Before:
"Worked on website"

// After (AI improved):
"Increased website traffic by 40% through SEO optimization"
```

**Key features:**
- Always quantifies achievements
- Uses action verbs
- Incorporates job keywords
- Provides reasoning for changes

---

#### `services/ai/index.ts`
**What it does:** Exports all AI services in one place

**Think of it like:** A directory that lists all AI services

**Why it exists:** Makes imports cleaner
```typescript
// Instead of:
import { jobDescriptionParser } from '@/services/ai/job-parser';
import { resumeImprover } from '@/services/ai/resume-improver';

// You can do:
import { jobDescriptionParser, resumeImprover } from '@/services/ai';
```

---

### 5. Type Definitions

#### `types/index.ts`
**What it does:** Defines what data structures should look like

**Think of it like:** A blueprint for data

**Example:**
```typescript
// This says: "A PersonalInfo must have these fields"
interface PersonalInfo {
  fullName: string;    // Required
  email: string;       // Required
  phone: string;       // Required
  linkedIn?: string;   // Optional (the ? means optional)
}
```

**Why it matters:**
- TypeScript catches errors before code runs
- Makes code self-documenting
- Prevents bugs

---

### 6. Database Schema

#### `prisma/schema.prisma`
**What it does:** Defines database structure

**Think of it like:** The blueprint of your storage room

**What it defines:**
- What tables exist (User, Resume, ResumeVersion, etc.)
- What columns each table has
- How tables relate to each other

**Example:**
```prisma
model Resume {
  id              String    @id        // Primary key
  userId          String               // Who owns it
  title           String               // Resume title
  currentVersionId String?             // Latest version
  createdAt       DateTime  @default(now())
  
  user            User      @relation(...)  // Link to User table
  versions        ResumeVersion[]           // Link to versions
}
```

---

## 🔄 How Data Flows: API → Database

Let's trace a complete example: **Creating a Resume**

### Step 1: User Makes Request
```
User sends: POST /api/resume
Body: {
  title: "My Resume",
  data: { personalInfo: {...}, experience: [...] }
}
```

### Step 2: API Route Receives Request
**File:** `app/api/resume/route.ts`

```typescript
export const POST = withErrorHandler(async (request) => {
  // 1. Check authentication
  const userId = requireAuth(request);
  
  // 2. Read request body
  const body = await parseJSONBody(request);
  
  // 3. Call business logic function
  const { resume, version } = await createResume(
    userId,
    body.title,
    body.data
  );
  
  // 4. Return response
  return NextResponse.json({ id: resume.id, ... });
});
```

**What happens:**
1. ✅ Checks if user is logged in
2. ✅ Reads the JSON data
3. ✅ Calls the model function
4. ✅ Returns the result

---

### Step 3: Business Logic Validates Data
**File:** `lib/models/resume.ts`

```typescript
export async function createResume(userId, title, data) {
  // 1. VALIDATE data
  const validatedData = validateResumeData(data);
  //    ↑ This uses lib/validation/resume-schema.ts
  //    ↑ Throws error if data is invalid
  
  // 2. SAVE to database (in a transaction)
  const result = await prisma.$transaction(async (tx) => {
    // Create resume record
    const resume = await tx.resume.create({ ... });
    
    // Create first version
    const version = await tx.resumeVersion.create({ ... });
    
    // Link them together
    await tx.resume.update({
      where: { id: resume.id },
      data: { currentVersionId: version.id }
    });
    
    return { resume, version };
  });
  
  return result;
}
```

**What happens:**
1. ✅ Validates data structure
2. ✅ Creates resume in database
3. ✅ Creates first version
4. ✅ Links them together
5. ✅ Returns both records

---

### Step 4: Validation Layer Checks Data
**File:** `lib/validation/resume-schema.ts`

```typescript
export function validateResumeData(data: unknown): ResumeData {
  // Uses Zod schema to check:
  // - Is email valid?
  // - Are required fields present?
  // - Are dates in correct format?
  // - etc.
  
  return ResumeDataSchema.parse(data);
  // ↑ Throws error if invalid
  // ↑ Returns typed data if valid
}
```

**What happens:**
1. ✅ Checks every field
2. ✅ Validates formats (email, dates, etc.)
3. ✅ Throws detailed errors if invalid
4. ✅ Returns clean data if valid

---

### Step 5: Database Layer Saves Data
**File:** `lib/db/prisma.ts` (connection) + Prisma ORM

```typescript
// Prisma automatically:
// 1. Connects to database
// 2. Runs SQL queries
// 3. Converts JSON to database format
// 4. Returns results

await prisma.resume.create({
  data: {
    id: "uuid-123",
    userId: "user-456",
    title: "My Resume",
    // ... other fields
  }
});
```

**What happens in database:**
```sql
-- Prisma generates and runs:
INSERT INTO "Resume" (id, userId, title, createdAt)
VALUES ('uuid-123', 'user-456', 'My Resume', NOW());
```

---

### Step 6: Response Flows Back

```
Database → Model → API Route → User
```

**Response:**
```json
{
  "id": "uuid-123",
  "title": "My Resume",
  "currentVersionId": "version-789",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 🎯 Complete Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ POST /api/resume
       │ { title, data }
       ▼
┌─────────────────────┐
│  API Route          │
│  route.ts           │
│  - Check auth       │
│  - Parse body       │
└──────┬──────────────┘
       │ createResume()
       ▼
┌─────────────────────┐
│  Model Layer         │
│  resume.ts           │
│  - Validate data     │
│  - Business logic    │
└──────┬──────────────┘
       │ validateResumeData()
       ▼
┌─────────────────────┐
│  Validation          │
│  resume-schema.ts    │
│  - Check structure   │
│  - Check formats     │
└──────┬──────────────┘
       │ (if valid)
       ▼
┌─────────────────────┐
│  Database            │
│  prisma.ts           │
│  - Save to DB        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  PostgreSQL/SQLite   │
│  (Actual Database)   │
└─────────────────────┘
```

---

## 🔑 Key Concepts Explained Simply

### 1. **Separation of Concerns**
**What it means:** Each file has one job

- API routes = Handle HTTP requests
- Models = Work with data
- Validation = Check data
- Database = Store data

**Why:** Easier to understand, test, and fix

---

### 2. **Type Safety**
**What it means:** TypeScript knows what data looks like

```typescript
// TypeScript knows this is wrong:
const email: string = 123;  // ❌ Error!

// TypeScript knows this is right:
const email: string = "john@example.com";  // ✅
```

**Why:** Catches bugs before code runs

---

### 3. **Validation**
**What it means:** Double-checking data before saving

```typescript
// Runtime validation (Zod):
// Even if TypeScript says it's okay,
// Zod checks it again when code runs
```

**Why:** Users can send bad data. Validation protects you.

---

### 4. **Transactions**
**What it means:** Do multiple things, or do nothing

```typescript
// Either ALL of these succeed:
// 1. Create resume
// 2. Create version
// 3. Link them together

// OR NONE of them happen (if one fails)
```

**Why:** Prevents partial saves (like saving resume but not version)

---

### 5. **Error Handling**
**What it means:** Gracefully handle problems

```typescript
// Instead of crashing:
try {
  // Do something risky
} catch (error) {
  // Return nice error message
}
```

**Why:** Better user experience, easier debugging

---

## 🔄 More Data Flow Examples

### Example 2: Getting a Resume

**Step 1: User requests resume**
```
GET /api/resume/123
```

**Step 2: API Route** (`app/api/resume/[id]/route.ts`)
```typescript
// 1. Check auth
const userId = requireAuth(request);

// 2. Call model function
const resume = await getResumeById(resumeId, userId);

// 3. Return response
return NextResponse.json({ ...resume });
```

**Step 3: Model Layer** (`lib/models/resume.ts`)
```typescript
// 1. Find resume (checking ownership)
const resume = await prisma.resume.findFirst({
  where: { id: resumeId, userId }
});

// 2. Get current version if exists
if (resume.currentVersionId) {
  const version = await prisma.resumeVersion.findUnique({
    where: { id: resume.currentVersionId }
  });
}

// 3. Return combined data
return { ...resume, versions: [version] };
```

**Step 4: Database Query**
```sql
-- Prisma generates:
SELECT * FROM "Resume" WHERE id = '123' AND userId = 'user-456';
SELECT * FROM "ResumeVersion" WHERE id = 'version-789';
```

**Response:**
```json
{
  "id": "123",
  "title": "My Resume",
  "currentVersion": { ...full resume data... }
}
```

---

### Example 3: Creating a New Version

**Step 1: User sends updated data**
```
POST /api/resume/123/versions
Body: {
  data: { ...updated resume data... },
  changeSummary: "Added new experience"
}
```

**Step 2: API Route** (`app/api/resume/[id]/versions/route.ts`)
```typescript
// 1. Validate data
const validatedData = validateResumeData(body.data);

// 2. Create version
const version = await createResumeVersion(
  resumeId,
  userId,
  validatedData,
  { changeSummary: body.changeSummary }
);
```

**Step 3: Model Layer** (`lib/models/resume.ts`)
```typescript
// 1. Get latest version number
const latest = await getResumeVersions(resumeId, userId);
const nextVersion = latest[0].versionNumber + 1;

// 2. Create new version in transaction
await prisma.$transaction(async (tx) => {
  // Create version
  const newVersion = await tx.resumeVersion.create({
    data: {
      versionNumber: nextVersion,
      data: validatedData,
      ...
    }
  });
  
  // Update resume's current version
  await tx.resume.update({
    where: { id: resumeId },
    data: { currentVersionId: newVersion.id }
  });
});
```

**Result:** New version created, old versions preserved

---

### Example 4: AI Improvement Flow

**Step 1: User wants to improve experience section**
```
POST /api/ai/improve
Body: {
  section: "experience",
  currentContent: {
    company: "Tech Corp",
    position: "Developer",
    achievements: ["Worked on website"]
  },
  jobDescription: { ...parsed job description... }
}
```

**Step 2: API Route** (`app/api/ai/improve/route.ts`)
```typescript
// 1. Check auth
const userId = requireAuth(request);

// 2. Validate input
if (body.section !== 'experience') { ... }

// 3. Call AI service
const result = await resumeImprover.improveExperience(
  body.currentContent,
  body.jobDescription
);
```

**Step 3: AI Service** (`services/ai/resume-improver.ts`)
```typescript
// 1. Build prompt with current content and job description
const prompt = `Improve this experience entry...`;

const response = await this.callAI(prompt);

// 3. Return improved content with reasoning
return {
  improvedAchievements: [...],
  keywords: [...],
  reasoning: "Added metrics and keywords..."
};
```

**Step 4: Response**
```json
{
  "improvedContent": {
    "improvedAchievements": [
      "Increased website traffic by 40% through SEO optimization",
      "Led team of 3 developers to launch new features"
    ],
    "keywords": ["SEO", "team leadership", "feature development"],
    "reasoning": "Added quantifiable metrics and action verbs..."
  }
}
```

**Note:** This doesn't save to database yet - user must accept and create new version

---

### Example 5: Restoring a Version

**Step 1: User wants to restore old version**
```
POST /api/resume/123/versions/version-456/restore
```

**Step 2: API Route** (`app/api/resume/[id]/versions/[versionId]/route.ts`)
```typescript
// Call restore function
const newVersion = await restoreResumeVersion(
  resumeId,
  versionId,
  userId
);
```

**Step 3: Model Layer** (`lib/models/resume.ts`)
```typescript
// 1. Get old version
const oldVersion = await getResumeVersion(versionId, userId);

// 2. Validate old data
const validatedData = safeValidateResumeData(oldVersion.data);

// 3. Create NEW version from old data
const newVersion = await createResumeVersion(
  resumeId,
  userId,
  validatedData.data,
  { changeSummary: `Restored from version ${oldVersion.versionNumber}` }
);
```

**Result:** 
- Old version stays unchanged
- New version created with old data
- Current version updated to new version
- User can still access all versions

---

## 🧪 Example: Complete Request Flow

### User wants to create a resume:

1. **User sends:**
   ```json
   POST /api/resume
   {
     "title": "Software Engineer",
     "data": {
       "personalInfo": {
         "fullName": "John Doe",
         "email": "john@example.com",
         "phone": "123-456-7890",
         "location": "San Francisco, CA"
       },
       "experience": [...],
       "education": [...],
       "skills": {...}
     }
   }
   ```

2. **API Route receives** (`app/api/resume/route.ts`)
   - Checks authentication ✅
   - Reads body ✅
   - Calls `createResume()` ✅

3. **Model validates** (`lib/models/resume.ts`)
   - Calls `validateResumeData()` ✅
   - Checks all fields ✅

4. **Validation checks** (`lib/validation/resume-schema.ts`)
   - Email format? ✅
   - Required fields? ✅
   - Date formats? ✅

5. **Database saves** (`lib/db/prisma.ts`)
   - Creates Resume record ✅
   - Creates ResumeVersion record ✅
   - Links them ✅

6. **Response sent back:**
   ```json
   {
     "id": "abc-123",
     "title": "Software Engineer",
     "currentVersionId": "version-456",
     "createdAt": "2024-01-01T00:00:00Z"
   }
   ```

---

## 🔗 How Everything Connects

### The Complete Picture

```
User Request
    ↓
API Route (app/api/)
    ├─→ Checks authentication
    ├─→ Validates input
    └─→ Calls Model Function
            ↓
Model Layer (lib/models/)
    ├─→ Validates data (lib/validation/)
    ├─→ Business logic
    └─→ Database operations (lib/db/)
            ↓
Database (Prisma → PostgreSQL/SQLite)
    └─→ Stores/retrieves data
            ↓
Response flows back
    Model → API Route → User
```

### AI Services Integration

```
User wants AI improvement
    ↓
API Route (app/api/ai/improve)
    ├─→ Validates request
    └─→ Calls AI Service
            ↓
AI Service (services/ai/)
   ├─→ Builds prompt
   └─→ Returns improved content
            ↓
User accepts improvement
    ↓
Creates new version (app/api/resume/[id]/versions)
    └─→ Saves to database
```

### Version System Flow

```
Create Resume
    └─→ Creates Version 1 automatically

Update Resume
    └─→ Creates Version 2 (Version 1 preserved)

Restore Version 1
    └─→ Creates Version 3 with Version 1's data
    └─→ Version 1 and 2 still exist

All versions are immutable snapshots
```

---

## 💡 Tips for Understanding

1. **Start with API routes** - They're the entry point
2. **Follow the function calls** - See where data goes
3. **Read error messages** - They tell you what's wrong
4. **Use TypeScript hints** - Hover over code in your editor
5. **Add console.logs** - See what data looks like at each step
6. **Trace one complete flow** - Follow one request from start to finish
7. **Understand the layers** - API → Model → Database
8. **See how versions work** - Each version is a snapshot, never changed

---

## 🚀 Next Steps

Now that you understand the flow:
- Try making a request with Postman/Thunder Client
- Add console.logs to see data at each step
- Read the error messages when something breaks
- Experiment with invalid data to see validation in action
- Try creating a resume, then creating a version, then restoring an old version
- Test the AI endpoints with sample job descriptions

## 📚 Quick Reference: All Endpoints

### Resume Endpoints
- `GET /api/resume` - List all resumes
- `POST /api/resume` - Create new resume
- `GET /api/resume/[id]` - Get resume details
- `PUT /api/resume/[id]` - Update resume metadata
- `DELETE /api/resume/[id]` - Delete resume

### Version Endpoints
- `GET /api/resume/[id]/versions` - List all versions
- `POST /api/resume/[id]/versions` - Create new version
- `GET /api/resume/[id]/versions/[versionId]` - Get version details
- `POST /api/resume/[id]/versions/[versionId]/restore` - Restore version

### AI Endpoints
- `POST /api/ai/parse-job` - Parse job description
- `POST /api/ai/improve` - Improve resume section

## 🎓 Key Takeaways

1. **Separation of Concerns**: Each layer has one job
2. **Type Safety**: TypeScript + Zod catch errors early
3. **Validation**: Always validate before saving
4. **Transactions**: Multiple operations succeed or fail together
5. **Versioning**: Immutable snapshots enable history and rollback
6. **Error Handling**: Consistent error format helps debugging
7. **AI Integration**: AI services are separate, called on-demand
