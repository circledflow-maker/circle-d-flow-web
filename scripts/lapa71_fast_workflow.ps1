# Lapa71 FAST workflow -- 1 ffmpeg, 3 phases, resume-safe
# 1) photos  2) compress small-to-large (no Face/loudnorm)  3) face-sort from 1080p proxies
$ErrorActionPreference = 'Continue'
$env:TF_CPP_MIN_LOG_LEVEL = '2'
$env:TF_ENABLE_ONEDNN_OPTS = '0'
$env:LAPA71_SRC = 'F:\Part4'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$env:LAPA71_FAST = '1'
$py = 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py'
$log = Join-Path $env:LAPA71_OUT '00_logs\part4_fast.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function L($m) {
    $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

$busy = @(Get-Process ffmpeg -EA SilentlyContinue)
if ($busy.Count -gt 0) {
    L ("ABORT: ffmpeg already running pid " + ($busy.Id -join ','))
    exit 3
}

L "FAST workflow start"
L "phase 1/3 photos"
& python $py --photos
L ("photos exit=" + $LASTEXITCODE)

L "phase 2/3 compress (small first, large last)"
& python $py --compress
L ("compress exit=" + $LASTEXITCODE)

L "phase 3/3 face-sort + Stages cuts from proxies"
& python $py --faces
L ("faces exit=" + $LASTEXITCODE)
L "FAST workflow done"
exit $LASTEXITCODE
