@echo off
setlocal
cd /d "%~dp0.."
echo === Botanica dual-format QA only (stamp 20261010_215349) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0BOTANICA_DUAL_FORMAT_QA.ps1" -Stamp 20261010_215349
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo QA_FAILED exit=%ERR%
  pause
  exit /b %ERR%
)
echo.
echo Open RESULT md under Botanica\00_work\test_render\
pause
endlocal
