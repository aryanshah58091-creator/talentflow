@echo off
setlocal
cd /d %~dp0
if not exist backend\venv (
  py -3.14 -m venv backend\venv
)
call backend\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
cd backend
python manage.py makemigrations accounts companies jobs applications
python manage.py migrate
python manage.py seed_demo
cd ..
if not exist .env copy .env.example .env >nul
echo.
echo TalentFlow backend setup complete.
echo Demo recruiter: demo_recruiter / DemoPass123!
echo Demo candidate: demo_candidate / DemoPass123!
echo.
echo Start backend with: run_backend.bat
pause
