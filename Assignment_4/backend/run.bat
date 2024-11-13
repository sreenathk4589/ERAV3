@echo off
REM Activate virtual environment
call venv\Scripts\activate.bat

REM Set Flask environment variables
set FLASK_APP=wsgi:app
set FLASK_ENV=development
set FLASK_DEBUG=1
set PYTHONUNBUFFERED=1

REM Change to the backend directory
cd %~dp0

REM Kill any existing process on port 8000 (if any)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000"') do taskkill /F /PID %%a 2>nul

REM Run the Flask server
echo Starting Flask server...
python -u wsgi.py

pause 