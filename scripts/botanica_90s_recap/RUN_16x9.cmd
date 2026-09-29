@echo off
REM Force-sync Botanica 16:9 script from git (ignores local membership conflicts), then run.
setlocal
cd /d "%~dp0..\.."
echo === Sync scripts/botanica_90s_recap from origin ===
git fetch origin cursor/botanica-90s-recap-pipeline-f46a
if errorlevel 1 (
  echo FAIL: git fetch
  exit /b 1
)
git checkout -f origin/cursor/botanica-90s-recap-pipeline-f46a -- scripts/botanica_90s_recap
if errorlevel 1 (
  echo FAIL: git checkout scripts
  exit /b 1
)
echo.
echo === Run 16:9 full-frame reel ===
python "scripts\botanica_90s_recap\run_botanica_recap_16x9.py" --root "D:\Wakungo_Content_Studio\Botanica" --force %*
echo.
echo Exit code: %ERRORLEVEL%
echo Open: D:\Wakungo_Content_Studio\Botanica\EXPORT\BOTANICA_90s_RECAP_16x9.mp4
pause
endlocal
