@echo off
REM Double-click or run from cmd/PowerShell - no PS1 parsing needed
cd /d "%~dp0"
echo Pulling latest scripts into repo (optional - skip if offline)...
cd /d "%~dp0..\.."
git fetch origin cursor/botanica-90s-recap-pipeline-f46a
git checkout origin/cursor/botanica-90s-recap-pipeline-f46a -- scripts/botanica_90s_recap Assets/content/botanica/refs
cd /d "%~dp0"
python run_wako_full_pipeline.py
echo.
echo Exit code: %ERRORLEVEL%
pause
