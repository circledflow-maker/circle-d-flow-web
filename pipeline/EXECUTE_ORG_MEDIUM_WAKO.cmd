@echo off
setlocal
cd /d "%~dp0.."
echo === MEDIUM batch: Botanica/Wako Kungo- botanica -^> Artists/Wako Kungo/Botanica ===
echo 56 files. Does NOT touch _UNASSIGNED_REVIEW.
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
if not exist token.json (
  python scripts\gdrive_setup.py --force
)
echo.
echo Dry-run:
python pipeline\tools\execute_organization.py --batch medium-wako --dry-run
echo.
echo Execute:
python pipeline\tools\execute_organization.py --batch medium-wako --execute
echo.
echo Report: pipeline\reports\organization_execution_medium_wako.md
pause
endlocal
