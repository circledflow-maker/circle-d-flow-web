@echo off
setlocal
cd /d "%~dp0.."
echo === Botanica 90s DRAFT 16:9 (1280x720) — authorized one preview ===
echo Root: D:\Wakungo_Content_Studio\Botanica
echo Safety: no Drive / no EXPORT master / no 9:16 / no artist pack
echo.
python scripts\botanica_90s_recap\run_botanica_draft_16x9.py --root "D:\Wakungo_Content_Studio\Botanica" --render --threads 2
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo DRAFT_FAILED exit=%ERR%
  pause
  exit /b %ERR%
)
echo.
echo Open 00_work\preview\ for BOTANICA_90s_YOUTUBE_DRAFT_16x9_*.mp4 and QA md
echo STOP — await approval before final / 9:16 / packs
pause
endlocal
