Write-Host "=== Resume Builder Setup Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js NOT installed. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm NOT found" -ForegroundColor Red
    exit 1
}

# Check if in correct directory
Write-Host "Checking directory..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✓ In correct directory" -ForegroundColor Green
} else {
    Write-Host "✗ package.json not found. Make sure you're in the 'code' directory" -ForegroundColor Red
    exit 1
}

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Dependencies not installed. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Check required files
Write-Host "Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "app/layout.tsx",
    "app/page.tsx",
    "app/builder/page.tsx",
    "components/resume/ResumeEditor.tsx",
    "components/resume/ResumePreview.tsx",
    "tailwind.config.js",
    "postcss.config.js",
    "tsconfig.json"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "✗ Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== All Checks Passed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

npm run dev
