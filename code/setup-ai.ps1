# PowerShell script to set up Gemini AI
Write-Host "=== AI Setup (Gemini) ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file found" -ForegroundColor Green
} else {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env.local"
    Write-Host "✓ Created .env.local file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Add your Gemini API key to .env.local:" -ForegroundColor Yellow
Write-Host "GOOGLE_API_KEY=your_key_here" -ForegroundColor Gray
Write-Host "GEMINI_MODEL=gemini-1.5-flash" -ForegroundColor Gray
Write-Host "GEMINI_TIMEOUT_MS=20000" -ForegroundColor Gray

# Try to open the file in notepad
$envFile = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envFile) {
    $open = Read-Host "Open .env.local file now? (y/n)"
    if ($open -eq 'y' -or $open -eq 'Y') {
        notepad $envFile
    }
}
