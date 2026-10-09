@echo off
setlocal
cd /d "%~dp0.."
echo === Ensure Botanica Artists folders (Arpan schema + events/Botanica) ===
echo Felippe Sax, Noua, Diaza, Joao Redondo Maia, Lyssa, Zeus Atro, Silso
echo.
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 -q
echo Dry-run:
python pipeline\tools\ensure_botanica_artists.py --dry-run
echo.
echo Execute:
python pipeline\tools\ensure_botanica_artists.py --execute
echo.
echo Report: pipeline\reports\botanica_artists_ensure.md
pause
endlocal
