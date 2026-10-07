@echo off
setlocal
cd /d "%~dp0.."
echo === EVENT_SELECTS / PERFORMANCE review ===
echo Roles: Piano Player TBD · Other Guitar TBD · Crowd
echo Thumbs: large + contain (no crop). Use --force-thumbs refresh below.
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
python pipeline\tools\build_event_selects_review.py --force-thumbs
echo.
start "" "pipeline\work\event_selects_review.html"
echo Assign artists/roles → download JSON → save as pipeline\data\unassigned_approvals.json
echo Then: pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
pause
endlocal
