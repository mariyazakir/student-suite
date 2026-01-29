# Multi-Resume Save/Load System Implementation

## Overview
Implemented a complete multi-resume management system using localStorage. Users can create, save, load, delete, and rename multiple resumes with automatic saving every 10 seconds.

---

## Data Structure

### localStorage Keys
- **`resumes`**: Array of all saved resumes
- **`lastOpenedResumeId`**: ID of the last opened resume

### SavedResume Interface
```typescript
interface SavedResume {
  id: string;              // UUID
  name: string;            // User-friendly name
  template: TemplateType;  // 'minimal' | 'modern'
  data: ResumeData;        // Full form state
  lastUpdated: string;     // ISO timestamp
}
```

---

## Core Features

### 1. **Create New Resume**
- Generates new UUID
- Creates blank resume with default data
- Sets name to "Untitled Resume" (can be changed)
- Prompts for confirmation if current resume has unsaved changes

### 2. **Save Resume**
- Saves current resume data to localStorage
- Updates `lastUpdated` timestamp
- Creates new resume if no ID exists
- Updates existing resume if ID exists

### 3. **Load Resume**
- Loads resume by ID
- Updates form, preview, and template
- Sets as last opened resume
- Prompts for confirmation if current resume has unsaved changes

### 4. **Delete Resume**
- Removes resume from localStorage
- Two-step confirmation (click delete, then confirm)
- Creates new resume if deleting current one
- Clears last opened ID if it was the deleted resume

### 5. **Rename Resume**
- Inline editing with Enter/Escape support
- Updates resume name in storage
- Updates current resume name if renaming active resume

### 6. **Autosave**
- Automatically saves every 10 seconds
- Debounced (waits 10 seconds after last change)
- Only saves if data has changed
- Runs in background, no user interaction needed

---

## UI Components

### ResumeManager Component
**Location:** `code/components/resume/ResumeManager.tsx`

**Features:**
- Dropdown button showing current resume name
- "New Resume" button
- "Save" button
- List of all saved resumes
- Inline rename functionality
- Delete with confirmation
- Shows "Current" badge for active resume
- Displays last updated timestamp

**UI Elements:**
- Dropdown button in header
- Modal-like dropdown panel
- Resume list with actions
- Confirmation states for delete

---

## File Structure

### 1. **Storage Utilities**
**File:** `code/lib/storage/resume-storage.ts`

**Functions:**
- `getAllResumes()`: Get all saved resumes
- `saveResume(resume)`: Save/update resume
- `getResumeById(id)`: Get specific resume
- `deleteResume(id)`: Delete resume
- `getLastOpenedResume()`: Get last opened resume
- `setLastOpenedResumeId(id)`: Set last opened ID
- `createNewResume(name)`: Create new resume with defaults

**Error Handling:**
- Try-catch blocks for all localStorage operations
- Graceful fallback to empty array if storage is corrupted
- Console error logging

### 2. **ResumeManager Component**
**File:** `code/components/resume/ResumeManager.tsx`

**Props:**
- `currentResumeId`: Current resume ID (null if new)
- `currentResumeName`: Current resume name
- `currentResumeData`: Current resume data
- `currentTemplate`: Current template
- `onLoadResume`: Callback when loading resume
- `onSaveResume`: Callback when saving resume
- `onNewResume`: Callback when creating new resume

**State:**
- `isOpen`: Dropdown open/closed
- `savedResumes`: List of saved resumes
- `showDeleteConfirm`: ID of resume pending deletion
- `renamingId`: ID of resume being renamed
- `renameValue`: Current rename input value

**Features:**
- Click outside to close dropdown
- Storage change listener (for multi-tab sync)
- Sorted by last updated (newest first)
- Formatted date display

### 3. **Builder Page Integration**
**File:** `code/app/builder/page.tsx`

**New State:**
- `currentResumeId`: Current resume ID
- `currentResumeName`: Current resume name
- `autosaveTimerRef`: Timer reference for autosave
- `lastSavedDataRef`: Reference to last saved data (for change detection)

**New Effects:**
1. **Load Last Opened Resume** (on mount)
   - Loads last opened resume if exists
   - Creates new resume if none exists

2. **Autosave** (on data change)
   - Debounced 10-second timer
   - Only saves if data changed
   - Clears timer on unmount

