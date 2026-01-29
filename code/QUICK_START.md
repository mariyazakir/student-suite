# 🚀 Quick Start - Get App Running in 3 Steps

## Method 1: Double-Click (Easiest)

1. **Double-click** `START_HERE.bat` in the `code` folder
2. Wait for server to start
3. Open browser to http://localhost:3000

## Method 2: Command Line

### Windows PowerShell:
```powershell
cd "c:\Users\mariy\.cursor\resume-builder\code"
npm install
npm run dev
```

### Windows Command Prompt:
```cmd
cd "c:\Users\mariy\.cursor\resume-builder\code"
npm install
npm run dev
```

## What You Should See

When server starts successfully:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

Then open: **http://localhost:3000**

## Troubleshooting

### "npm is not recognized"
→ Install Node.js from https://nodejs.org/

### "Port 3000 already in use"
→ Use different port: `npm run dev -- -p 3001`

### "Cannot find module"
→ Run: `npm install` again

### Still not working?
→ Check `FIX_NOT_OPENING.md` for detailed solutions
