@echo off
setlocal enabledelayedexpansion
title TalentFlow Setup
cd /d %~dp0

echo =========================================================
echo              TALENTFLOW COMPLETE SETUP
echo =========================================================
echo.

:: 1. Copy .env if missing
if not exist .env (
    echo [*] Creating .env from .env.example...
    copy .env.example .env >nul
)

:: 2. Create Python virtual environment
if not exist backend\venv (
    echo [*] Creating Python virtual environment...
    python -m venv backend\venv 2>nul || py -m venv backend\venv
)

:: 3. Install Backend Dependencies
echo [*] Installing backend dependencies...
call backend\venv\Scripts\activate
python -m pip install --upgrade pip --quiet
pip install -r backend\requirements.txt --quiet

:: 4. Apply Database Migrations & Seed Demo Data
echo [*] Initializing database and migrations...
cd backend
python manage.py migrate
python manage.py seed_demo
cd ..

:: 5. Install Frontend Dependencies
echo [*] Installing frontend npm packages...
cd frontend
if not exist node_modules (
    call npm install
)
cd ..

cls
echo =========================================================
echo           TALENTFLOW SETUP COMPLETED SUCCESSFULLY!
echo =========================================================
echo.
echo  * Database initialized with seed data.
echo  * Backend dependencies installed in backend\venv.
echo  * Frontend dependencies installed in frontend\node_modules.
echo.
echo ---------------------------------------------------------
echo  DEMO CREDENTIALS:
echo  - Recruiter : demo_recruiter  /  DemoPass123!
echo  - Candidate : demo_candidate  /  DemoPass123!
echo ---------------------------------------------------------
echo.
echo  TO START EVERYTHING IN 1-CLICK:
echo    Double-click: run.bat
echo.
pause
