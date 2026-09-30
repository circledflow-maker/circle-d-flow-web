@echo off
setlocal
cd /d "%~dp0.."
echo === Apply UNASSIGNED approvals (Drive moves) ===
if not exist pipeline\data\unassigned_approvals.json (
  echo Missing pipeline\data\unassigned_approvals.json
  echo Open the gallery, download JSON, save it there first.
  pause
  exit /b 1
)
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
echo.
echo Dry-run:
python pipeline\tools\apply_unassigned_approvals.py --dry-run
echo.
echo Execute:
python pipeline\tools\apply_unassigned_approvals.py --execute
echo.
echo Report: pipeline\reports\unassigned_execution.md
pause
endlocal
