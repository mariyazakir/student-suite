# Print Preview Fix - Show Preview Only

## Problem
When printing, the editor panel (left side with form fields) was showing instead of the preview panel (right side with formatted resume).

## Root Cause
The print styles were hiding the entire `ResizableSplitLayout` container, which also hid the preview panel inside it. We needed to:
1. Hide the left panel (editor)
2. Show the right panel (preview)
3. Hide the divider

## Solution

### 1. **Use `display: contents` for Split Layout**

**Before:**
```css
[class*="ResizableSplitLayout"] {
  display: none !important;
  visibility: hidden !important;
}
```

**After:**
```css
[class*="ResizableSplitLayout"] {
  display: contents !important; /* Makes container transparent, children can show */
}
```

**Why:** `display: contents` makes the container "disappear" but allows its children to be displayed. This way, we can selectively show/hide the left and right panels.

---

### 2. **Hide Left Panel (Editor)**

```css
/* Hide left panel (editor) - first child div in desktop layout */
[class*="ResizableSplitLayout"] > div > div:first-child,
/* Hide left panel in mobile layout */
.md\\:hidden > div:first-child {
  display: none !important;
  visibility: hidden !important;
}
```

**Why:** The left panel contains the `ResumeEditor` component with all the form fields. We hide it completely in print.

---

### 3. **Hide Divider**

```css
/* Hide divider - second child div */
[class*="ResizableSplitLayout"] > div > div:nth-child(2) {
  display: none !important;
  visibility: hidden !important;
}
```

**Why:** The draggable divider between panels is not needed in print.

---

### 4. **Show Right Panel (Preview)**

```css
/* Show only the right panel (preview) - last child div in desktop */
[class*="ResizableSplitLayout"] > div > div:last-child {
  display: block !important;
  visibility: visible !important;
  position: static !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  background: white !important;
}
```

**Why:** The right panel contains the `ResumePreview` component with the formatted resume. We make it full width and visible.

---

### 5. **Handle Mobile Layout**

```css
/* Show right panel in mobile layout */
.md\\:hidden > div:last-child {
  display: block !important;
  visibility: visible !important;
  position: static !important;
  width: 100% !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  background: white !important;
}
```

**Why:** The mobile layout has a different structure (stacked), so we need separate rules.

---

## Component Structure

```
ResizableSplitLayout
├── Desktop Layout (hidden md:flex)
│   ├── Left Panel (ResumeEditor) ❌ HIDDEN
│   ├── Divider ❌ HIDDEN
│   └── Right Panel (ResumePreview) ✅ VISIBLE
│       ├── Template Switcher ❌ HIDDEN (.no-print)
│       └── Preview Wrapper ✅ VISIBLE
│           └── #resume-preview ✅ VISIBLE
└── Mobile Layout (md:hidden)
    ├── Left Panel (ResumeEditor) ❌ HIDDEN
    └── Right Panel (ResumePreview) ✅ VISIBLE
```

---

## What Was Changed

### File: `code/app/globals.css`

**Lines 27-65:** Updated print styles to:
1. Use `display: contents` for split layout container
2. Hide left panel (editor) in both desktop and mobile
3. Hide divider
4. Show right panel (preview) in both desktop and mobile
5. Ensure preview wrapper and resume preview are visible

---

## How It Works Now

1. **Print Trigger:**
   - User clicks "Print" → `window.print()` is called
   - Browser applies `@media print` styles

2. **UI Hiding:**
   - Header, buttons, modals are hidden
   - Split layout container uses `display: contents` (transparent)
   - Left panel (editor) is hidden
   - Divider is hidden

3. **Preview Display:**
   - Right panel (preview) is shown at full width
   - Template switcher is hidden (`.no-print`)
   - Preview wrapper is visible
   - `#resume-preview` is visible with all content

4. **Layout:**
   - Preview takes full page width
   - A4 page size with proper margins
   - Content flows naturally

---

## Testing

✅ **Desktop Layout:**
- Editor panel hidden
- Preview panel visible
- Divider hidden
- Resume content prints correctly

✅ **Mobile Layout:**
- Editor panel hidden
- Preview panel visible
- Resume content prints correctly

✅ **Portrait/Landscape:**
- Both orientations work
- Preview content visible
- Proper margins applied

---

## Key Changes Summary

| Element | Before | After |
|---------|--------|-------|
| Split Layout | `display: none` | `display: contents` |
| Left Panel | Hidden (inherited) | Explicitly hidden |
| Divider | Hidden (inherited) | Explicitly hidden |
| Right Panel | Hidden (inherited) | Explicitly shown |
| Preview Content | Hidden | Visible |

---

## Notes

- No changes to resume content or templates
- No changes to export functions (PDF/Image still work)
- Only print behavior was fixed
- Works for both desktop and mobile layouts
- All existing functionality preserved
