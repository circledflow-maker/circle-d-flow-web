@echo off
setlocal
cd /d "%~dp0.."
echo === MEDIUM skip-sibling moves (single-sibling only) ===
echo Does NOT touch DSC_1568 / DSC_1601 / mixed 1565
echo.
python pipeline\tools\build_skip_sibling_approvals.py
copy /Y pipeline\data\unassigned_skip_sibling_approvals.json pipeline\data\unassigned_approvals.json
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
echo Dry-run:
python pipeline\tools\apply_unassigned_approvals.py --dry-run
echo.
echo Execute:
python pipeline\tools\apply_unassigned_approvals.py --execute
echo.
echo Report: pipeline\reports\unassigned_execution.md
pause
endlocal
