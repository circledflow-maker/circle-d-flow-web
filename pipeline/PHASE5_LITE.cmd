@echo off
setlocal
cd /d "%~dp0.."
echo === Phase 5 lite — metadata QA + report (no Drive downloads) ===
echo Heavy render NOT enabled. Default orchestrator = plan / metadata only.
echo.
python pipeline\tools\orchestrate.py --list
echo.
echo Running stages 2,5,11 (project detect, QA gates, reporting)...
python pipeline\tools\orchestrate.py --only 2,5,11 --execute
echo.
echo Optional ears on LOCAL proxies only (edit path if needed):
echo   python pipeline\tools\orchestrate.py --only 4 --execute --local-root "D:\Wakungo_Content_Studio\Botanica"
echo.
echo Reports: pipeline\reports\  ^|  pipeline\data\orchestrator_last_run.json
pause
endlocal
