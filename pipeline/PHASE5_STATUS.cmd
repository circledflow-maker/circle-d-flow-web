@echo off
setlocal
cd /d "%~dp0.."
chcp 65001 >nul 2>&1
echo === Phase 5 status (read-only) ===
echo No Drive rediscovery. No render. No sorting.
echo.
if exist pipeline\data\phase5_complete.json (
  echo --- phase5_complete.json ---
  type pipeline\data\phase5_complete.json
) else (
  echo phase5_complete.json missing
)
echo.
if exist pipeline\data\phase5_intake_review_complete.json (
  echo --- intake review snapshot ---
  type pipeline\data\phase5_intake_review_complete.json
) else (
  echo phase5_intake_review_complete.json missing
)
echo.
if exist pipeline\data\drive_create_decision.json (
  echo --- Drive CREATE decision ---
  type pipeline\data\drive_create_decision.json
)
echo.
echo --- marker files ---
if exist pipeline\data\phase5_lite_complete.json echo   OK phase5_lite_complete.json
if exist pipeline\data\phase5_ears_complete.json echo   OK phase5_ears_complete.json
if exist pipeline\data\phase5_intake_review_complete.json echo   OK phase5_intake_review_complete.json
echo.
echo --- Windows-local plan artifacts (if present) ---
if exist pipeline\data\intake_plan.json (
  echo   OK intake_plan.json
) else (
  echo   missing intake_plan.json ^(only on the PC that ran ears^)
)
if exist pipeline\reports\intake_plan_review.md (
  echo   OK intake_plan_review.md  ^<- open this for the 34 review filenames
) else (
  echo   missing intake_plan_review.md
)
if exist pipeline\data\intake_plan_review.json (
  echo   OK intake_plan_review.json
) else (
  echo   missing intake_plan_review.json
)
echo.
echo Render stages 6-10 remain gated.
echo Drive CREATE: skip ^(ENSURE_BOTANICA_ARTISTS already done^).
echo Review queue: leave unassigned until you approve names.
pause
endlocal
