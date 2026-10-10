@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
REM Prefer UTF-8 console so intake_sort artist names do not crash on cp1252.
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8
REM Prefer proxies; skip already-organized EVENT_SELECTS shot_* dumps.
set CDF_INTAKE_INCLUDE_PROXIES=1
set CDF_INTAKE_SKIP_EVENT_SELECTS=1
echo === Phase 5 optional - ears on LOCAL proxies only ===
echo Stage 3: intake on proxies (skips EVENT_SELECTS). Stage 4: one-file ears smoke.
echo.

set BOTANICA=D:\Wakungo_Content_Studio\Botanica
set LOCAL_ROOT=%BOTANICA%

REM Optional arg = explicit root. If missing, fall back to Botanica (do not hard-fail).
if not "%~1"=="" (
  if exist "%~1\" (
    set LOCAL_ROOT=%~1
  ) else (
    echo WARN: "%~1" not found - falling back to %BOTANICA%
  )
)

REM Auto-pick a better root only when that folder exists on this PC.
if /I "%LOCAL_ROOT%"=="%BOTANICA%" (
  if exist "%BOTANICA%\03_Proxies_Compressed\" (
    set LOCAL_ROOT=%BOTANICA%\03_Proxies_Compressed
  ) else if exist "%BOTANICA%\04_videos_compressed\" (
    set LOCAL_ROOT=%BOTANICA%\04_videos_compressed
  ) else if exist "%BOTANICA%\03_Proxies\" (
    set LOCAL_ROOT=%BOTANICA%\03_Proxies
  )
)

if not exist "%LOCAL_ROOT%\" (
  echo Missing "%LOCAL_ROOT%"
  echo Examples:
  echo   pipeline\PHASE5_EARS_OPTIONAL.cmd
  echo   pipeline\PHASE5_EARS_OPTIONAL.cmd D:\Wakungo_Content_Studio\Botanica
  echo   pipeline\PHASE5_EARS_OPTIONAL.cmd D:\path\to\artist_proxies
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
if errorlevel 1 (
  echo Stage 4 failed - often odd ffmpeg stats on silent clips; pull latest ears.py fix and retry.
)
echo.
echo Plans: pipeline\data\intake_plan.json
echo Run:   pipeline\data\orchestrator_last_run.json
echo Report: pipeline\reports\orchestrator_run_report.md
echo.
echo Note: folder 03_Proxies_Compressed may not exist on this PC - default uses Botanica root.
echo If stage 3 inventory empty, pass a real proxy/pack folder as arg.
pause
endlocal
