@echo off
setlocal
cd /d "%~dp0.."
echo === Authorized Botanica 12s preview (Windows + D: required) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0BOTANICA_TEST_RENDER_12S.ps1"
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo PREFLIGHT_OR_RENDER_FAILED exit=%ERR%
  pause
  exit /b %ERR%
)
echo.
echo Open the RESULT md under Botanica\00_work\test_render\
pause
endlocal
