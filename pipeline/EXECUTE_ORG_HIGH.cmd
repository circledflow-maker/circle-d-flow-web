@echo off
setlocal
cd /d "%~dp0.."
echo === Execute HIGH organization proposals (Arpan Upload -^> Arpan/events/Lapa71) ===
echo Requires token.json with Drive write scope.
if not exist token.json (
  echo token.json missing — running setup...
  python scripts\gdrive_setup.py
)
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
echo.
echo Dry-run first:
python pipeline\tools\execute_organization.py --dry-run
echo.
echo Execute HIGH moves:
python pipeline\tools\execute_organization.py --execute
echo.
echo Report: pipeline\reports\organization_execution_report.md
pause
endlocal
