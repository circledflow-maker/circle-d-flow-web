@echo off
setlocal
cd /d "%~dp0.."
echo === UNASSIGNED review (NO moves) ===
echo Builds review pack + optional Drive thumbnails only.
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
python pipeline\tools\review_unassigned.py
echo.
echo Fetch thumbnails? (closes after)
python pipeline\tools\review_unassigned.py --fetch-thumbs
echo.
echo Thumbs: pipeline\work\unassigned_thumbs\
echo Report: pipeline\reports\unassigned_review_pack.md
echo Match visually to BotanicaArtistPack\*\00_REF — then approve a move batch.
pause
endlocal
