$envContent = "GOOGLE_API_KEY=your_key_here`r`nGEMINI_MODEL=gemini-1.5-flash`r`nGEMINI_TIMEOUT_MS=20000`r`n`r`n# AI Mock Mode (set to 'true' to force mock responses)`r`n# AI_MOCK_MODE=false"

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline
Write-Host "Gemini settings added to .env.local" -ForegroundColor Green
