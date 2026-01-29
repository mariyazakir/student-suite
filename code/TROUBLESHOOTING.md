# Troubleshooting Guide

## Issue: "localhost refused to connect"

### Common Causes & Solutions

### 1. Dependencies Not Installed
**Solution:**
```powershell
cd "c:\Users\mariy\.cursor\resume builder\code"
npm install
```

### 2. Server Not Started
**Solution:**
```powershell
npm run dev
```

Wait for the message:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### 3. Port 3000 Already in Use
**Solution A:** Kill the process using port 3000
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Solution B:** Use different port
```powershell
npm run dev -- -p 3001
```
Then use: http://localhost:3001

### 4. Node.js Not Installed
**Check:**
```powershell
node --version
npm --version
```

**If not installed:**
- Download from https://nodejs.org/
- Install Node.js 18 or higher
- Restart terminal

### 5. Missing Next.js Files
**Solution:**
```powershell
# Delete and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
npm install
npm run dev
```

### 6. TypeScript Errors
**Solution:**
```powershell
# Generate Prisma client (if using database)
npm run db:generate

# Check for errors
npx tsc --noEmit
```

## Quick Fix Script

I've created helper scripts for you:

### Windows (PowerShell):
```powershell
cd "c:\Users\mariy\.cursor\resume builder\code"
.\start.ps1
```

### Windows (Command Prompt):
```cmd
cd "c:\Users\mariy\.cursor\resume builder\code"
start.bat
```

## Manual Steps

1. **Open Terminal/PowerShell**
2. **Navigate:**
   ```powershell
   cd "c:\Users\mariy\.cursor\resume builder\code"
   ```
3. **Install (first time):**
   ```powershell
   npm install
   ```
4. **Start server:**
   ```powershell
   npm run dev
   ```
5. **Wait for:**
   ```
   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   ```
6. **Open browser:** http://localhost:3000

## Verify Installation

Check if everything is set up:
```powershell
# Check Node.js
node --version

# Check npm
npm --version

# Check if dependencies installed
Test-Path "node_modules"

# Check if package.json exists
Test-Path "package.json"
```

## Still Not Working?

1. Check terminal for error messages
2. Make sure you're in the `code` directory
3. Verify Node.js is installed
4. Try deleting `node_modules` and `.next` folders, then reinstall
