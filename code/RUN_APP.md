# 🚀 How to Run the App

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt
Open PowerShell, Command Prompt, or your preferred terminal.

### 2. Navigate to Code Directory
```powershell
cd "c:\Users\mariy\.cursor\resume-builder\code"
```

Or if you're already in the resume-builder folder:
```powershell
cd code
```

### 3. Install Dependencies (First Time Only)
```powershell
npm install
```

This will install all required packages. Wait for it to complete.

### 4. Start Development Server
```powershell
npm run dev
```

### 5. Wait for Server to Start
You should see output like:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### 6. Open Browser
Open your browser and go to:
```
http://localhost:3000
```

The app will automatically redirect to `/builder`.

## Troubleshooting

### If "npm is not recognized":
1. Install Node.js from https://nodejs.org/
2. Restart your terminal
3. Verify: `node --version` and `npm --version`

### If Port 3000 is Already in Use:
```powershell
npm run dev -- -p 3001
```
Then use: http://localhost:3001

### If Dependencies Fail to Install:
```powershell
# Clear cache and retry
npm cache clean --force
npm install
```

### If You See Build Errors:
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## Quick Commands Reference

```powershell
# Navigate to project
cd "c:\Users\mariy\.cursor\resume-builder\code"

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (optional)
npm run build

# Start production server (after build)
npm start
```

## What to Expect

Once the server starts, you should see:
- ✅ "Ready" message in terminal
- ✅ Local URL (usually http://localhost:3000)
- ✅ No error messages

Then open the URL in your browser to see the Resume Builder!
