# TalentFlow PowerShell Launcher
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "             TALENTFLOW PLATFORM LAUNCHER               " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Setup backend if venv missing
$venvPath = Join-Path $scriptDir "backend\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "[1/3] Backend virtual environment not found. Setting up..." -ForegroundColor Yellow
    Push-Location $scriptDir
    cmd.exe /c setup.bat
    Pop-Location
}

# 2. Setup frontend if node_modules missing
$nodeModulesPath = Join-Path $scriptDir "frontend\node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "[2/3] Frontend node_modules not found. Installing packages..." -ForegroundColor Yellow
    Push-Location (Join-Path $scriptDir "frontend")
    npm install
    Pop-Location
}

Write-Host "[3/3] Starting TalentFlow full-stack services..." -ForegroundColor Green

# 3. Launch Backend in separate PowerShell window
$backendCmd = "cd '$scriptDir\backend'; & '$scriptDir\backend\venv\Scripts\python.exe' manage.py runserver 127.0.0.1:8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# 4. Launch Frontend in separate PowerShell window
$frontendCmd = "cd '$scriptDir\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# 5. Wait for servers
Start-Sleep -Seconds 3

# 6. Open Browser
Start-Process "http://localhost:5173/"

Clear-Host
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "          TALENTFLOW IS RUNNING SUCCESSFULLY!            " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  * Web Application (UI) : http://localhost:5173/" -ForegroundColor White
Write-Host "  * Backend REST API     : http://127.0.0.1:8000/api/v1/" -ForegroundColor White
Write-Host "  * Swagger API Docs     : http://127.0.0.1:8000/api/docs/" -ForegroundColor White
Write-Host "  * Redoc API Docs       : http://127.0.0.1:8000/api/redoc/" -ForegroundColor White
Write-Host "  * Django Admin Panel   : http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host ""
Write-Host "---------------------------------------------------------" -ForegroundColor Gray
Write-Host "  DEMO LOGIN CREDENTIALS:" -ForegroundColor Yellow
Write-Host "  - Recruiter : demo_recruiter  /  DemoPass123!" -ForegroundColor Yellow
Write-Host "  - Candidate : demo_candidate  /  DemoPass123!" -ForegroundColor Yellow
Write-Host "---------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to exit this launcher window (servers will continue running)..."
Read-Host
