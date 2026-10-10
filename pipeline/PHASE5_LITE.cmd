@echo off
setlocal
cd /d "%~dp0.."
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8
echo === Phase 5 lite - metadata QA + report (no Drive downloads) ===
echo Heavy render NOT enabled. Default orchestrator = plan / metadata only.
echo After PHASE5_EARS_OPTIONAL, QA should see intake_plan.json as present.
echo.
python pipeline\tools\orchestrate.py --list
echo.
echo Running stages 2,5,11 (project detect, QA gates, reporting)...
python pipeline\tools\orchestrate.py --only 2,5,11 --execute
echo.
echo Ears already green? Re-run optional smoke anytime:
echo   pipeline\PHASE5_EARS_OPTIONAL.cmd
echo.
echo Reports: pipeline\reports\  ^|  pipeline\data\orchestrator_last_run.json
pause
endlocal
