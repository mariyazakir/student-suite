# Fix: App Not Opening - Step by Step Solution

## Quick Fix (Try This First)

### Step 1: Open PowerShell/Command Prompt
Open a NEW terminal window (close any existing ones)

### Step 2: Navigate to Code Directory
```powershell
cd "c:\Users\mariy\.cursor\resume-builder\code"
```

### Step 3: Run Setup Check Script
```powershell
.\check-setup.ps1
```

This will:
- Check Node.js installation
- Check npm installation
- Verify all files exist
- Install dependencies if needed
- Start the server

## Manual Fix (If Script Doesn't Work)

### Step 1: Verify You're in Right Directory
```powershell
cd "c:\Users\mariy\.cursor\resume-builder\code"
dir package.json
```
Should show: `package.json`

### Step 2: Install Dependencies
```powershell
npm install
```
**Wait for this to complete** (may take 2-3 minutes)

### Step 3: Check for Errors
Look for any red error messages. If you see errors, note them down.

### Step 4: Start Server
```powershell
npm run dev
```

### Step 5: Wait for This Message
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
✓ Ready in X seconds
```

### Step 6: Open Browser
Go to: **http://localhost:3000**

## Common Issues & Fixes

### Issue 1: "npm is not recognized"
**Fix:** Install Node.js from https://nodejs.org/
- Download LTS version
- Install it
- Restart terminal
- Verify: `node --version` and `npm --version`

### Issue 2: "Port 3000 already in use"
**Fix:** Use different port
```powershell
npm run dev -- -p 3001
```
Then use: http://localhost:3001

### Issue 3: "Cannot find module"
**Fix:** Reinstall dependencies
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue 4: "EACCES" or Permission Errors
**Fix:** Run terminal as Administrator, then:
```powershell
npm install
npm run dev
```

### Issue 5: Server Starts But Browser Shows Error
**Check:**
1. Look at terminal for specific error messages
2. Check browser console (F12) for errors
3. Verify all files are present

## Verification Checklist

Before running, verify:
- [ ] Node.js installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] In correct directory (`code` folder)
- [ ] `package.json` exists
- [ ] `node_modules` folder exists (after npm install)
- [ ] No error messages in terminal

## What Should Happen

1. Terminal shows: `npm run dev`
2. You see: `▲ Next.js 14.0.4`
3. You see: `- Local: http://localhost:3000`
4. You see: `✓ Ready in X seconds`
5. Browser opens to http://localhost:3000
6. Page redirects to `/builder`
7. You see the Resume Builder interface

## Still Not Working?

**Please share:**
1. Exact error message from terminal
2. What happens when you run `npm run dev`
3. Browser console errors (F12 → Console tab)

This will help identify the specific issue.
