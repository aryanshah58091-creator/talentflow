@echo off
setlocal enabledelayedexpansion
title TalentFlow Master Launcher
cd /d %~dp0

echo =========================================================
echo               TALENTFLOW PLATFORM LAUNCHER
echo =========================================================
echo.

:: 1. Check if backend venv exists
if not exist backend\venv (
    echo [1/3] Backend virtual environment not found. Running setup...
    call setup.bat
)

:: 2. Check if frontend node_modules exists
if not exist frontend\node_modules (
    echo [2/3] Frontend node_modules not found. Installing packages...
    cd frontend
    call npm install
    cd ..
)

echo [3/3] Starting TalentFlow full-stack services...
echo.

:: 3. Launch Backend in separate titled window
start "TalentFlow Backend (Django API)" cmd /k "cd /d %~dp0 && call backend\venv\Scripts\activate && cd backend && python manage.py runserver 127.0.0.1:8000"

:: 4. Launch Frontend in separate titled window
start "TalentFlow Frontend (React + Vite)" cmd /k "cd /d %~dp0\frontend && npm run dev"

:: 5. Wait a moment for servers to start
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

:: 6. Open default browser
start http://localhost:5173/

cls
echo =========================================================
echo           TALENTFLOW IS RUNNING SUCCESSFULLY!
echo =========================================================
echo.
echo  * Web Application (UI) : http://localhost:5173/
echo  * Backend REST API     : http://127.0.0.1:8000/api/v1/
echo  * Swagger API Docs     : http://127.0.0.1:8000/api/docs/
echo  * Redoc API Docs       : http://127.0.0.1:8000/api/redoc/
echo  * Django Admin Panel   : http://127.0.0.1:8000/admin/
echo.
echo ---------------------------------------------------------
echo  DEMO LOGIN CREDENTIALS:
echo  - Recruiter : demo_recruiter  /  DemoPass123!
echo  - Candidate : demo_candidate  /  DemoPass123!
echo ---------------------------------------------------------
echo.
echo Keep this window open or close it when done.
pause
