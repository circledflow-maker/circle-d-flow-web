@echo off
setlocal
cd /d "%~dp0.."
echo === Phase 5 optional — ears on LOCAL proxies only ===
echo Edit LOCAL_ROOT if your Botanica proxies live elsewhere.
set LOCAL_ROOT=D:\Wakungo_Content_Studio\Botanica
if not exist "%LOCAL_ROOT%" (
  echo Missing %LOCAL_ROOT%
  echo Set a folder that has local proxies/compressed media, then re-run.
  pause
  exit /b 1
)
python pipeline\tools\orchestrate.py --only 4 --execute --local-root "%LOCAL_ROOT%"
echo.
echo See pipeline\data\orchestrator_last_run.json
pause
endlocal
