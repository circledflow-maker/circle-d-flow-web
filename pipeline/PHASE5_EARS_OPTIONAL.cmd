@echo off
setlocal
cd /d "%~dp0.."
REM Prefer UTF-8 console so intake_sort artist names do not crash on cp1252.
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8
REM Prefer proxies; skip already-organized EVENT_SELECTS shot_* dumps.
set CDF_INTAKE_INCLUDE_PROXIES=1
set CDF_INTAKE_SKIP_EVENT_SELECTS=1
echo === Phase 5 optional - ears on LOCAL proxies only ===
echo Stage 3: intake on proxies (skips EVENT_SELECTS). Stage 4: one-file ears smoke.
echo Edit LOCAL_ROOT if artist proxies live elsewhere.
set LOCAL_ROOT=D:\Wakungo_Content_Studio\Botanica
if not "%~1"=="" set LOCAL_ROOT=%~1
if not exist "%LOCAL_ROOT%" (
  echo Missing "%LOCAL_ROOT%"
  echo Create/set a folder with local proxies, or:
  echo   pipeline\PHASE5_EARS_OPTIONAL.cmd D:\path\to\proxies
  pause
  exit /b 1
)
echo LOCAL_ROOT=%LOCAL_ROOT%
echo CDF_INTAKE_INCLUDE_PROXIES=%CDF_INTAKE_INCLUDE_PROXIES%
echo CDF_INTAKE_SKIP_EVENT_SELECTS=%CDF_INTAKE_SKIP_EVENT_SELECTS%
echo.
echo [1/2] Intake+ears plan (proxies, no EVENT_SELECTS, no Drive moves)...
python pipeline\tools\orchestrate.py --only 3 --execute --local-root "%LOCAL_ROOT%" --event-name "Botanica 90s"
if errorlevel 1 (
  echo Stage 3 failed - see tail above or pipeline\data\orchestrator_last_run.json
)
echo.
echo [2/2] Single-file ears smoke (auto-picks under LOCAL_ROOT)...
python pipeline\tools\orchestrate.py --only 4 --execute --local-root "%LOCAL_ROOT%"
echo.
echo Plans: pipeline\data\intake_plan.json
echo Run:   pipeline\data\orchestrator_last_run.json
echo Report: pipeline\reports\orchestrator_run_report.md
echo.
echo If stage 3 inventory is empty: local tree has no proxies outside EVENT_SELECTS.
echo   Point LOCAL_ROOT at 03_Proxies_Compressed or an artist pack folder.
pause
endlocal
