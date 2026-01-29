@echo off
echo ========================================
echo Resume Builder - Starting Application
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js found

echo.
echo Step 2: Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not found!
    pause
    exit /b 1
)
echo OK: npm found

echo.
echo Step 3: Checking if dependencies are installed...
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo OK: Dependencies found
)

echo.
echo Step 4: Starting development server...
echo.
echo ========================================
echo Server will be available at:
echo http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
