# Resume Templates

## Overview

Two ATS-friendly resume templates for different visual styles.

## Templates

### 1. Minimal Template
**File:** `MinimalTemplate.tsx`

**Style:**
- Clean black and white design
- Classic serif font
- Simple borders and dividers
- Uppercase section headers
- Traditional resume layout

**ATS-Friendly Features:**
- No complex graphics or tables
- Standard text formatting
- Clear section headers
- Simple bullet points
- Linear structure

### 2. Modern Template
**File:** `ModernTemplate.tsx`

**Style:**
- Subtle color accents (primary blue)
- Better visual hierarchy
- Color-coded section headers
- Tag-based skills display
- Contemporary design

**ATS-Friendly Features:**
- Still text-based (no images)
- Clear section structure
- Standard formatting
- Readable by ATS systems
- Professional appearance

## Structure

```
templates/
├── MinimalTemplate.tsx    # Minimal template component
├── ModernTemplate.tsx      # Modern template component
├── index.ts                # Exports
└── README.md               # This file
```

## Usage

Templates are selected via the template switcher in the builder page. The preview updates instantly when switching templates.

## Template Props

Both templates receive:
- `data: ResumeData` - Complete resume data

## Design Principles

1. **ATS-Friendly**: No images, tables, or complex formatting
2. **Readable**: Clear typography and spacing
3. **Professional**: Appropriate for job applications
4. **Consistent**: Same data structure, different presentation
