# Launcher: set env, encode DSC_1538, then hand off to ordered orchestrator
$ErrorActionPreference = 'Continue'
$env:LAPA71_SRC = 'F:\Part4'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$env:LAPA71_FAST = '1'
$env:TF_CPP_MIN_LOG_LEVEL = '2'
$env:TF_ENABLE_ONEDNN_OPTS = '0'

$logDir = Join-Path $env:LAPA71_OUT '00_logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$py = 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py'
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path (Join-Path $logDir 'part4_ordered.log') -Value "[$stamp] LAUNCHER: start compress dsc_1538 then ordered"

# Clear stale partials that could confuse progress / resume
Remove-Item (Join-Path $env:TEMP 'lapa71_proxies\DSC_1511_proxy_1080p.partial.mp4') -Force -EA SilentlyContinue

# Encode 1538 first (blocking in this process — one ffmpeg)
& python $py --compress dsc_1538
$c = $LASTEXITCODE
Add-Content -Path (Join-Path $logDir 'part4_ordered.log') -Value ("[{0:HH:mm:ss}] LAUNCHER: 1538 compress exit={1}" -f (Get-Date), $c)
if ($c -ne 0) {
    Add-Content -Path (Join-Path $logDir 'part4_ordered.log') -Value "[$(Get-Date -Format HH:mm:ss)] LAUNCHER ABORT: 1538 failed"
    exit $c
}

# Continue ordered phases (small -> faces -> 1511 -> agents)
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\circle-d-flow-web\scripts\lapa71_ordered_after_1538.ps1'
exit $LASTEXITCODE
