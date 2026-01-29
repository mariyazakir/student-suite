# Section Visibility Toggle Implementation

## Overview
Implemented hide/show section toggles that allow users to control which sections appear in the resume preview and exports. Hidden sections are excluded from PDF, image, and print outputs, but data is preserved.

---

## Implementation

### 1. **Type Definitions**
**File:** `code/types/section-visibility.ts`

- `SectionVisibility` interface: Boolean flags for each section
- `defaultSectionVisibility`: All sections visible by default
- Personal Info is always visible (required)

### 2. **Storage Integration**
**File:** `code/lib/storage/resume-storage.ts`

- Added `sectionVisibility?: SectionVisibility` to `SavedResume` interface
- Optional for backward compatibility with existing resumes
- Default visibility applied when loading old resumes

### 3. **Sections Panel Component**
**File:** `code/components/resume/SectionsPanel.tsx`

- Checkbox UI for each section
- Personal Info checkbox is disabled (always visible)
- Clean, minimal design
- Located at top of editor panel

### 4. **Template Updates**
**Files:** 
- `code/components/resume/templates/MinimalTemplate.tsx`
- `code/components/resume/templates/ModernTemplate.tsx`

- Added `sectionVisibility` prop to both templates
- Each section checks visibility before rendering
- Conditional rendering: `{sectionVisibility.section && data.section && ...}`
- Works with all current and future templates

### 5. **Preview Integration**
**File:** `code/components/resume/ResumePreview.tsx`

- Passes `sectionVisibility` prop to templates
- Templates handle visibility logic

### 6. **Builder Page Integration**
**File:** `code/app/builder/page.tsx`

- Added `sectionVisibility` state
- SectionsPanel component in editor panel
- Visibility state saved with resume
- Autosave includes visibility state
- Load resume restores visibility state

---

## Features

### ✅ Hide/Show Sections
- Toggle any section on/off
- Personal Info always visible
- Instant preview update

### ✅ Data Preservation
- Hidden sections don't delete data
- Data remains in form
- Can be restored by toggling on

### ✅ Export Exclusion
- Hidden sections excluded from PDF
- Hidden sections excluded from Image
- Hidden sections excluded from Print
- ATS-friendly HTML output maintained

### ✅ Per-Resume Storage
- Visibility state saved per resume
- Each resume has its own visibility settings
- Restored when loading resume

### ✅ Template Agnostic
- Works with Minimal template
- Works with Modern template
- Works with future templates
- No hardcoded fields

---

## UI Location

**Sections Panel** is located at the top of the editor panel (left side), above all section editors.

**Layout:**
```
Editor Panel (Left)
├── Sections Panel (Checkboxes)
├── Personal Details Editor
├── Summary Editor
├── Skills Editor
└── ... (other editors)
```

---

## Data Flow

1. **User toggles section** → `SectionsPanel` updates state
2. **State updates** → `sectionVisibility` changes
3. **Preview updates** → `ResumePreview` receives new visibility
4. **Template renders** → Only visible sections shown
5. **Autosave triggers** → Visibility saved to localStorage
6. **Export** → Only visible sections included

---

## Section List

1. **Personal Info** - Always visible (required)
2. **Professional Summary** - Toggleable
3. **Experience** - Toggleable
4. **Education** - Toggleable
5. **Skills** - Toggleable
6. **Projects** - Toggleable
7. **Certifications** - Toggleable
8. **Achievements** - Toggleable
9. **Languages** - Toggleable

---

## Technical Details

### Visibility Check Pattern
```typescript
{sectionVisibility.section && data.section && data.section.length > 0 && (
  <section>...</section>
)}
```

### Storage Structure
```typescript
{
  id: string,
  name: string,
  template: TemplateType,
  data: ResumeData,
  sectionVisibility?: SectionVisibility, // Optional
  lastUpdated: string
}
```

### Default Visibility
```typescript
{
  personalInfo: true,  // Always true
  summary: true,
  experience: true,
  education: true,
  skills: true,
  projects: true,
  certifications: true,
  achievements: true,
  languages: true,
}
```

---

## Backward Compatibility

- Existing resumes without `sectionVisibility` get default (all visible)
- Optional field in `SavedResume` interface
- Graceful fallback: `resume.sectionVisibility || defaultSectionVisibility`

---

## Files Created/Modified

### Created:
1. `code/types/section-visibility.ts` - Type definitions
2. `code/components/resume/SectionsPanel.tsx` - UI component

### Modified:
1. `code/lib/storage/resume-storage.ts` - Added sectionVisibility to SavedResume
2. `code/components/resume/templates/MinimalTemplate.tsx` - Added visibility checks
3. `code/components/resume/templates/ModernTemplate.tsx` - Added visibility checks
4. `code/components/resume/ResumePreview.tsx` - Passes visibility to templates
5. `code/app/builder/page.tsx` - Integrated SectionsPanel and state management

---

## Testing Checklist

- [x] Toggle sections on/off
- [x] Preview updates instantly
- [x] Hidden sections excluded from PDF
- [x] Hidden sections excluded from Image
- [x] Hidden sections excluded from Print
- [x] Data preserved when hidden
- [x] Visibility state saved per resume
- [x] Visibility state restored on load
- [x] Works with Minimal template
- [x] Works with Modern template
- [x] Personal Info always visible
- [x] Autosave includes visibility
- [x] No editor logic changes
- [x] No template structure changes
- [x] ATS-friendly output maintained

---

## Notes

- **No Data Loss**: Hidden sections preserve all data
- **Template Safe**: Works with all templates without modification
- **Export Safe**: Hidden sections automatically excluded
- **Performance**: Minimal overhead, conditional rendering
- **User-Friendly**: Simple checkbox interface
- **Future-Proof**: Easy to add new sections
