@echo off
cd %~dp0
set PYTHONPATH=%PYTHONPATH%;%~dp0
python run.py
pause 