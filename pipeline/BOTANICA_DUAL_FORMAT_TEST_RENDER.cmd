@echo off
setlocal
cd /d "%~dp0.."
echo === Authorized Botanica dual-format 12s preview ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0BOTANICA_DUAL_FORMAT_TEST_RENDER.ps1"
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo PREFLIGHT_OR_RENDER_FAILED exit=%ERR%
  pause
  exit /b %ERR%
)
echo.
echo Open RESULT md under Botanica\00_work\test_render\
pause
endlocal
