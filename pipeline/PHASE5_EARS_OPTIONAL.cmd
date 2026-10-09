@echo off
setlocal
cd /d "%~dp0.."
echo === Phase 5 optional — ears on LOCAL proxies only ===
echo Uses intake_sort (stage 3) + ears sample (stage 4).
echo Edit LOCAL_ROOT if Botanica proxies live elsewhere.
set LOCAL_ROOT=D:\Wakungo_Content_Studio\Botanica
if not exist "%LOCAL_ROOT%" (
  echo Missing "%LOCAL_ROOT%"
  echo Create/set a folder with local proxies, or:
  echo   set LOCAL_ROOT=D:\path\to\proxies
  echo   pipeline\PHASE5_EARS_OPTIONAL.cmd
  pause
  exit /b 1
)
echo LOCAL_ROOT=%LOCAL_ROOT%
echo.
echo [1/2] Intake+ears plan on local tree (limit 40, no Drive moves)...
python pipeline\tools\orchestrate.py --only 3 --execute --local-root "%LOCAL_ROOT%" --event-name "Botanica 90s"
echo.
echo [2/2] Single-file ears smoke (auto-picks a proxy under LOCAL_ROOT)...
python pipeline\tools\orchestrate.py --only 4 --execute --local-root "%LOCAL_ROOT%"
echo.
echo Plans: pipeline\data\intake_plan.json
echo Run:   pipeline\data\orchestrator_last_run.json
echo Report: pipeline\reports\orchestrator_run_report.md
pause
endlocal