**New Handlers:**
- `loadResume(resume)`: Load resume data
- `handleLoadResume(resume)`: Load with unsaved changes check
- `handleSaveResume(resume)`: Update current resume state
- `handleNewResume()`: Create new resume with confirmation
- `handleAutosave()`: Background autosave function

---

## Behavior

### On Page Load
1. Check for last opened resume
2. If found, load it (data, template, name)
3. If not found, create new resume
4. Set as current resume

### On Data Change
1. Update resume data state
2. Start/restart 10-second autosave timer
3. Timer saves automatically after 10 seconds of inactivity

### On Resume Switch
1. Check for unsaved changes
2. Prompt for confirmation if changes exist
3. Load new resume (data, template, name)
4. Update form and preview
5. Set as last opened resume

### On Save
1. If no ID: Create new resume (prompt for name)
2. If has ID: Update existing resume
3. Save to localStorage
4. Update current resume state
5. Refresh resume list

### On Delete
1. First click: Show confirmation (checkmark icon)
2. Second click: Delete resume
3. If deleting current: Create new resume
4. Clear last opened if it was deleted

### On Rename
1. Click rename icon
2. Inline input appears
3. Enter to save, Escape to cancel
4. Update resume in storage
5. Update current name if renaming active resume

---

## Error Handling

### Empty Storage
- Returns empty array if no resumes exist
- Creates new resume on first load

### Corrupted Data
- Try-catch blocks prevent crashes
- Falls back to empty array
- Console logs errors for debugging

### Unsaved Changes
- Prompts before switching resumes
- Prompts before creating new resume
- Uses JSON comparison to detect changes

### Storage Quota
- localStorage has ~5-10MB limit
- Errors are caught and logged
- User sees alert if save fails

---

## Performance

### Debouncing
- Autosave waits 10 seconds after last change
- Timer is cleared and restarted on each change
- Prevents excessive saves

### Change Detection
- Compares JSON stringified data
- Only saves if data actually changed
- Reduces unnecessary localStorage writes

### Storage Sync
- Listens to storage events (multi-tab support)
- Refreshes resume list when storage changes
- Keeps UI in sync across tabs

---

## Template Safety

### No Hardcoding
- Stores full `ResumeData` object
- Works with any template
- Template is stored separately
- No field-specific logic

### Template Persistence
- Template is saved with resume
- Template is restored on load
- Template can be changed independently
- Template changes trigger autosave

---

## Testing Checklist

- [x] Create new resume
- [x] Save resume (new and existing)
- [x] Load resume
- [x] Delete resume
- [x] Rename resume
- [x] Autosave after 10 seconds
- [x] Unsaved changes warning
- [x] Last opened resume restoration
- [x] Multi-resume management
- [x] Template persistence
- [x] Empty storage handling
- [x] Error handling

---

## Files Created/Modified

### Created:
1. `code/lib/storage/resume-storage.ts` - Storage utilities
2. `code/components/resume/ResumeManager.tsx` - UI component

### Modified:
1. `code/app/builder/page.tsx` - Integrated save/load system

---

## Usage

### For Users:
1. **Create Resume**: Click "New Resume" button
2. **Save Resume**: Click "Save" button (or wait for autosave)
3. **Load Resume**: Click resume name in dropdown
4. **Rename Resume**: Click rename icon, edit, press Enter
5. **Delete Resume**: Click delete icon twice (confirmation)

### For Developers:
- All storage operations are in `resume-storage.ts`
- UI is in `ResumeManager.tsx`
- Integration is in `builder/page.tsx`
- No backend required
- No login required
- Pure localStorage implementation

---

## Notes

- **No Backend**: All data stored in browser localStorage
- **No Login**: No authentication required
- **Client-Side Only**: Works offline
- **Browser-Specific**: Data is per-browser, not synced
- **Size Limit**: ~5-10MB localStorage limit
- **Privacy**: Data never leaves user's browser
- **Template Agnostic**: Works with any template
- **Future-Proof**: Easy to migrate to backend later

---

## Future Enhancements (Not Implemented)

- Export/Import resumes as JSON
- Resume duplication
- Resume templates/presets
- Search/filter resumes
- Resume categories/tags
- Cloud sync (requires backend)
- Resume versioning
- Resume sharing (requires backend)
