@echo off
setlocal
cd /d "%~dp0.."
echo === Held UNASSIGNED review (12) — NO moves ===
echo DSC_1565 (Noua vs Wako) · DSC_1568 · DSC_1601
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
python pipeline\tools\build_held_review_gallery.py --fetch-thumbs
echo.
start "" "pipeline\work\held_review.html"
echo Assign artists → download JSON → save as pipeline\data\unassigned_approvals.json
echo Then: pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
pause
endlocal
