$ErrorActionPreference = 'Continue'
$env:TF_CPP_MIN_LOG_LEVEL = '2'
$env:TF_ENABLE_ONEDNN_OPTS = '0'
$env:LAPA71_SRC = 'F:\lapa part2'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$log = Join-Path $env:LAPA71_OUT '00_logs\part2_runner.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function L($m) {
    $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

L 'Lapa71 part2 start - source F:\lapa part2'
& python 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py' @args
$code = $LASTEXITCODE
L "exit=$code"
