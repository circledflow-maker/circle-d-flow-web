@echo off
setlocal
cd /d "%~dp0.."
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8
echo === Phase 5 - intake plan review (read-only) ===
echo Summarizes pipeline\data\intake_plan.json from ears/intake run.
echo No Drive moves. No render.
echo.
if not exist "pipeline\data\intake_plan.json" (
  echo Missing pipeline\data\intake_plan.json
  echo Run pipeline\PHASE5_EARS_OPTIONAL.cmd first.
  pause
  exit /b 1
)
python pipeline\tools\intake_plan_review.py
echo.
echo Drive CREATE proposals: usually already covered by ENSURE_BOTANICA_ARTISTS - do not re-create.
echo Optional better ears sample after pull: pipeline\PHASE5_EARS_OPTIONAL.cmd
echo QA refresh: pipeline\PHASE5_LITE.cmd
pause
endlocal
