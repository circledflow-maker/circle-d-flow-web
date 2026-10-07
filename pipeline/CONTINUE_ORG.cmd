@echo off
setlocal
cd /d "%~dp0.."
echo === Circle D Flow — Organization CONTINUE ===
echo 1) Pass-3 UNASSIGNED execute (1 move if pending)
echo 2) Ensure Botanica Artists folders
echo 3) Held gallery for last remaining files
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q

if not exist pipeline\data\unassigned_approvals.json (
  echo WARN: pipeline\data\unassigned_approvals.json missing — skipping execute
  goto ENSURE
)

echo.
echo === [1/3] Pass-3 / current approvals execute ===
python pipeline\tools\apply_unassigned_approvals.py --dry-run
echo.
python pipeline\tools\apply_unassigned_approvals.py --execute
echo Report: pipeline\reports\unassigned_execution.md

:ENSURE
echo.
echo === [2/3] Ensure Botanica Artists folders ===
python pipeline\tools\ensure_botanica_artists.py --dry-run
echo.
python pipeline\tools\ensure_botanica_artists.py --execute
echo Report: pipeline\reports\botanica_artists_ensure.md

echo.
echo === [3/3] Held review gallery (remaining) ===
python pipeline\tools\build_held_review_gallery.py --fetch-thumbs
start "" "pipeline\work\held_review.html"
echo Assign artists → download JSON → save as pipeline\data\unassigned_approvals.json
echo Then run: pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
echo.
echo Done with CONTINUE_ORG.
pause
endlocal
