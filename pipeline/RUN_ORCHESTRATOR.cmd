@echo off
setlocal
cd /d "%~dp0.."
echo === Content Pipeline orchestrator (dry-run metadata) ===
python pipeline\tools\orchestrate.py --list
echo.
python pipeline\tools\orchestrate.py --only 2,5,11
echo.
echo Report: pipeline\reports\orchestrator_run_report.md
echo Render stages stay gated. Use --execute --allow-render only when approved.
pause
endlocal
