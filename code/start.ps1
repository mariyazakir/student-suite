Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "`nStarting development server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "`n"

npm run dev
