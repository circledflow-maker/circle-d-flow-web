@echo off
setlocal
cd /d "%~dp0.."
chcp 65001 >nul 2>&1
echo === Phase 5 status (read-only) ===
echo.
if exist pipeline\data\phase5_complete.json (
  type pipeline\data\phase5_complete.json
) else (
  echo phase5_complete.json missing
)
echo.
if exist pipeline\data\drive_create_decision.json (
  echo Drive CREATE decision:
  type pipeline\data\drive_create_decision.json
)
echo.
echo Markers: phase5_lite_complete / phase5_ears_complete / phase5_intake_review_complete
echo Render stages 6-10 remain gated.
pause
endlocal
