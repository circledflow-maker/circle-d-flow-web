@echo off
setlocal
cd /d "%~dp0..\.."
git fetch origin cursor/content-pipeline-arpan-ears-f46a
git checkout -f origin/cursor/content-pipeline-arpan-ears-f46a -- scripts/content_pipeline
echo.
echo === Arpan inventory ===
python scripts\content_pipeline\intake_sort.py --artist Arpan --inventory-only
echo.
echo === Botanica intake (ears + sort plan) ===
python scripts\content_pipeline\intake_sort.py --source "D:\Wakungo_Content_Studio\Botanica" --event "Botanica 90s" --limit 40 --propose-drive-create %*
echo.
echo Plan JSON under Botanica\ANALYSIS\content_pipeline_intake_plan.json
pause
endlocal
