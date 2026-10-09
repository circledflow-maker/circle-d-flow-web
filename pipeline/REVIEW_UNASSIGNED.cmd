@echo off
setlocal
cd /d "%~dp0.."
echo === UNASSIGNED review (NO moves) ===
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
python pipeline\tools\review_unassigned.py --fetch-thumbs
echo.
echo Next: fetch 00_REF + open gallery
pipeline\REVIEW_UNASSIGNED_GALLERY.cmd
endlocal
