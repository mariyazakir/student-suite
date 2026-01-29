# Folder Rename: resume builder → resume-builder

## Checklist: Files & Folders to Update

After renaming the folder from **resume builder** to **resume-builder**, use this list to ensure the code and docs work correctly.

---

### ✅ Files that reference the old path (update these)

| File | What to change |
|------|----------------|
| `code/RUN_APP.md` | Replace `resume builder` with `resume-builder` in all `cd` paths |
| `code/QUICK_START.md` | Replace `resume builder` with `resume-builder` in all `cd` paths |
| `code/FIX_NOT_OPENING.md` | Replace `resume builder` with `resume-builder` in all `cd` paths |

**Old path:** `c:\Users\mariy\.cursor\resume builder\code`  
**New path:** `c:\Users\mariy\.cursor\resume-builder\code`

---

### ✅ No changes needed (use relative or __dirname)

| File / Folder | Why it's OK |
|---------------|-------------|
| `code/next.config.js` | Uses `__dirname` (resolves at runtime) |
| `code/tsconfig.json` | Uses `./*` for `@/*` (relative) |
| `code/package.json` | No folder path; name is `resume-builder-saas` |
| `code/vitest.config.ts` | No paths |
| `code/.vscode/settings.json` | No folder path |
| `code/env.template` | No folder path |
| Source code (`app/`, `components/`, `lib/`, etc.) | Imports use `@/` or relative paths |

---

### ✅ After renaming – do this once

1. **Open the project from the new path**  
   In Cursor/VS Code: File → Open Folder → `C:\Users\mariy\.cursor\resume-builder`

2. **Run from the code folder**  
   ```powershell
   cd C:\Users\mariy\.cursor\resume-builder\code
   npm install
   npm run dev
   ```

3. **If you had a previous build**  
   Delete the build cache and rebuild so paths are fresh:
   ```powershell
   cd C:\Users\mariy\.cursor\resume-builder\code
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   npm run build
   ```

4. **If you use Git**  
   The repo root is now `resume-builder`. No config change needed; just use the new folder.

---

### Summary

- **Update:** 3 docs in `code/` that show the old `cd` path.
- **No code/config changes** needed for Next.js, TypeScript, or imports.
- **One-time:** Open from new path, reinstall if needed, clear `.next` and rebuild if you use `npm run start`.
