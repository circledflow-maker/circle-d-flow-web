@echo off
setlocal
cd /d "%~dp0.."
echo === HIGH org moves: Lapa71/Arpan Upload -^> Artists/Arpan/events/Lapa71 ===
echo.
echo FIX for 403 appNotAuthorizedToFile:
echo   Old token was drive.file/readonly. Need FULL Drive scope.
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
echo.
echo [1/3] Force re-auth with full Drive write scope...
python scripts\gdrive_setup.py --force
if errorlevel 1 (
  echo AUTH FAILED
  pause
  exit /b 1
)
echo.
echo [2/3] Dry-run...
python pipeline\tools\execute_organization.py --dry-run
echo.
echo [3/3] Execute HIGH moves...
python pipeline\tools\execute_organization.py --execute
echo.
echo Report: pipeline\reports\organization_execution_report.md
pause
endlocal
