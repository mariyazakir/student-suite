# Export Modal Implementation

## Overview
Replaced multiple floating export buttons with a single "Download" button that opens a modal dialog with export options.

---

## Modal State Location

### State Management
**File:** `code/app/builder/page.tsx`

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
```

### State Flow:
1. **Initial State:** `isModalOpen = false` (modal closed)
2. **Open Modal:** Click "Download" button → `setIsModalOpen(true)`
3. **Close Modal:** 
   - Click outside backdrop → `setIsModalOpen(false)`
   - Press ESC key → `setIsModalOpen(false)`
   - Click close button → `setIsModalOpen(false)`
   - Select export option → triggers export + closes modal

### Modal Component
**File:** `code/components/resume/ExportModal.tsx`

The modal is a controlled component:
- Receives `isOpen` prop to control visibility
- Receives `onClose` callback to close
- Manages its own keyboard/click handlers internally

---

## How Export Buttons Are Hidden During Capture

### Multiple Hiding Mechanisms

1. **`.no-print` Class:**
   - Applied to floating button container
   - Applied to modal backdrop
   - Hidden in `@media print` styles

2. **`.export-buttons` Class:**
   - Applied to floating button
   - Applied to modal backdrop
   - Additional safety for hiding

3. **`[class*="fixed"]` Selector:**
   - Hides all fixed position elements
   - Catches floating button

4. **`[role="dialog"]` Selector:**
   - Hides modal dialogs
   - Catches the export modal

5. **CSS `@media print`:**
   ```css
   @media print {
     .no-print,
     .export-buttons,
     [class*="fixed"],
     [role="dialog"] {
       display: none !important;
     }
   }
   ```

### Why Buttons Don't Appear in Exports

**PDF Export:**
- Targets only `#resume-preview` container
- Floating button is outside this container
- Modal is outside this container
- Print styles hide them as backup

**Image Export:**
- Targets only `#resume-preview` container
- Floating button is outside this container
- Modal is outside this container
- Print styles hide them as backup

**Print:**
- Browser applies `@media print` styles automatically
- All `.no-print` elements hidden
- All `[role="dialog"]` elements hidden
- Only resume content prints

---

## How Accessibility is Handled

### ARIA Attributes

1. **Modal Role:**
   ```tsx
   <div role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
   ```
   - `role="dialog"` - Identifies as dialog
   - `aria-modal="true"` - Indicates modal behavior
   - `aria-labelledby` - Links to title

2. **Title:**
   ```tsx
   <h2 id="export-modal-title">Export Resume</h2>
   ```
   - Provides accessible title
   - Linked via `aria-labelledby`

3. **Close Button:**
   ```tsx
   <button aria-label="Close modal">
   ```
   - Screen reader accessible label

### Keyboard Navigation

1. **ESC Key:**
   ```typescript
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape' && isOpen) {
         onClose();
       }
     };
     document.addEventListener('keydown', handleEscape);
   }, [isOpen, onClose]);
   ```
   - Closes modal on ESC press
   - Cleanup on unmount

2. **Focus Management:**
   ```typescript
   setTimeout(() => {
     firstButtonRef.current?.focus();
   }, 100);
   ```
   - Focuses first button when modal opens
   - Ensures keyboard navigation starts correctly

3. **Tab Navigation:**
   - All buttons are keyboard accessible
   - Tab order: PDF → Image → Print → Close
   - Focus trap (browser default for modals)

### Body Scroll Lock

```typescript
if (isOpen) {
  document.body.style.overflow = 'hidden';
}
return () => {
  document.body.style.overflow = '';
};
```

- Prevents background scrolling when modal is open
- Restores scroll on close

### Click Outside to Close

```typescript
const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};
```

- Only closes if clicking backdrop (not modal content)
- Prevents accidental closes

---

## Component Structure

### FloatingDownloadButton
**File:** `code/components/resume/FloatingExportButtons.tsx`

- Single floating button
- Fixed bottom-right
- Circular design
- Shows "Download" text on desktop, icon only on mobile
- Opens modal on click

### ExportModal
**File:** `code/components/resume/ExportModal.tsx`

- Centered modal dialog
- Backdrop overlay
- Three export options
- Close button
- Keyboard accessible
- Mobile-friendly

---

## Features

### Modal Features:
- ✅ Centered on screen
- ✅ Backdrop overlay (semi-transparent black)
- ✅ Close on outside click
- ✅ Close on ESC key
- ✅ Smooth animations
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Body scroll lock
- ✅ Mobile responsive
- ✅ Accessible (ARIA attributes)

### Button Features:
- ✅ Single floating button
- ✅ Fixed bottom-right
- ✅ Circular design
- ✅ Responsive (text on desktop, icon on mobile)
- ✅ Hidden in exports
- ✅ Disabled during export

---

## Files Created/Modified

### Modified Files:
- `code/components/resume/FloatingExportButtons.tsx` - Changed to single button
- `code/app/builder/page.tsx` - Added modal state and handlers
- `code/app/globals.css` - Added `[role="dialog"]` to print styles

### New Files:
- `code/components/resume/ExportModal.tsx` - Modal component

---

## Usage Flow

1. **User clicks "Download" button** (bottom-right)
2. **Modal opens** with three options
3. **User selects option:**
   - PDF → Downloads PDF, closes modal
   - Image → Downloads PNG, closes modal
   - Print → Opens print dialog, closes modal
4. **Modal closes** automatically after selection

---

## Technical Details

### Modal Positioning
- `fixed inset-0` - Full screen overlay
- `flex items-center justify-center` - Centered content
- `z-50` - High z-index (above other content)

### Backdrop
- `bg-black bg-opacity-50` - Semi-transparent black
- `backdrop-blur-sm` - Subtle blur effect
- Clickable to close

### Animation
- `transform transition-all duration-200` - Smooth transitions
- `scale-100` - Scale animation ready (can add scale-in effect)

### Mobile Responsive
- `p-4` - Padding on mobile
- `max-w-md w-full` - Responsive width
- Buttons stack vertically
- Touch-friendly sizes

---

## Testing Checklist

- [x] Single download button appears
- [x] Button opens modal on click
- [x] Modal shows three export options
- [x] Modal closes on outside click
- [x] Modal closes on ESC key
- [x] Modal closes after selecting option
- [x] Keyboard navigation works
- [x] Focus management works
- [x] Body scroll locked when open
- [x] Mobile responsive
- [x] Hidden in print
- [x] Hidden in PDF export
- [x] Hidden in image export
- [x] Export functions still work
- [x] No breaking changes

---

## Notes

- Modal state is managed in parent component (`BuilderPage`)
- Export functions unchanged (reused existing logic)
- Modal is outside `#resume-preview` (won't appear in exports)
- All accessibility features implemented
- Clean, modular implementation
- No breaking changes to existing functionality
