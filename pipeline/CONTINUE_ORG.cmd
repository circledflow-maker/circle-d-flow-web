@echo off
setlocal
cd /d "%~dp0.."
echo === Circle D Flow — Organization CONTINUE ===
echo 1) Place B-roll closeout (7 venue frames -^> Botanica/PLACE_BROLL)
echo 2) Ensure Botanica Artists folders
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q

echo.
echo === [1/2] Place B-roll / current approvals execute ===
python pipeline\tools\apply_unassigned_approvals.py --dry-run
echo.
python pipeline\tools\apply_unassigned_approvals.py --execute
echo Report: pipeline\reports\unassigned_execution.md

echo.
echo === [2/2] Ensure Botanica Artists folders ===
python pipeline\tools\ensure_botanica_artists.py --dry-run
echo.
python pipeline\tools\ensure_botanica_artists.py --execute
echo Report: pipeline\reports\botanica_artists_ensure.md

echo.
echo UNASSIGNED artist queue closed. Place frames -^> Botanica/PLACE_BROLL.
echo Done with CONTINUE_ORG.
pause
endlocal
