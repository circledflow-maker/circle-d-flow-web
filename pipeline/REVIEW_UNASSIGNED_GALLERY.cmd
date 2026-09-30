@echo off
setlocal
cd /d "%~dp0.."
echo === UNASSIGNED gallery (NO moves) ===
echo Fetches 00_REF thumbs if needed, builds HTML gallery.
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
python pipeline\tools\review_unassigned.py --fetch-refs --gallery
echo.
echo Opening gallery...
start "" "pipeline\work\unassigned_review.html"
echo.
echo 1) Assign artists (refs strip at top)
echo 2) Download approvals JSON
echo 3) Save as: pipeline\data\unassigned_approvals.json
echo 4) Run: pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
pause
endlocal
