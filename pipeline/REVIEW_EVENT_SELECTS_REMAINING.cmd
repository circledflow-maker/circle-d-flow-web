@echo off
setlocal
cd /d "%~dp0.."
echo === EVENT_SELECTS PERFORMANCE — remaining only ===
echo Piano / Other Guitar / Crowd available. Large thumbs (no crop).
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
python pipeline\tools\build_event_selects_review.py --remaining-only --force-thumbs
echo.
start "" "pipeline\work\event_selects_review.html"
echo Assign → download JSON → save as pipeline\data\unassigned_approvals.json
echo Then: pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
pause
endlocal
