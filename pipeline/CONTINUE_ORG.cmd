@echo off
setlocal
cd /d "%~dp0.."
echo === Circle D Flow — CONTINUE (post PERFORMANCE assign) ===
echo PERFORMANCE leftovers stay put — no more artist assign.
echo Next: Ensure Botanica Artists folders.
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q

echo.
echo === Ensure Botanica Artists folders ===
python pipeline\tools\ensure_botanica_artists.py --dry-run
echo.
python pipeline\tools\ensure_botanica_artists.py --execute
echo Report: pipeline\reports\botanica_artists_ensure.md
echo.
echo Done. Next later: Phase 5 proxy/ears QA (optional).
pause
endlocal
